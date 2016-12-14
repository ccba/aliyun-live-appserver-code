const request = require('./alirequest');
const config = require('../../config');

class CDN {
  static startMux(mainRoomId, roomId, mixTemplate = 'picture_in_picture', mixType = 'channel') {
    let query = {
      Action: 'StartMixStreamsService',
      MainDomainName: config.playHost,
      MainAppName: config.appName,
      MainStreamName: mainRoomId,
      MixDomainName: config.playHost,
      MixAppName: config.appName,
      MixStreamName: roomId,
      MixTemplate: mixTemplate,
      MixType: mixType
    };
    query['AccessKeyId'] = config.ali.accessKeyID;
    query['AccessKeySecret'] = config.ali.accessKeySecret;
    query['Version'] = config.ali.urls.cdn.version;
    return request.get(config.ali.urls.cdn.url, query);
  }

  static stopMux(mainRoomId, roomId) {
    let query = {
      Action: 'StopMixStreamsService',
      MainDomainName: config.playHost,
      MainAppName: config.appName,
      MainStreamName: mainRoomId,
      MixDomainName: config.playHost,
      MixAppName: config.appName,
      MixStreamName: roomId,
    };
    query['AccessKeyId'] = config.ali.accessKeyID;
    query['AccessKeySecret'] = config.ali.AccessKeySecret;
    query['Version'] = config.ali.urls.cdn.version;
    return request.get(config.ali.urls.cdn.url, query);
  }
}

module.exports = CDN;
