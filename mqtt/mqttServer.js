var mosca = require('mosca');
const util = require('util');
var config = require('../config');
class MqttServer {
  constructor(props) {
    this.mqttServer = new mosca.Server({
      port: config.mqttPort
    });
    this._bindEvent()
  }

  publishData(topics, data) {
    if (!util.isArray(topics)) {
      topics = [topics];
    }
    let message = {
      payload: JSON.stringify(data),
    }
    topics.forEach((topic) => {
      message['topic'] = topic;
      this.mqttServer.publish(message, (...args) => {
        console.log(message);
        console.log(args);
      });
    });
  }

  _bindEvent() {
    this.mqttServer.on('clientConnected', function(client) {
      console.log('client connected', client.id);
    });

    this.mqttServer.on('ready', function() {
      console.log('mqtt is running on port ' + config.mqttPort);
    });
  }

}

module.exports = new MqttServer();
