let config = {
  port: 4000,
  ip: "localhost",
  redis: {
    // host: '121.43.112.6',
    password: "",
    host: '127.0.0.1',
    port: 6379,
    keyprefix: 'mns'
  },
  ali: {
    mnsTopic: {
      topicWebsocketServerIp: "115.28.250.251",
      subscriptionEndpoint: "WebSocket"
    },
    ownerId: '1252773433',
    accessKeyID: 'Q1dfW3pBESJS',
    accessKeySecret: 'sdDpBtlS9Bcg80eU5cwTMzvGU',
    mnsVersion: '2015-06-06',
    region: 'cn-qingdao-internal-japan-test',
    // region: 'cn-hangzhou',
    commonParams: {
      Format: 'json',
      SignatureMethod: 'HMAC-SHA1',
      SignatureVersion: '1.0'
    },
    urls: {
      sts: {
        url: 'https://sts.aliyuncs.com',
        version: '2015-04-01'
      },
      cdn: {
        url: 'https://cdn.aliyuncs.com',
        version: '2014-11-11'
      }
    }
  },
  videocall: {
    templateName: '_mix'
  },
  //用于生产直播推流和播放地址 这个要到阿里云控制台配置自己的推流和播放域名
  authKey: 'qupaivid', //用于生产推流鉴权的key， 如果为空将不添加auth_key参数
  appName: 'DemoApp',
  isCenterPush: false, //是否中心推流 rtmp://video-center.alivecdn.com/DemoApp/3ff0274890?vhost=videocall.play.aliyun.com
  rtmpHost: 'videocall.push.aliyun.com', //推流host域名
  playHost: 'videocall.play.aliyun.com', //播放host域名
}


module.exports = config;
