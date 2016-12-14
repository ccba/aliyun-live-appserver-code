const http = require('http');
const pooling = require('./queuepooling');

var server = http.createServer(function(req, res) {
  pooling.start();
  res.writeHeader(200, {
    'Content-Type': 'text/plain;charset=utf-8' // 添加charset=utf-8
  });
  res.end("MNS服务");
});
server.listen(8888);
console.log("http server running on port 8888 ...");

// pooling.start();
process.on('uncaughtException', function(err) {
  console.log(err);
})
