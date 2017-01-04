const co = require("co");
const redis = require('../data/dqRedis');
const config = require('../config');
const address = require('../service/address');
const util = require('../util/util');
const response = require('../util/response');
const user = require('../service/user');
const ram = require('../service/ali/ram');
const {
  USER_LIST_KEY,
  LIVE_LIST_KEY,
  INVITER_LIST_KEY,
  USER_ID_INDEX
} = require('../service/constants');

class BaseCtrl {

  login(req, res) {
    let {
      name: name,
      password: password
    } = req.body;
    let result = util.notAllowEmpty(name, 'name')
    if (result) {
      response.fail(res, result)
      return;
    }

    co(function*() {
      var userInfo = yield user.create(name);
      // var data = yield em.registerUser(userInfo.emName);
      // userInfo.em = data.entities[0];
      user.store(userInfo);
      response.success(res, userInfo);
    }).catch((err) => {
      response.onError(err, res);
    });
  }

  //获取阿里云STS token
  aliToken(req, res) {
    let {
      assumeRole,
      roleSessionName,
      durationSeconds
    } = req.body;
    let policy = '';
    // 'AliyunMNSFullAccess';
    if (!assumeRole)
      assumeRole = config.ali.sts.assumeRole;
    if (!roleSessionName)
      roleSessionName = config.ali.sts.roleSessionName;
    if (!durationSeconds)
      durationSeconds = config.ali.sts.tokeExpired;
    co(function*() {
      let token = yield ram.assumeRole(assumeRole, roleSessionName, policy, durationSeconds);
      response.success(res, token);
    }).catch((err) => {
      response.onError(err, res);
    });
  }

  　
  reset(req, res) {
    let {
      key
    } = req.body;
    if (key) {
      redis.del(key);
    } else {
      let regex = config.redis.keyprefix + '*';
      redis.keys(regex, (err, datas) => {
        datas.forEach((k) => {
          redis.del(k);
        })
      });
    }

    response.success(res);
  }
}

module.exports = new BaseCtrl();
