const promise = require("promise");
const request = require("request");
request.requestP = promise.denodeify(request);
const qs = require('querystring');
const config = require('../../config');
const signature = require('../signature');
const util = require('../../util/util');

class AliRequest {
  // Send the request
  // method: GET, POST, PUT, DELETE
  // url: request url
  // body: optional, request body
  // head: optional, request heads
  // options: optional, request options
  static get(urlString, query) {
    var req = {
      method: 'GET',
      url: urlString
    };
    if (!query) {
      query = {};
    }

    AliRequest.addCommonQuery(query);
    req.url = AliRequest.makdeUrl(urlString, query);

    console.log(`开始第三方请求：${req.url} 请求参数：${JSON.stringify(req)}`);
    var ret = request.requestP(req).then((response) => {
      if (response.statusCode < 400) { // 200 okay!
        let data = response.body.data ? response.body.data : response.body;
        let result = {
          code: 200,
          data: data ? JSON.parse(data) : ""
        };
        console.log(`结束第三方请求：${req.url} 返回值：${JSON.stringify(result)}`);
        return promise.resolve(result);
      } else {
        let data = response.body ? JSON.parse(response.body) : {
          code: response.statusCode,
          message: "请求失败"
        };
        let result = {
          code: response.statusCode,
          message: `${data.Code}-${data.Message}`
        };
        console.log(`结束第三方请求：${req.url} 返回值：${JSON.stringify(result)}`);
        return promise.reject(result);
      }
    });
    return ret;
  }

  static addCommonQuery(query) {

    query['Timestamp'] = (new Date(parseInt(new Date().getTime() / 1000) * 1000).toISOString()).replace(/.000Z/g, 'Z')
    query['SignatureNonce'] = util.random(8)
      // query['ClientToken'] = util.uuid()

    query = Object.assign(query, config.ali.commonParams);
    let signatureStr = signature.aliSign(query);
    query['Signature'] = signatureStr;
  }

  static makdeUrl(url, query) {
    return url + '/?' + qs.stringify(query)
  }
}

module.exports = AliRequest;
