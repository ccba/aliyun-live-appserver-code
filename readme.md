Node.js实现的阿里云直播连麦demo的Appserver程序

## 依赖环境

### Node.js
参考官网：https://nodejs.org/en/download/   安装完后，在命令窗口输入：node -v  验证是否安装成功
### Redis
官网下载安装redis, 启动服务，参考:http://www.runoob.com/redis/redis-install.html

## 安装程序
运行命令:

```python
npm install  aliyunlivedemo
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
进入程序根目录， 运行: npm run prod

### 关闭程序
 进入程序根目录， 运行: npm run stop
