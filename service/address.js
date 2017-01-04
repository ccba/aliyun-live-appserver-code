const config = require('../config.js');
const util = require('../util/util.js');
var address = {
  getRtmpUrl: (roomId) => {
    let url = `/${config.appName}/${roomId}`,
      host = config.rtmpHost;
    let auth_key = "";
    if (config.authKey) {
      auth_key = util.getAuthKey(url);
    }
    if (config.isCenterPush) {
      url = `${url}?vhost=${config.playHost}`;
      host = 'video-center.alivecdn.com';
    }
    url = `rtmp://${host}${url}`;
    if (auth_key) {
      let op = url.indexOf('?') > 0 ? '&' : '?';
      url = `${url}${op}auth_key=${auth_key}`;
    }
    return url;
  },

  getShortPlayUrl: (roomId, ext = 'flv') => {
    let url = `/${config.appName}/${roomId}.${ext}`;
    return `http://${config.playHost}${url}?ali_flv_retain=0`;
  },

  getPlayUrl: (roomId, mixString = config.videocall.templateName, ext = 'flv') => {
    let url = `/${config.appName}/${roomId}${mixString}.${ext}`;
    return `http://${config.playHost}${url}`;
  },

  getRtmpPlayUrl: (roomId, mixString = config.videocall.templateName) => {
    let url = `/${config.appName}/${roomId}${mixString}`;
    return `rtmp://${config.playHost}${url}`;
  },
  getMixplayUrl: (roomId) => {
    let url = `/${config.appName}/${roomId}${config.videocall.templateName}`;
    return `http://${config.playHost}${url}`;
  },

  getMixPlayUrlByStream: (stream) => {
    return `http://${config.playHost}/${config.appName}/${stream}`;
  }
}

module.exports = address;
