const co = require("co");
const response = require('../util/response');
const signature = require('../service/signature');
const util = require('../util/util');
const queue = require('../service/mns/mnsqueue');
const mnstopic = require('../service/mns/mnstopic');
const mns = require('../service/mns/mns')
const config = require('../config');

class MNSCtrl {
  //MNS的websocket链接信息
  websocketInfo(req, res) {
    let {
      topic,
      subscriptionName
    } = req.body;
    let info = util.notAllowEmpty(topic, 'topic');
    if (info) {
      response.fail(res, info)
      return;
    }
    if (!subscriptionName)
      subscriptionName = topic;
    let result = mnstopic.websocketSignature(topic, subscriptionName);
    response.success(res, {
      authentication: result.authentication,
      date: result.date,
      topicWebsocketServerIp: config.ali.mnsTopic.topicWebsocketServerIp,
      topicWebsocketServerAddress: `ws://${config.ali.ownerId}.mns-websocket.${config.ali.msnRegion}.aliyuncs.com/mns`,
      accountId: config.ali.ownerId,
      accessId: config.ali.accessKeyID
    });
  }

  //obsolete
  getHeaders(req, res) {
    let {
      httpVerb,
      httpUrl
    } = req.body;

    let result = util.notAllowEmpty(httpUrl, 'httpUrl');
    if (result) {
      response.fail(res, result)
      return;
    }
    if (!httpVerb)
      httpVerb = 'POST';

    let headers = mns.makeHeaders(httpVerb, httpUrl, {});
    response.success(res, {
      headers: headers
    });

  }

  //obsolete
  getQueues(req, res) {
    co(function*() {
      let names = yield queue.getQueues();
      response.success(res, names);
    });
  }
}

module.exports = new MNSCtrl();
