var express = require('express');
var router = express.Router();
var mns = require('../controller/mnsCtrl');

router.post('/topic/websocket/info', (req, res, next) => {
  mns.websocketInfo(req, res);
});

router.get('/queues', (req, res, next) => {
  mns.getQueues(req, res);
});

router.post('/request/headers', (req, res, next) => {
  mns.getHeaders(req, res);
});

module.exports = router;
