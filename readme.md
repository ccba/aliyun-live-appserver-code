Node.js实现的阿里云直播连麦demo的Appserver程序, [说明文档](https://github.com/ccba/aliyun-live-appserver-doc)

## 安装依赖环境

### Node.js
参考官网：https://nodejs.org/en/download/   安装完后，在命令窗口输入：node -v  验证是否安装成功
### Redis
官网下载安装redis, 启动服务，参考:http://www.runoob.com/redis/redis-install.html

## 安装Appserver
获取代码，进入aliyun-live-appserver-code目录 运行命令:
```python
npm install
```

## 修改配置
配置是在config.js文件里

        ```ruby
        config = {
          port: 4000, //服务端口号
          ip: "localhost", //服务IP地址
          //根据安装的redis, 修改对应的配置
          redis: {
            password: "", //redis连接密码
            host: 'localhost', //redis的host
            port: 6379, //redis端口号
            keyprefix: 'mns'
          },
      
          ali: {
            mnsTopic: {  //阿里云mns服务信息配置
              topicWebsocketServerIp: "115.28.250.251",
              subscriptionEndpoint: "WebSocket"
            },
            //填写阿里的帐号信息
            ownerId: '1252745454',
            accessKeyID: 'Q1dfW3pBESJS',
            accessKeySecret: 'sdDpBtlS9Bcg80eU5cwTMzvGU',
            mnsVersion: '2015-06-06', //mns接口版本
            region: 'cn-qingdao-internal-japan-test', 
            // region: 'cn-hangzhou',
            commonParams: {
              Format: 'json',
              SignatureMethod: 'HMAC-SHA1',
              SignatureVersion: '1.0'
            },
            urls: {
              cdn: { //cdn地址和版本
                url: 'https://cdn.aliyuncs.com',
                version: '2014-11-11'
              }
            }
          },
          videocall: {
            templateName: '_mix' //CDN混流模版名称，默认为mix
          },
          //用于生产直播推流和播放地址 这个要到阿里云控制台配置自己的推流和播放域名
          authKey: 'qupaivid', //用于生产推流鉴权的key， 如果为空将不添加auth_key参数
          appName: 'DemoApp',
          isCenterPush: false, //是否中心推流 rtmp://video-center.alivecdn.com/DemoApp/3ff0274890?vhost=videocall.play.aliyun.com
          rtmpHost: 'videocall.push.aliyun.com', //推流host域名
          playHost: 'videocall.play.aliyun.com', //播放host域名
        }
        ```

一般需要配置redis， 阿里帐号，直播相关信息

1. 阿里云帐号信息

   [阿里的帐号信息](https://help.aliyun.com/knowledge_detail/38738.html)

    ownerId: '1252745454' //帐号信息里的账号ID

    accessKeyID: 'Q1dfW3pBESJS'

    accessKeySecret: 'sdDpBtlS9Bcg80eU5cwTMzvGU'

2. 直播相关信息

      //用于生产直播推流和播放地址 这个要到阿里云控制台配置自己的推流和播放域名

      authKey: 'qupaivid', //用于生产推流[鉴权的key](https://help.aliyun.com/document_detail/45210.html) 如果为空将不添加auth_key参数 
      
      下面的参数根据你的直播控制台里的配置填写[直播控制台](https://help.aliyun.com/document_detail/29957.html?spm=5176.doc45215.6.546.CjFllk)

      appName: 'DemoApp',

      isCenterPush: false, //是否中心推流 rtmp://video-center.alivecdn.com/
      DemoApp/3ff0274890?vhost=videocall.play.aliyun.com

      rtmpHost: 'videocall.push.aliyun.com', //推流host域名

      playHost: 'videocall.play.aliyun.com', //播放host域名

## 运行程序
进入aliyun-live-appserver-code目录， 运行命令：
```python
node app.js
```

运行成功:

![success](https://github.com/ccba/aliyun-live-appserver-code/blob/master/success.png "success")

如果运行成功， APP客户端就可以通过http://[appserver ip]:[port]/[api url], 例如: http://192.168.10.23:4000/live/create [接口参考](https://github.com/ccba/aliyun-live-appserver-doc)

## 使用PM2管理程序（可选择）

### 安装进程管理器pm2
运行命令：cnpm install pm2 -g

### 启动程序
进入aliyunlivedemo目录， 运行: npm run prod

### 关闭程序
 进入aliyunlivedemo目录， 运行: npm run stop

