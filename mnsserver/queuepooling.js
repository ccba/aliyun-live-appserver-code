const util = require("util");
const url = require("url");
const queue = require("../service/mns/mnsqueue");
const mnstopic = require("../service/mns/mnstopic");
const config = require('../config.js');

class QueuePooling {

  static start() {
    queue.getQueues().then((names) => {
      names.forEach((name) => {
        console.log(`queue名字${name}`);
        QueuePooling.pooling(name.QueueURL);
      });
    });
  }

  static pooling(url) {
    let settting = config.ali.mnsQueue;
    queue.receiveByUrl(url, settting.waitseconds, settting.numOfMessages).then((data) => {
      if (data.code == 200) {
        QueuePooling.sendToTopic(data.data);
        // QueuePooling.deleteMessages(url, data.data);  publish之后再删除
      }
      QueuePooling.pooling(url);
    }, (err) => {
      if (err.code != 404) {

      }
      QueuePooling.pooling(url);
    });
  }

  static sendToTopic(messages) {
    if (!util.isArray(messages))
      messages = [messages];
    messages.forEach((message) => {
      let body = new Buffer(message.MessageBody, 'base64').toString();
      if (body) {
        try {
          body = JSON.parse(body);
        } catch (err) {
          console.log(err);
        }
      }
      let {
        topic,
        tag,
        content
      } = body;
      if (topic && tag && content)
        mnstopic.publish(topic, tag, JSON.stringify(content)).then(() => {
          queue.deleteMessage(topic, message.ReceiptHandle).then(() => {}, (err) => {
            console.log(err);
          });
        }, (err) => {
          console.log(err);
        });
    });
  }

  static deleteMessages(url, messages) {
    let datas = messages.map((message) => {
      return {
        ReceiptHandle: message.ReceiptHandle
      };
    });
    queue.batchDeleteMessageByUrl(url, datas);
  }
}

module.exports = QueuePooling;
