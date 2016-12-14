const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const config = require('./config.js');

const videocall = require('./routes/videocallApi');
const live = require('./routes/liveApi');
const base = require('./routes/baseApi');
const im = require('./routes/imApi');
const mns = require('./routes/mnsApi');
const ali = require('./routes/aliApi');
const util = require('./util/util');
const queue = require("./service/mns/mnsqueue");


var app = express();

var server = app.listen(config.port, () => {
  console.log('server listening on port ' + server.address().port);
});

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
  console.log("开始请求：" + req.url + ' body参数:' + JSON.stringify(req.body) + ' query参数:' + JSON.stringify(req.query));
  next();
});

app.use('/', base);
app.use('/im', im);
app.use('/videocall', videocall);
app.use('/live', live);
app.use('/mns', mns);
app.use('/ali', ali);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.log(err)
    res.json({
      code: err.code || err.status,
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  console.log(err)
  res.json({
    code: err.code || err.status,
    message: err.message,
    error: {}
  });
});

process.on('uncaughtException', function(err) {
  console.log(err);
})

module.exports = app;
