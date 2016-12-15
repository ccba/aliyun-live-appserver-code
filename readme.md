Node.js实现的阿里云直播连麦demo的Appserver程序, [说明文档](https://github.com/ccba/aliyun-live-appserver-doc)

## 依赖环境

### 手动安装

#### Node.js
参考官网：https://nodejs.org/en/download/   安装完后，在命令窗口输入：node -v  验证是否安装成功
#### Redis
官网下载安装redis, 启动服务，参考:http://www.runoob.com/redis/redis-install.html

### 镜像市场安装
在申请阿里云ECS时， 镜像类型选择**镜像市场**, 从镜像市场选择，输入关键字**Nodejs集成环境**过滤,选择对应操作系统的镜像。

## 安装程序
运行命令:

```python
npm install  aliyunlivedemo
```
## 修改配置
配置定义在config.js文件中
```ruby
config = {
  port: 4000, //服务端口号
  ip: "localhost", //服务IP地址
  redis: {
    password: "videocall", //redis连接密码
    host: 'localhost', //redis的host
    port: 6379, //redis端口号
    keyprefix: 'mns'
  },
  ali: {
    mnsTopic: {  //阿里云mns服务信息配置
      topicWebsocketServerIp: "115.28.250.251",
      subscriptionEndpoint: "WebSocket"
    },
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
  appName: 'DemoApp',
  authKey: 'qupaivid', //用于生产推流鉴权的key， 如果为空将不添加auth_key参数
  appName: 'DemoApp',
  isCenterPush: false, //是否中心推流 rtmp://video-center.alivecdn.com/DemoApp/3ff0274890?vhost=videocall.play.aliyun.com
  rtmpHost: 'videocall.push.aliyun.com', //推流host域名
  playHost: 'videocall.play.aliyun.com', //播放host域名
}
```

## 运行程序
进入aliyunlivedemo目录， 运行命令：
```python
node app.js
```
## 特殊情况处理
因为连麦异常通知消息包含空格， 导致appserver消息接受不到,CDN的要下次发布时候添加decode，临时解决方案是这个回调通过nginx代理跳转， 下一版本就不用这一步了。

### 安装nginx
1. 安装参考：http://blog.csdn.net/molingduzun123/article/details/51850925  zlib可以不安装
2. 配置ngix.conf, 添加端口

```python
   server {
        listen 9020;
        server_name localhost;
        index index.html;

        location /ali/mix/status/notify  {
            set $args MainMixDomain=$arg_MainMixDomain&MainMixApp=$arg_MainMixApp&MainMixStream=$arg_MainMixStream&MixDomain=$arg_MixDomain&MixApp=$arg_MixApp&MixStream=$arg_MixStream=$arg_MixStream&MixType=$arg_MixType&MixTemplate=$arg_MixTemplate&Event=MixResult&Code=$arg_Code&Message=$arg_Code;

            proxy_pass http://localhost:4000/ali/mix/status/notify;
          }
        } 
```

## 使用PM2管理程序（可选择）

### 安装进程管理器pm2
运行命令：cnpm install pm2 -g

### 启动程序
进入aliyunlivedemo目录， 运行: npm run prod

### 关闭程序
 进入aliyunlivedemo目录， 运行: npm run stop
