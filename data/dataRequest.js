const request = require('request');
const util = require('../util/util');
class dataRequest {

  static post(url, data, option) {
    if (!option)
      option = {};
    option.url = url;
    option.method = "POST";
    option.body = data;

    return dataRequest.request(option);
  }

  static get(url, data, option) {
    if (!option)
      option = {};
    option.url = url;
    option.method = "GET";
    option.body = data;

    return dataRequest.request(option);
  }

  static request(option) {
    option.json = true;
    if (!option.headers)
      option.headers = {};
    option.headers["Content-Type"] = 'application/json';
    console.log(`开始第三方请求${util.date()}：${option.url} 请求参数：${JSON.stringify(option)}`);

    let promise = new Promise((resolve, reject) => {
      request(option, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          let result = response.body && response.body.Result ? response.body.Result : response.body;
          if ((!result.code && !result.description) || (result.description && result.description.toLowerCase() == "success") || (result.code && result.code == 200)) {
            console.log(`第三方请求成功：${option.url} 返回值：${JSON.stringify(result)}`);
            let mixResult = response.body && response.body.MixResult ? response.body.MixResult : null;
            console.dir(mixResult)
            if (mixResult)
              result = mixResult
            resolve(result);
          } else {
            reject(result);
            console.log(`第三方请求失败：${option.url} 返回值：${JSON.stringify(result)}`);
          }
        } else {
          let result = response.body && response.body.result ? response.body.result : response.body;
          reject(result);
          console.log(`第三方请求失败：${option.url} 返回值：${JSON.stringify(result)}`);
        }
      });
    });
    return promise;
  }
}

module.exports = dataRequest;
