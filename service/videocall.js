const co = require("co");
const util = require('util');
const redis = require('../data/dqRedis');
const address = require('../service/address');
const em = require('../service/em');
const cdn = require('../service/ali/cdn');
const mns = require('../service/mns/mnstopic');
const dqUtil = require('../util/util');
const response = require('../util/response');
const live = require('../service/live');
const {
  LIVE_LIST_KEY,
  INVITER_LIST_KEY,
  ALI_MIX_ERROR_CODE
} = require('../service/constants');

class VideoCall {

  static store(params) {
    let field = dqUtil.getInviterInfoKey(params.inviterRoomId, params.inviteeRoomId);
    redis.hmset(INVITER_LIST_KEY, field, JSON.stringify(params));
  }

  static getVideoCalls(roomId) {
    return new Promise((resolve, reject) => {
      redis.hgetall(INVITER_LIST_KEY, (err, datas) => {
        if (err) {
          console.log(err);
          reject({
            code: 3010,
            message: err
          });
        }
        if (!datas) {
          resolve("");
        } else {
          datas = dqUtil.convertToList(datas);
          if (!roomId)
            resolve(datas);
          let newDatas = datas.filter((item) => {
            if (item.inviterRoomId == roomId || item.inviteeRoomId == roomId) return true;
            return false;
          });
          resolve(newDatas);
        }
      });
    });
  }

  static close(closeRooomId, notifiedRoomId) {
    redis.hdel(INVITER_LIST_KEY, dqUtil.getInviterInfoKey(closeRooomId, notifiedRoomId));
    redis.hdel(INVITER_LIST_KEY, dqUtil.getInviterInfoKey(notifiedRoomId, closeRooomId));
  }

  static startMix(videoInfo, callback) {
    let inviterRoomid = videoInfo.inviterRoomId,
      inviteeRoomid = videoInfo.inviteeRoomId,
      type = videoInfo.type;
    console.log(`开始混流：inviterRoomid=${inviterRoomid} inviteeRoomid=${inviteeRoomid}`);
    co(function*() {
      let errResult = "",
        inviterPlayUrls = [],
        inviteePlayUrls = [];
      if (videoInfo.inviterType == 2) {
        try {
          let result = yield cdn.startMux(inviterRoomid, inviteeRoomid, type);
          if (util.isArray(result)) {
            result.forEach((key) => {
              inviterPlayUrls.push(address.getMixPlayUrlByStream(key.stream));
            })
          }
        } catch (result) {
          errResult = result;
        };
      }
      if (videoInfo.inviteeType == 2) {
        if (!errResult) {
          try {
            let result = yield cdn.startMux(inviteeRoomid, inviterRoomid, type);
            if (util.isArray(result)) {
              result.forEach((key) => {
                inviteePlayUrls.push(address.getMixPlayUrlByStream(key.stream));
              })
            }
          } catch (result) {
            errResult = result;
          };
        }
      }
      errResult = VideoCall.errorHandle(errResult);
      VideoCall.mixMsgSend(errResult, inviterRoomid, inviteeRoomid, videoInfo, inviterPlayUrls, inviteePlayUrls);
      if (callback) {
        callback(errResult);
      }
    }).catch((err) => {
      if (callback)
        callback(response.onError(err));
    });
  }

  static closeMix(closeLiveInfo, notifiedLiveInfo, callback) {
    let closeRoomId = closeLiveInfo.roomId,
      notifiedRoomId = notifiedLiveInfo.roomId;
    console.log(`关闭混流:closeRoomId=${closeRoomId} notifiedRoomId=${notifiedRoomId}`);
    // let inviterPlayUrl = address.getMixplayUrl(closeRoomId),
    //   inviteePlayUrl = address.getMixplayUrl(notifiedRoomId);
    co(function*() {
      let errResult = "";
      if (closeLiveInfo.type == 2) {
        try {
          yield cdn.stopMux(closeRoomId, notifiedRoomId);
        } catch (result) {
          errResult = VideoCall.errorHandle(result, `结束混流失败:closeRoomId=${closeRoomId} notifiedRoomId=${notifiedRoomId}`);
        }
      }
      if (notifiedLiveInfo.type == 2) {
        if (!errResult) {
          try {
            yield cdn.stopMux(notifiedRoomId, closeRoomId);
          } catch (result) {
            errResult = VideoCall.errorHandle(result, `结束混流失败:closeRoomId=${closeRoomId} notifiedRoomId=${notifiedRoomId}`);
          }
        }
      }
      if (callback)
        callback(errResult);
    }).catch((err) => {
      if (callback)
        callback(response.onError(err));
    });
  }

