const redis = require('../data/dqRedis');
var _DelayQueueList = {};
class DelayQueue {
  static queue(key, callback, depayTime = 180000) {
    let handle = setTimeout(callback, depayTime);
    _DelayQueueList[key] = handle;
  }

  static deQueue(key) {
    let handle = _DelayQueueList[key];
    if (handle) {
      delete _DelayQueueList[key]
      clearTimeout(handle);
    }
  }
}

module.exports = DelayQueue;
