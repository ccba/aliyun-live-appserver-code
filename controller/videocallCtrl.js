const co = require("co");
const redis = require('../data/dqRedis');
const config = require('../config');
const address = require('../service/address');
const live = require('../service/live');
const user = require('../service/user');
const videoCall = require('../service/videocall');
const mns = require('../service/mns/mnstopic');
const alinotify = require('../service/alinotify');
const util = require('../util/util');
const delayQueue = require('../util/delayQueue');
const response = require('../util/response');
const {
  INVITER_LIST_KEY
} = require('../service/constants');


class VideocallCtrl {

  //邀请连麦， 向被邀请方发送邀请信息推送
  invite(req, res) {
    let {
      inviterUid: inviterUid,
      inviteeUid: inviteeUid,
      inviterType: inviterType,
      liveRoomId: liveRoomId,
      type: type //picture_in_picture 画中画  side_by_side 左右两
    } = req.body;
    co(function*() {
      let videoInfo = yield videoCall.getVideoCalls(liveRoomId);
      if (videoInfo && videoInfo.length > 0) {
        response.fail(res, {
          code: 3020,
          message: `${liveRoomId}房间间已经连麦中`
        })
        return
      }

      let inviterInfo = yield user.getUserInfo(inviterUid);
      let inviteeInfo = yield user.getUserInfo(inviteeUid);
      if (!inviterInfo) {
        response.fail(res, {
          code: 2002,
          message: `${inviterUid}用户不存在`
        })
        return
      }

      if (!inviteeInfo) {
        response.fail(res, {
          code: 2002,
          message: `${inviteeUid}用户不存在`
        })
        return
      }
      let msg = util.createMqttMsg({
        inviterUid: inviterUid,
        inviterName: inviterInfo.name,
        inviterType: inviterType,
        type: type
      }, 1);
      let topic = liveRoomId;
      let interteeLiveInfo = yield live.getLiveByUid(inviteeUid);
      if (interteeLiveInfo) {
        topic = interteeLiveInfo.roomId;
      }
      yield mns.publish(topic, msg, 4, util.getUserTopicTag(liveRoomId, inviteeUid));
      response.success(res);
    }).catch((err) => {
      response.onError(err, res);
    });
  }

  /*邀请反馈
  1. 如果是观众，将会创建直播，并且返回推送地址到客户端
  2. 如果连麦双方都已经混流可用，将直接调用混流接口
  3. 否则就在混流可用回调里， 判断双方都已经混流可用时， 调用混流接口
  4. 对方的短延时地址，客户端通过返回值和消息推送得到
  */
  feedback(req, res) {
    let {
      status,
      inviterUid: inviterUid,
      inviteeUid: inviteeUid,
      type: type,
      inviterType: inviterType,
      inviteeType: inviteeType
    } = req.body;
    let hasLive = true;
    let that = this;
    co(function*() {
      let inviteeInfo = yield user.getUserInfo(inviteeUid);
      let inviterInfo = yield user.getUserInfo(inviterUid);
      if (!inviteeInfo || !inviterInfo) {
        response.fail(res, {
          code: 2002,
          message: "用户信息不存在"
        });
        return
      }
      let data = {
        inviterUid: inviterUid,
        inviterName: inviterInfo.name,
        inviteeUid: inviteeUid,
        inviteeName: inviteeInfo.name,
        inviterType: inviterType,
        inviteeType: inviteeType,
        type: type
      };
      let hasLive = true;
      let inviterLiveInfo = yield live.getLiveByUid(inviterUid);
      let interteeLiveInfo = yield live.getLiveByUid(inviteeUid);

      if (status == 1) {
        if (!inviterLiveInfo || inviterType == 1) {
          hasLive = false;
          inviterLiveInfo = yield live.createLive(inviterInfo, `${inviterInfo.name}的直播`, 10, 1);
        }
        if (!interteeLiveInfo || inviteeType == 1) {
          hasLive = false;
          interteeLiveInfo = yield live.createLive(inviteeInfo, `${inviteeInfo.name}的直播`, 10, 1);
        }
        if (!inviterLiveInfo.isMixReady || !interteeLiveInfo.isMixReady)
          hasLive = false

        data.inviteeRoomId = interteeLiveInfo.roomId;
        data.inviterRoomId = inviterLiveInfo.roomId;
        that._agreeVideoCall(data, res, hasLive);
      } else {
        data.inviterRoomId = inviterLiveInfo ? inviterLiveInfo.roomId : "";
        data.inviteeRoomId = interteeLiveInfo ? interteeLiveInfo.roomId : "";
        that._refuseVideoCall(data, res);
        response.success(res);
      }
    }).catch((err) => {
      response.onError(err, res);
    });
  }

