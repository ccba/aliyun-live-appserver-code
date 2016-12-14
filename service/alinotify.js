const co = require("co");
const live = require('../service/live');
const delayQueue = require('../util/delayQueue');
const mns = require('../service/mns/mnstopic');
const util = require('../util/util');
const videoCall = require('../service/videocall');
const config = require('../config.js');
class AliNotify {

  static publish(liveInfo) {
    let roomId = liveInfo.roomId;
    delayQueue.deQueue(roomId);
    live.setStatus(roomId, 1);
    let msg = util.createMqttMsg({
      uid: liveInfo.uid,
      roomId: roomId,
      name: liveInfo.name
    }, 9);
    AliNotify._sendNotifyMsgForStream(roomId, msg);
  }

  static publishEnd(liveInfo) {
    let roomId = liveInfo.roomId,
      type = liveInfo.type;
    let msg = util.createMqttMsg({
      uid: liveInfo.uid,
      name: liveInfo.name,
      roomId: roomId
    }, 10);
    live.setStatus(roomId, 0);
    delayQueue.queue(roomId, () => {
      mns.delete(roomId);
      live.setStatus(roomId, 2);
      live.closeNotify(roomId);
    });
    AliNotify._sendNotifyMsgForStream(roomId, msg);
  }

  static mixAvailablity(roomId) {
    co(function*() {
      live.setProperty(roomId, 'isMixReady', true);
      let videoInfo = yield videoCall.getVideoCalls(roomId);
      if (videoInfo && videoInfo.length > 0) {
        videoInfo = videoInfo[0];
        console.log(videoInfo);
      } else {
        console.log(`${roomId}没有连麦消息`);
        return
      }
      let otherRoomId = videoInfo.inviterRoomId;
      let otherType = videoInfo.inviterType;
      let type = videoInfo.inviteeType;
      if (videoInfo.inviterRoomId == roomId) {
        otherRoomId = videoInfo.inviteeRoomId;
        otherType = videoInfo.inviteeType;
        type = videoInfo.inviterType;
      }
      AliNotify._sendNotifyMsg(roomId, type, otherRoomId, otherType);
      let otherLiveInfo = yield live.getLives(otherRoomId);
      if (otherLiveInfo.length == 0) {
        console.log(`${otherRoomId}直播记录不存在`);
        return;
      }
      if (otherLiveInfo[0].isMixReady && !otherLiveInfo.isMixed) { //等两个流都成功了， 再连麦
        videoCall.startMix(videoInfo, (err) => {
          if (err) {
            console.log(`${roomId}混流失败：`);
            console.dir(err);
          } else {
            live.setProperty(videoInfo.inviterRoomId, 'isMixed', true);
            live.setProperty(videoInfo.inviteeRoomId, 'isMixed', true);
          }
        });
      }
    }).catch((err) => {
      console.log(err);
    });
  }

  static _sendNotifyMsg(roomId, type, otherRoomId, otherType, status) {
    let msg = util.createMqttMsg({
      roomId: roomId,
      type: type
    }, 17);
    if (type == 2)
      mns.publish(roomId, msg, 5);
    if (otherType == 2)
      mns.publish(otherRoomId, msg, 5);
  }

  static _sendNotifyMsgForStream(roomId, msg) {
    co(function*() {
      let videoInfo = yield videoCall.getVideoCalls(roomId);
      if (videoInfo && videoInfo.length > 0) {
        videoInfo = videoInfo[0];
        if (videoInfo.inviterType == 2)
          mns.publish(videoInfo.inviterRoomId, msg, 5);
        if (videoInfo.inviteeType == 2)
          mns.publish(videoInfo.inviteeRoomId, msg, 5);
      } else {
        mns.publish(roomId, msg, 5);
      }
    });
  }
}

module.exports = AliNotify;
