const redis = require('../data/dqRedis');
const dqUtil = require('../util/util');
const {
  USER_ID_INDEX,
  USER_LIST_KEY
} = require('../service/constants');

class User {

  static create(name) {
    return new Promise((resolve, reject) => {
      redis.get(USER_ID_INDEX, (err, id) => {
        if (err) {
          console.log(`redis:${USER_ID_INDEX}--${err}`);
          reject({
            code: 2010,
            message: "用户索引访问错误。" + err.origin.code
          });
        }
        redis.incr(USER_ID_INDEX);
        if (!id) {
          id = 0;
        }
        id = id * 1 + 1;
        resolve({
          id: id,
          name: name
        });
      });
    });
  }

  static getUsers() {
    return new Promise((resolve, reject) => {
      redis.hgetall(USER_LIST_KEY, (err, datas) => {
        if (err) {
          console.log(`redis:${USER_LIST_KEY}--${err}`);
          reject({
            code: 2010,
            message: "用户数据访问错误。" + err.origin.code
          });
        }
        if (datas)
          datas = dqUtil.convertToList(datas);
        resolve(datas);
      });
    });
  }

  static getRoomUsers() {
    return new Promise((resolve, reject) => {
      redis.hgetall(USER_LIST_KEY, (err, datas) => {
        if (err) {
          console.log(`redis:${USER_LIST_KEY}--${err}`);
          reject({
            code: 2010,
            message: "用户数据访问错误。" + err.origin.code
          });
        }
        if (datas)
          datas = dqUtil.convertToList(datas);
        resolve(datas);
      });
    });
  }

  static getUserInfo(uid) {
    return new Promise((resolve, reject) => {
      if (!uid) {
        reject({
          code: 2002,
          message: "用户信息访问错误。"
        });
      }
      redis.hget(USER_LIST_KEY, uid, (err, datas) => {
        if (err) {
          console.log(err);
          reject({
            code: 2010,
            message: "用户信息访问错误。"
          });
        } else {
          return resolve(JSON.parse(datas));
        }
      });
    });
  }
  static store(userInfo) {
    if (userInfo)
      redis.hmset(USER_LIST_KEY, userInfo.id, JSON.stringify(userInfo));
  }
}

module.exports = User;
