const crypto = require("crypto");
const config = require('../config.js');
const util = require('../util/util');
class Signature {

  static aliSign(parameters) {
    let keySecret = parameters['AccessKeySecret'];
    if (!keySecret)
      keySecret = config.ali.accessKeySecret;
    delete parameters['AccessKeySecret'];

    let keys = util.getObjectKeys(parameters);
    keys.sort();

    let canonicalizedQueryString = "";
    keys.forEach((key) => {
      canonicalizedQueryString += "&" + Signature._percentencode(key) + "=" + Signature._percentencode(parameters[key]);
    });
    let stringToSign = "GET&%2F&" + Signature._percentencode(canonicalizedQueryString.substr(1));
    return Signature.hmac(stringToSign, keySecret + "&");
  }

  static selfSign(content) {
    let signString = Signature.hmac(content);
    return `MNS${config.ali.accessKeyID}:${signString}`
  }

  static hmac(string, secret, signType = 'sha1') {
    if (!secret)
      secret = config.ali.accessKeySecret;
    return crypto.createHmac(signType, secret).update(string, 'utf8').digest("base64");
  }

  static base64MD5(content) {
    let cryptoMD5 = crypto.createHash("md5");
    let md5HEX = cryptoMD5.update(content).digest("hex");
    let buf = new Buffer(md5HEX, "utf8");
    return buf.toString("base64");
  }

  static _percentencode(str) {
    let ret = encodeURIComponent(str);

    ret = ret
      .replace(/\+/g, "%20")
      .replace(/\*/g, "%2A")
      .replace(/%7E/g, "~")
      .replace(/!/g, "%21")
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29")
      .replace(/'/g, "%27")
    return ret;
  }
}

module.exports = Signature
