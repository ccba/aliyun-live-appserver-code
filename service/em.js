const config = require('../config.js');
const redis = require('../data/dqRedis');
const request = require('../data/dataRequest')
const util = require('../util/util');
const address = require('../service/address');

//obsolete
class em {
  static getUrl(url) {
    return `https://${config.em.host}/${config.em.orgName}/${config.em.appName}${url}`
  }

  static requestData(option, path, data) {
    return new Promise((resolve, reject) => {
      redis.get('em_token', (err, token) => {
        if (!token) {
          return em.getToken().then(() => {
            em.requestData(option, path, data);
          });
        }
        let op = Object.assign({
          url: em.getUrl(path),
          body: data,
          headers: {
            Authorization: `Bearer ${token}`
          }
        }, option);
        request.request(op).then((data) => {
          resolve(data);
        }, (err) => {
          reject(err.error_description || err);
        });
      });
    })
  }

  static getToken() {
    //获取tokeno
    var data = {
      grant_type: 'client_credentials',
      client_id: config.em.clientId,
      client_secret: config.em.clientSecret
    };
    return request.post(em.getUrl('/token'), data).then((data) => {
      let token = data.access_token;
      redis.set('em_token', token);
    });
  }

  static createRoom(name, owner, desc) {
    var data = {
      "name": `${name}Room`,
      "description": `${desc}聊天室`,
      "owner": owner
    };
    return em.requestData({
      method: 'POST'
    }, '/chatrooms', data);
  }

  static addUserToRoom(roomId, userName) {
    return em.requestData({
      method: 'POST'
    }, `/chatrooms/${roomId}/users/${userName}`)
  }

  static removeUserToRoom(roomId, userName) {
    return em.requestData({
      method: 'DELETE'
    }, `/chatrooms/${roomId}/users/${userName}`)
  }

  static deleteRoom(roomId) {
    return em.requestData({
      method: 'DELETE'
    }, `/chatrooms/${roomId}`)
  }

  static sendToUser(userName, message) {
    var data = {
      "target_type": "users",
      "target": [userName],
      "msg": {
        "type": "txt",
        "msg": message
      },
    };
    return em.requestData({
      method: 'POST'
    }, '/messages', data);
  }

  static sendToRoom(roomId, message) {
    var data = {
      "target_type": "chatgroups",
      "target": [roomId],
      "msg": {
        "type": "txt",
        "msg": message
      },
    };
    return em.requestData({
      method: 'POST'
    }, '/messages', data);
  }

  static registerUser(name, password = '12345678') {
    var data = {
      "username": name,
      "password": password
    };
    return em.requestData({
      method: 'POST'
    }, '/users', data);
  }

  static getRoomUsers(roomId) {
    return em.requestData({
      method: 'Get'
    }, `/chatrooms/${roomId}`);
  }

  static formatName(id, name) {
    return `${name}-${id}`
  }

}

module.exports = em;
