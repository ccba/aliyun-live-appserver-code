const dateUtils = require('date-utils');
const crypto = require("crypto");
const nUtil = require("util");
const config = require('../config.js');

class Util {
  static getPrivateTopic(uid) {
    return `private-${uid}-topic`;
  }

  static getPublicTopic(roomId) {
    return `public-${roomId}-topic`;
  }

  static createMqttMsg(data, type) {
    return JSON.stringify({
      data: data,
      type: type,
      time: Date.now()
    });
  }

  static logDate() {
    console.log("时间：" + Util.dateFormate(new Date(), 'yyyy-MM-dd HH:mm:ss'));
  }

  static date() {
    return Util.dateFormate(new Date(), 'yyyy-MM-dd HH:mm:ss');
  }

  // var time1 = new Date().Format(“yyyy-MM-dd”);
  // var time2 = new Date().Format(“yyyy-MM-dd HH:mm:ss”);
  static dateFormate(date, fmt) { //author: meizz
    var o = {
      "M+": date.getMonth() + 1, //月份
      "d+": date.getDate(), //日
      "H+": date.getHours(), //小时
      "m+": date.getMinutes(), //分
      "s+": date.getSeconds(), //秒
      "q+": Math.floor((date.getMonth() + 3) / 3), //季度
      "S": date.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
      if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
  }

  static getAuthKey(url) {
    //auth_key=timestamp-rand-uid-md5hash
    let date = (new Date()).add({
      hours: 24
    });
    let timeStamp = Math.ceil(date.getTime() / 1000);
    let hashValue = crypto.createHash("md5").update(`${url}-${timeStamp}-0-0-${config.authKey}`).digest("hex");
    return `${timeStamp}-0-0-${hashValue}`;
  }

  static uuid(value) {
    let uuid = Math.ceil(Date.now() / 1000);
    if (value)
      return `${value}-${uuid}`;
    else
      return uuid;
  }

  static random(length) {
    let buf = crypto.randomBytes(length);
    return buf.toString('hex');
  }

  static randomNum(n) {
    var rnd = "";
    for (var i = 0; i < n; i++)
      rnd += Math.floor(Math.random() * 10);
    return rnd;
  }

  static notAllowEmpty(value, text) {
    if (value === "" || typeof value == 'undefined') {
      return {
        code: 20001,
        message: `${text}不能为空`
      }
    }

    return "";
  }

  static getInviterInfoKey(inviterRoomId, inviteeRoomId) {
    return `${inviterRoomId}_${inviteeRoomId}`;
  }

  static getUserTopicTag(roomId, userId) {
    return `${userId}`;
  }

  static convertToList(datas) {
    let lists = [];
    for (let key of Object.keys(datas)) {
      let value = datas[key];
      lists.push(JSON.parse(value));
    }
    return lists;
  }

  static propertyToList(data, propertyName) {
    if (!data)
      return [];
    let pData = data[propertyName];
    if (!pData) {
      return [];
    }
    if (nUtil.isArray(pData))
      return pData;
    else
      return [pData];
  }

  static wrapperPromiseFunc(func, params) {
    if (nUtil.isFunction(func))
      return () => {
        return func.apply(null, params);
      };
    else
      return () => {
        return new Promise((resolve, reject) => {
          resolve(func);
        });
      };
  }

  static getObjectKeys(obj, isLowerCase) {
    let keys = [];
    if (!obj)
      return keys;
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (isLowerCase)
          key = key.toLowerCase();
        keys.push(key);
      }
    }

    return keys;
  }

}

module.exports = Util;
