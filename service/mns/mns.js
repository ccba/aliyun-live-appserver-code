const promise = require("promise");
const request = require("request");
const url = require("url");
request.requestP = promise.denodeify(request);
request.debug = false;
const xml2js = require("xml2js");
xml2js.parseStringP = promise.denodeify(xml2js.parseString);
const xmlBuilder = require("xmlbuilder");
const util = require("util");

const signature = require("../signature");
const config = require('../../config.js');
const ram = require('../ali/ram');
const dqUtil = require('../../util/util');

class MNS {
  // Send the request
  // method: GET, POST, PUT, DELETE
  // url: request url
  // body: optional, request body
  // head: optional, request heads
  // options: optional, request options
  static request(method, urlString, body, headers, options) {
    var req = {
      method: method,
      url: urlString
    };
    if (body) req.body = xmlBuilder.create(body).toString();

    req.headers = MNS.makeHeaders(method, urlString, headers, req.body);

    // combines options
    if (options) {
      for (var opt in options) {
        if (opt === "method" || opt === "url" || opt === "uri" || opt === "body" || opt === "headers")
          continue; // skip these options for avoid conflict to other arguments
        else if (options.hasOwnProperty(opt))
          req[opt] = options[opt];
      }
    }
    console.log(`开始第三方请求：${req.url} 请求参数：${JSON.stringify(req)}`);
    var ret = request.requestP(req).then((response) => {
      // convert the body from xml to json
      return xml2js.parseStringP(response.body, {
          explicitArray: false
        })
        .then((bodyJSON) => {
          response.bodyJSON = bodyJSON;
          return response;
        }, () => {
          // cannot parse as xml
          response.bodyJSON = response.body;
          return response;
        });
    }).then((response) => {
      if (response.statusCode < 400) { // 200 okay!
        let result = {
          code: 200,
          data: response.bodyJSON
        };
        console.log(`结束第三方请求：${req.url} 返回值：${JSON.stringify(result)}`);
        return promise.resolve(result);
      } else {
        if (response.bodyJSON) {
          let result = {
            code: response.statusCode,
            message: response.bodyJSON.Error ? response.bodyJSON.Error.Message : response.bodyJSON
          };
          console.log(`结束第三方请求：${req.url} 返回值：${JSON.stringify(result)} x-mns-user-request-id=${response.bodyJSON.Error ? response.bodyJSON.Error.RequestId:""}`);
          return promise.reject(result);
        } else {
          let result = {
            code: response.statusCode,
            message: "MNS请求错误"
          };
          console.log(`结束第三方请求：${req.url} 返回值：${JSON.stringify(result)}`);
          return promise.reject(result);
        }
      }
    });

    return ret;
  }

  static makeHeaders(mothod, urlString, headers, body) {
    // if not exist, create one
    if (!headers) headers = {
      "User-Agent": "Node/" + process.version + " (" + process.platform + ")"
    };

    let contentMD5 = "";
    let contentType = "";
    if (body) {
      // if (!headers["Content-Length"]) headers["Content-Length"] = body.length;
      // if (!headers["Content-Type"]) headers["Content-Type"] = "text/xml;charset=utf-8";
      // contentType = headers["Content-Type"];
      // contentMD5 = signature.base64MD5(body);
      // headers["Content-MD5"] = contentMD5;
    }

    // `Date` & `Host` will be added by request automatically
    if (!headers["x-mns-version"]) headers["x-mns-version"] = config.ali.mnsVersion;
    if (!headers['x-mns-user-request-id']) headers['x-mns-user-request-id'] = dqUtil.random(9);

    // lowercase & sort & extract the x-mns-<any>
    let headsLower = {};
    let keys = [];
    for (let key in headers) {
      if (headers.hasOwnProperty(key)) {
        let lower = key.toLowerCase();
        keys.push(lower);
        headsLower[lower] = headers[key];
      }
    }

    keys.sort();

    let mnsHeaders = "";
    for (let i in keys) {
      let k = keys[i];
      if (k.indexOf("x-mns-") === 0) {
        mnsHeaders += util.format("%s:%s\n", k, headsLower[k]);
      }
    }

    let tm = (new Date()).toUTCString();
    let mnsURL = url.parse(urlString);
    headers.Date = tm;
    headers.Authorization = MNS.authorize(mothod, mnsURL.path,
      mnsHeaders, contentType, contentMD5, tm);
    headers.Host = mnsURL.host;

    return headers;
  }

  // ali mns authorize header
  static authorize(httpVerb, mnsURI, mnsHeaders, contentType, contentMD5, tm) {
    return util.format("MNS %s:%s", config.ali.accessKeyID,
      MNS.sign(httpVerb, mnsURI, mnsHeaders, contentType, contentMD5, tm));
  }

  // ali mns signature
  static sign(httpVerb, mnsURI, mnsHeaders, contentType, contentMD5, tm) {
    var text = util.format("%s\n%s\n%s\n%s\n%s%s",
      httpVerb, contentMD5, contentType, tm,
      mnsHeaders, mnsURI);
    return signature.hmac(text);
  }

}

module.exports = MNS;