  static startMainMix(mainRoomId, roomid, type, option, callback) {
    console.log(`重新开始混流：mainRoomId=${mainRoomId} roomid=${roomid}`);
    co(function*() {
      let errResult = "",
        inviterPlayUrls = [],
        inviteePlayUrls = [];
      try {
        let result = yield cdn.startMux(mainRoomId, roomid, type);
        if (util.isArray(result)) {
          result.forEach((key) => {
            inviterPlayUrls.push(address.getMixPlayUrlByStream(key.stream));
          })
        }
      } catch (result) {
        errResult = VideoCall.errorHandle(result, `重新开始混流时失败:mainRoomId=${mainRoomId} roomid=${roomid}}`);
      };

      VideoCall.mixMsgSend(errResult, mainRoomId, roomid, option, inviterPlayUrls, inviteePlayUrls);
      if (callback) {
        callback(errResult);
      }
    }).catch((err) => {
      if (callback)
        callback(response.onError(err));
    });
  }

  static closeMainMix(closeRoomId, notifiedRoomId, callback) {
    console.log(`断流关闭混流:closeRoomId=${closeRoomId} notifiedRoomId=${notifiedRoomId}`);
    co(function*() {
      let errResult = "";
      try {
        yield cdn.stopMux(closeRoomId, notifiedRoomId);
      } catch (result) {
        errResult = VideoCall.errorHandle(result, `断流结束混流失败:closeRoomId=${closeRoomId} notifiedRoomId=${notifiedRoomId}`);
      }
      if (callback)
        callback(errResult);
    }).catch((err) => {
      if (callback)
        callback(response.onError(err));
    });
  }

  static errorHandle(error, msg = '混流失败') {
    if (!error)
      return "";
    let data = {
      code: 3000,
      message: msg
    }
    if (error && ALI_MIX_ERROR_CODE[error.code]) {
      data.code = ALI_MIX_ERROR_CODE[error.code];
      data.message = error.message;
    }
    return data;
  }

  static mixMsgSend(errResult, inviterRoomid, inviteeRoomid, option, inviterPlayUrls, inviteePlayUrls) {
    let msg = "";
    if (errResult) {
      msg = dqUtil.createMqttMsg({
        inviterRoomid: inviterRoomid,
        inviteeRoomid: inviteeRoomid,
        inviterUid: option.inviterUid,
        inviterName: option.inviterName,
        inviteeUid: option.inviteeUid,
        inviteeName: option.inviteeName,
        inviterType: option.inviterType,
        inviteeType: option.inviteeType,
        message: errResult
      }, 14);
    } else {
      msg = dqUtil.createMqttMsg({
        inviterRoomid: inviterRoomid,
        inviteeRoomid: inviteeRoomid,
        inviterUid: option.inviterUid,
        inviterName: option.inviterName,
        inviteeUid: option.inviteeUid,
        inviteeName: option.inviteeName,
        inviterType: option.inviterType,
        inviteeType: option.inviteeType,
        inviterMixPlayUrls: inviterPlayUrls,
        inviteeMixPlayUrls: inviteePlayUrls
      }, 5);
    }
    if (option.inviterType == 2)
      mns.publish(inviterRoomid, msg, 5);
    if (option.inviteeType == 2)
      mns.publish(inviteeRoomid, msg, 5);
  }
}

module.exports = VideoCall;
