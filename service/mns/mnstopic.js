const util = require("util");
const url = require("url");
const mns = require("./mns");
const config = require('../../config.js');
const signature = require("../signature");

class MNSTopic {
  // List all topics.
  static list(prefix, pageSize, pageMarker) {
    var headers = {};
    if (prefix) headers["x-mns-prefix"] = prefix;
    if (pageMarker) headers["x-mns-marker"] = pageMarker;
    if (pageSize) headers["x-mns-ret-number"] = pageSize;
    let urlString = MNSTopic.makeTopicURL();
    urlString = urlString.slice(0, -1);
    return new Promise((resolve, reject) => {
      mns.request("GET", urlString, null, headers).then((data) => {
        let topics = data.data.Topics;
        data.data = dqUtil.propertyToList(topics, 'Topic');
        resolve(data);
      }, (err) => {
        reject(err);
      });
    });
  }

  // Create a topic
  static create(name, options = {
    LoggingEnabled: true
  }) {
    var body = {
      Topic: ""
    };
    if (options) body.Topic = options;
    var urlString = url.resolve(MNSTopic.makeTopicURL(), name);
    return mns.request("PUT", urlString, body);
  }

  // Create a topic
  static subscribe(name, options = {
    Endpoint: config.ali.mnsTopic.subscriptionEndpoint
  }) {
    var body = {
      Subscription: ""
    };
    if (options) body.Subscription = options;

    var urlString = url.resolve(MNSTopic.makeTopicURL(), name) + '/subscriptions/' + name;
    return mns.request("PUT", urlString, body);
  }

  // Delete a topic
  static delete(name) {
    var urlString = url.resolve(MNSTopic.makeTopicURL(), name);
    return mns.request("DELETE", urlString);
  }

  static publish(name, msg, importantLevel = 8, tag) {
    if (!tag) {
      tag = name;
    }
    let body = {
      Message: {
        MessageBody: msg,
        MessageTag: tag,
        MessageAttributes: {
          WebSocket: JSON.stringify({
            ImportanceLevel: importantLevel
          })
        }
      }
    };
    let urlString = url.resolve(MNSTopic.makeTopicURL(), name) + '/messages';
    return mns.request("POST", urlString, body);
  }

  //   strToSign := "PUT\n\ntext/xml;charset=UTF-8\n" + dateStr
  //      + "\nx-mns-auth-only:1\nx-mns-version:2015-06-06\n/topics/"
  //      + topic + "/subscriptions/" + subscription
  // mac := hmac.New(sha1.New, []byte(accessKey))
  // mac.Write([]byte(strToSign))
  // return base64.StdEncoding.EncodeToString(mac.Sum(nil))
  static websocketSignature(topic, subscription) {
    let dateStr = (new Date()).toUTCString();
    let strToSing = `PUT\n\ntext/xml;charset=UTF-8\n${dateStr}\nx-mns-auth-only:1\nx-mns-version:${config.ali.mnsVersion}\n/topics/${topic}/subscriptions/${subscription}`;
    return {
      authentication: signature.hmac(strToSing),
      date: dateStr
    };
  }

  static getLocation(name) {
    return url.resolve(MNSTopic.makeTopicURL(), name);
  }

  static makeTopicURL() {
    return util.format("http://%s.mns.%s.aliyuncs.com/topics/", config.ali.ownerId, config.ali.mnsRegion);
  }

  // private _patternTopic = "http://%s.mns.cn-%s.aliyuncs.com/topics/";
  // private _urlTopic: String;
}

module.exports = MNSTopic;