  //结束连麦，调用结束连麦接口
  close(req, res) {
    let {
      closeRoomId: closeRoomId,
      notifiedRoomId: notifiedRoomId
    } = req.body;
    let result = util.notAllowEmpty(closeRoomId, 'closeRoomId')
    if (result) {
      response.fail(res, result)
      return;
    }
    co(function*() {
      let liveInfo = yield live.getLives(closeRoomId);
      let notifyLiveInfo = yield live.getLives(notifiedRoomId);
      if (!liveInfo || liveInfo.length == 0) {
        response.fail(res, {
          code: 2002,
          message: `${closeRoomId}直播记录不存在`
        })
        return
      }
      liveInfo = liveInfo[0];
      if (notifyLiveInfo && notifyLiveInfo.length == 0) {
        response.fail(res, {
          code: 2002,
          message: `${notifiedRoomId}直播记录不存在`
        })
        return
      }
      notifyLiveInfo = notifyLiveInfo[0];
      //结束连麦推送
      let msg = util.createMqttMsg({
        roomId: closeRoomId,
        uid: liveInfo.uid,
        name: liveInfo.name,
        notifiedRoomId: notifiedRoomId,
        notifiedUid: notifyLiveInfo.uid,
        notifiedName: notifyLiveInfo.name
      }, 4);
      if (notifiedRoomId && notifyLiveInfo.type == "2")
        mns.publish(notifiedRoomId, msg, 5);
      if (closeRoomId && liveInfo.type == "2")
        mns.publish(closeRoomId, msg, 5);
      if (!liveInfo.isMixed) {
        console.log(`${closeRoomId}还没有混流`);
        videoCall.close(closeRoomId, notifiedRoomId);
        response.success(res);
        return
      }
      videoCall.closeMix(liveInfo, notifyLiveInfo, (err) => {
        if (err) {
          response.fail(res, err);
        } else {
          let msg = util.createMqttMsg({
            roomId: closeRoomId,
            uid: liveInfo.uid,
            name: liveInfo.name,
            notifiedRoomId: notifiedRoomId,
            notifiedUid: notifyLiveInfo.uid,
            notifiedName: notifyLiveInfo.name
          }, 15);
          if (notifiedRoomId && notifyLiveInfo.type == "2") //主播才要发
            mns.publish(notifiedRoomId, msg, 5);
          if (closeRoomId && liveInfo.type == "2")
            mns.publish(closeRoomId, msg, 5);
          response.success(res);
          videoCall.close(closeRoomId, notifiedRoomId);
          live.setProperty(closeRoomId, 'isMixed', false);
          live.setProperty(notifiedRoomId, 'isMixed', false);
        }
      });
    }).catch((err) => {
      response.onError(err, res);
    });
  }


  //私有方法

  _agreeVideoCall(params, res, hasLive) {
    let {
      inviterUid,
      inviteeUid,
      inviteeName,
      inviterName,
      inviterRoomId,
      inviteeRoomId,
      inviterType,
      inviteeType,
      type
    } = params;

    //推送 副麦同意连麦
    let msg = util.createMqttMsg({
      inviteeUid: inviteeUid,
      inviteeName: inviteeName,
      inviteeRoomId: inviteeRoomId,
      inviterRoomId: inviterRoomId,
      inviteePlayUrl: address.getShortPlayUrl(inviteeRoomId),
      rtmpUrl: address.getRtmpUrl(inviterRoomId),
      type: type,
      inviterType: inviterType,
      inviteeType: inviteeType,
      status: 1
    }, 2);
    let topic = inviteeRoomId;
    if (inviterType == 2)
      topic = inviterRoomId;
    mns.publish(topic, msg, 4, util.getUserTopicTag(topic, inviterUid)).then(() => {
      //混流  如果是观众，阿里推流通知以后
      if (hasLive) {
        videoCall.startMix(params, (err) => {
          if (err)
            response.fail(res, err);
          else {
            videoCall.store(params);
            live.setProperty(inviterRoomId, 'isMixed', true);
            live.setProperty(inviteeRoomId, 'isMixed', true);
            response.success(res, {
              inviterPlayUrl: address.getShortPlayUrl(inviterRoomId),
              inviterRoomId: inviterRoomId,
              rtmpUrl: address.getRtmpUrl(inviteeRoomId)
            });
          }
        });
      } else {
        videoCall.store(params);
        response.success(res, {
          inviterPlayUrl: address.getShortPlayUrl(inviterRoomId),
          inviterRoomId: inviterRoomId,
          rtmpUrl: address.getRtmpUrl(inviteeRoomId)
        })
      }
    }).catch((err) => {
      response.fail(res, {
        code: 2010,
        message: err
      });
    })

  }

  _refuseVideoCall(params, res) {
    let {
      inviterUid: inviterUid,
      inviterName: inviterName,
      inviteeUid: inviteeUid,
      inviteeName: inviteeName,
      inviterType: inviterType,
      inviteeType: inviteeType,
      inviteeRoomId: inviteeRoomId,
      inviterRoomId: inviterRoomId
    } = params;
    //推送 副麦不同意连麦
    let msg = util.createMqttMsg({
      inviteeUid: inviteeUid,
      inviteeName: inviteeName,
      status: 2
    }, 3);
    let topic = inviteeRoomId;
    if (inviterType == 2)
      topic = inviterRoomId;
    mns.publish(topic, msg, 4, util.getUserTopicTag(topic, inviterUid));
  }

}

module.exports = new VideocallCtrl()
