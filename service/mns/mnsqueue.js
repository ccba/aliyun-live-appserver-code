const util = require("util");
const url = require("url");
const co = require("co");
const mns = require("./mns");
const config = require('../../config.js');
const dqUtil = require('../../util/util');
const redis = require('../../data/dqRedis');
const {
  UQEUE_NAME_PRFIX
} = require('../../service/constants');

class MNSQueue {

  static getQueues() {
    return new Promise((resolve, reject) => {
      let count = config.ali.mnsQueue.queueCount;
      co(function*() {
        let data = yield MNSQueue.list(UQEUE_NAME_PRFIX, count);
        let queues = data.data;
        if (queues.length > 0) {
          if (queues.length == count) {
            resolve(queues);
            return;
          } else
            count = count - queues.length;
        }
        while (count-- > 0) {
          let name = `${UQEUE_NAME_PRFIX}${dqUtil.random(8)}`;
          let result = yield MNSQueue.create(name);
          queues.push({
            'QueueUrl': url.resolve(MNSQueue.makeQueueURL(), name)
          });
        }
        resolve(queues);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  static list(prefix, pageSize, pageMarker) {
    var headers = {};
    if (prefix) headers["x-mns-prefix"] = prefix;
    if (pageMarker) headers["x-mns-marker"] = pageMarker;
    if (pageSize) headers["x-mns-ret-number"] = pageSize;
    let urlString = MNSQueue.makeQueueURL();
    urlString = urlString.slice(0, -1);
    return new Promise((resolve, reject) => {
      mns.request("GET", urlString, null, headers).then((data) => {
        let queues = data.data.Queues;
        data.data = dqUtil.propertyToList(queues, 'Queue');
        resolve(data);
      }, (err) => {
        reject(err);
      });
    });
  }

  // Create a topic
  static create(name, options = {
    LoggingEnabled: true,
    VisibilityTimeout: 11
  }) {
    var body = {
      Queue: ""
    };
    if (options) body.Queue = options;
    var urlString = url.resolve(MNSQueue.makeQueueURL(), name);
    return mns.request("PUT", urlString, body);
  }

  // Delete a queue
  static delete(name) {
    var urlString = url.resolve(MNSQueue.makeQueueURL(), name);
    return mns.request("DELETE", urlString);
  }

  static deleteMessage(name, receiptHandle) {
    var urlString = url.resolve(MNSQueue.makeQueueURL(), name) + '/messages?ReceiptHandle=' + receiptHandle;
    return mns.request("DELETE", urlString);
  }

  static batchDeleteMessage(name, receiptHandles) {
    return MNSQueue.batchDeleteMessageByUrl(url.resolve(MNSQueue.makeQueueURL(), name), receiptHandles);
  }

  static batchDeleteMessageByUrl(urlValue, receiptHandles) {
    var urlString = urlValue + '/messages';
    return mns.request("DELETE", urlString, {
      ReceiptHandles: receiptHandles
    });
  }

  static receive(name, waitseconds = 0, numOfMessages = 0) {
    return MNSQueue.receiveByUrl(url.resolve(MNSQueue.makeQueueURL(), name), waitseconds, numOfMessages);

  }

  static receiveByUrl(urlValue, waitseconds = 0, numOfMessages = 0) {
    var urlString = urlValue + '/messages?waitseconds=' + waitseconds;
    if (numOfMessages)
      urlString = urlString + '&numOfMessages=' + numOfMessages
    return new Promise((resolve, reject) => {
      mns.request("GET", urlString).then((data) => {
        let messages = data.data.Messages;
        data.data = dqUtil.propertyToList(messages, 'Message');
        resolve(data);
      }, (err) => {
        reject(err);
      });
    });
  }

  static send(name, msg) {
    if (!tag) {
      tag = name;
    }
    let body = {
      Message: {
        MessageBody: msg
      }
    };
    let urlString = url.resolve(MNSQueue.makeQueueURL(), name) + '/messages';
    return mns.request("POST", urlString, body);
  }

  static makeQueueURL() {
    return util.format("http://%s.mns.%s.aliyuncs.com/queues/", config.ali.ownerId, config.ali.region);
  }

  // private _patternTopic = "http://%s.mns.cn-%s.aliyuncs.com/topics/";
  // private _urlTopic: String;
}

module.exports = MNSQueue;
