const co = require("co");
const redis = require('../data/dqRedis');
const config = require('../config');
const address = require('../service/address');
const mns = require('../service/mns/mnstopic');
const util = require('../util/util');
const live = require('../service/live');
const user = require('../service/user');
const response = require('../util/response');
const delayQueue = require('../util/delayQueue');
const {
  LIVE_LIST_KEY
} = require('../service/constants');


class LiveCtrl {

  //创建直播
  create(req, res) {
    this._create(req, res);
  }

  //观看直播
  play(req, res) {
    this._play(req, res);
  }

  //主播结束直播
  leave(req, res) {
    let {
      roomId
    } = req.body;
    let msg = util.createMqttMsg({
      roomId: roomId
    }, 8);
    co(function*() {

      yield [mns.publish(roomId, msg, 5), live.setStatus(roomId, 2)];
      live.deletePlayList(roomId);
      delayQueue.queue(roomId, () => {
          mns.delete(roomId);
        },
        60000);
      response.success(res);
    }).catch((err) => {
      response.onError(err, res);
    });
  }

  //观众离开直播
  userLeave(req, res) {
    let {
      roomId,
      uid
    } = req.body;
    live.removeUserFromPlayList(roomId, uid);
    response.success(res);
  }

  //直播列表
  list(req, res) {
    let {
      roomId: roomId1
    } = req.body;
    let {
      roomId: roomId2
    } = req.query;
    let roomId = roomId1 || roomId2;
    co(function*() {
      let datas = [];
      if (roomId == -1)
        datas = yield live.GetAllLives();
      else
        datas = yield live.getLiveList(roomId);
      if (!datas)
        datas = [];
      response.success(res, datas);
    }).catch((err) => {
      response.onError(err, res);
    });
  }

  //评论
  comment(req, res) {
    let {
      uid,
      roomId,
      comment
    } = req.body;
    co(function*() {
      let userInfo = yield user.getUserInfo(uid);
      let msg = util.createMqttMsg({
        uid: uid,
        name: userInfo.name,
        comment: comment
      }, 6);
      yield mns.publish(roomId, msg, 8);
      response.success(res);
    }).catch((err) => {
      response.onError(err, res);
    });
  }

  //点赞
  like(req, res) {
    let {
      uid,
      roomId
    } = req.body;

    co(function*() {
      let userInfo = yield user.getUserInfo(uid);
      let msg = util.createMqttMsg({
        uid: uid,
        name: userInfo.name
      }, 7);
      yield mns.publish(roomId, msg, 9);
      response.success(res);
    }).catch((err) => {
      response.onError(err, res);
    });
  }

  //私有方法
  //创建直播， 如果3分钟后没有推流，将会删除直播记录
  _create(req, res) {
    let {
      uid,
      desc
    } = req.body;
    let result = util.notAllowEmpty(uid, 'uid')
    if (result) {
      response.fail(res, result)
      return;
    }
    co(function*() {
      let roomInfo = yield live.getLiveByUid(uid);
      let userInfo = yield user.getUserInfo(uid);
      if (false && roomInfo) {
        if (roomInfo.status == 1) {
          response.success(res, {
            code: 2004,
            message: `${roomInfo.roomid}直播已存在`
          });
          return
        }
        delayQueue.deQueue(roomInfo.roomId);
        delayQueue.deQueue(roomInfo.roomId + config.videocall.templateName);
        if (roomInfo.status == 0) {
          roomInfo.type = 2;
          live.setProperty(roomInfo.roomId, 'type', 2);
          delayQueue.queue(roomInfo.roomId, () => {
            mns.delete(roomInfo.roomId);
            live.setStatus(roomInfo.roomId, 2);
            live.closeNotify(roomInfo.roomId);
          });
        }
        response.success(res, roomInfo);
        return
      }
      if (!userInfo) {
        response.fail(res, {
          code: 2002,
          message: `${uid}用户不存在`
        });
        return
      }
      let data = yield live.createLive(userInfo, desc, 0);
      response.success(res, data);
    }).catch((err) => {
      response.onError(err, res);
    });
  }

  _play(req, res) {
    let {
      roomId,
      uid
    } = req.body;
    let result = util.notAllowEmpty(roomId, 'roomId')
    if (result) {
      response.fail(res, result)
      return;
    }
    co(function*() {
      let roomInfo = yield live.getLives(roomId);
      if (!roomInfo || roomInfo.length == 0) {
        response.fail(res, {
          code: 2003,
          message: `roomId=${roomId}的直播不存在`
        });
        return
      }
      let userInfo = yield user.getUserInfo(uid);
      if (!userInfo) {
        response.fail(res, {
          code: 2002,
          message: `${uid}用户不存在`
        });
        return
      }
      live.addUserToPlayList(roomId, userInfo.id);
      let mnsInfo = roomInfo[0].mns;
      let data = {
        uid: uid,
        name: userInfo.name,
        roomId: roomId,
        playUrl: address.getPlayUrl(roomId),
        mns: {
          topicLocation: mnsInfo.topicLocation,
          topic: mnsInfo.topic,
          roomTag: mnsInfo.roomTag,
          userRoomTag: util.getUserTopicTag(roomId, uid)
        }
      };
      response.success(res, data);
    }).catch((err) => {
      response.onError(err, res);
    });
  }
}

module.exports = new LiveCtrl()
