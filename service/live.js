const util = require('util');
const co = require("co");
const redis = require('../data/dqRedis');
const address = require('../service/address');
const mns = require('../service/mns/mnstopic');
const dqUtil = require('../util/util');
const delayQueue = require('../util/delayQueue');
const config = require('../config');
const user = require('./user');
const {
  LIVE_LIST_KEY,
  INVITER_LIST_KEY,
  USER_LIST_KEY
} = require('../service/constants');

class Live {

  static GetAllLives() {
    return new Promise((resolve, reject) => {
      redis.hgetall(LIVE_LIST_KEY, (err, datas) => {
        if (err) {
          console.log(`redis:${LIVE_LIST_KEY}--${err}`);
          reject({
            code: 2020,
            message: "直播数据访问错误。"
          });
        }
        if (datas)
          datas = dqUtil.convertToList(datas);
        resolve(datas);
      });
    });
  }

  static getLiveByUid(uid) {
    return new Promise((resolve, reject) => {
      Live.GetAllLives().then((datas) => {
        if (!util.isArray(datas))
          resolve("")

        let newDatas = datas.filter((item) => {
          if ((!uid || item.uid == uid) && (item.status != 10 && item.type == 2)) return true;
          return false;
        });
        if (newDatas.length > 0)
          resolve(newDatas[0]);
        else
          resolve("");
      });
    }).catch((err) => {
      reject(err);
    });
  }

  static getLive(func) {
    return new Promise((resolve, reject) => {
      Live.GetAllLives().then((datas) => {
        if (!util.isArray(datas))
          resolve("")
        let newDatas = datas.filter((item) => {
          if (func(item)) return true;
          return false;
        });
        resolve(newDatas);
      });
    }).catch((err) => {
      reject(err);
    });
  }

  static getLives(roomId) {
    return Live.getLive((item) => {
      return (!roomId || item.roomId == roomId);
    });
  }

  static getLiveList(roomId) {
    return Live.getLive((item) => {
      return ((!roomId || item.roomId == roomId) && (item.status == 1 && item.type == 2 && item.isMixReady));
    });
  }

  static addUserToPlayList(roomId, userId) {
    return new Promise((resolve, reject) => {
      if (roomId && userId) {
        user.getUserInfo(userId).then((userInfo) => {
          redis.sadd(roomId, JSON.stringify(userInfo));
          resolve("");
        }, (err) => {
          reject(err)
        });
      }
    });
  }

  static getPlayListUsers(roomId) {
    return new Promise((resolve, reject) => {
      redis.smembers(roomId, (err, datas) => {
        if (err) {
          console.log(`redis:${roomId}--${err}`);
          reject({
            code: 2030,
            message: "观看列表访问错误。"
          });
        }
        if (datas)
          datas = dqUtil.convertToList(datas);
        resolve(datas);
      });
    });
  }

  static removeUserFromPlayList(roomId, userId) {
    if (roomId && userId) {
      user.getUserInfo(userId).then((userInfo) => {
        redis.srem(roomId, JSON.stringify(userInfo));
      });
    }
  }

  static deletePlayList(roomId) {
    if (roomId) {
      redis.del(roomId);
    }
  }

  static setProperty(roomId, propertyName, value) {
    return new Promise((resolve, reject) => {
      if (!roomId) {
        resolve("");
      }
      console.log(`设置状态：${roomId}－${propertyName}-${value}`);
      redis.hget(LIVE_LIST_KEY, roomId, (err, data) => {
        if (data) {
          let item = JSON.parse(data);
          item[propertyName] = value;
          redis.hmset(LIVE_LIST_KEY, roomId, JSON.stringify(item));
        }
        if (err) {
          console.log(err);
          reject({
            code: 4010,
            message: `直播${propertyName}设置错误`
          });
        } else
          resolve("");
        return
      });
    });
  }

  static setStatus(roomId, status) {
    return new Promise((resolve, reject) => {
      if (!roomId) {
        resolve("");
      }
      console.log(`设置状态：${roomId}－${status}`);
      if (status == 2) {
        console.log(`${roomId}结束直播`);
        redis.hdel(LIVE_LIST_KEY, roomId);
        resolve("");
      } else {
        redis.hget(LIVE_LIST_KEY, roomId, (err, data) => {
          if (data) {
            let item = JSON.parse(data);
            item.status = status;
            redis.hmset(LIVE_LIST_KEY, roomId, JSON.stringify(item));
          }
          if (err) {
            console.log(err);
            reject({
              code: 4010,
              message: "直播状态设置错误"
            });
          } else {
            resolve("");
          }
          return
        });
      }
    });
  }

  static closeNotify(roomId) {
    if (roomId) {
      let msg = dqUtil.createMqttMsg({
        roomId: roomId
      }, 8);
      mns.publish(roomId, msg, 5);
    }
  }

  static isHoster(roomId) {
    return new Promise((resolve, reject) => {
      Live.getLiveList(roomId).then((data) => {
        if (data && data.length > 0)
          resolve(true);
        else
          resolve(false);
      }, (err) => {
        reject(err);
      })
    });
  }

  static createLive(userInfo, desc, status = 0, type = 2) {
    desc = desc ? desc : `${userInfo.name}的直播`;
    let roomId = dqUtil.random(5);
    return new Promise((resolve, reject) => {
      co(function*() {
        yield mns.create(roomId);
        yield mns.subscribe(roomId);
        // yield Live.addUserToPlayList(roomId, userInfo.id);
        let data = {
          uid: userInfo.id,
          name: userInfo.name,
          roomId: roomId,
          rtmpUrl: address.getRtmpUrl(roomId),
          playUrl: address.getPlayUrl(roomId),
          m3u8PlayUrl: address.getPlayUrl(roomId, config.videocall.templateName, 'm3u8'),
          rtmpPlayUrl: address.getRtmpPlayUrl(roomId),
          status: status,
          type: type,
          isMixReady: false,
          isMixed: false,
          mns: {
            topic: roomId,
            subscriptionName: roomId,
            topicLocation: mns.getLocation(roomId),
            roomTag: roomId,
            userRoomTag: dqUtil.getUserTopicTag(roomId, userInfo.id)
          },
          mixedStatus: 0,
          description: desc,
          createTime: dqUtil.date()
        };
        redis.hmset(LIVE_LIST_KEY, roomId, JSON.stringify(data));
        delayQueue.queue(roomId, () => {
          mns.delete(roomId);
          Live.setStatus(roomId, 2);
          Live.closeNotify(roomId);
        });

        resolve(data);
      }).catch((err) => {
        reject(err)
      });
    });
  }
}
module.exports = Live;
