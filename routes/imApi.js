var express = require('express');
var router = express.Router();
var imCtrl = require('../controller/imCtrl');

router.post('/room/create', (req, res, next) => {
  imCtrl.createRoom(req, res);
})

router.post('/room/delete', (req, res, next) => {
  imCtrl.createRoom(req, res);
})

router.post('/user/add', (req, res, next) => {
  imCtrl.createRoom(req, res);
})

router.post('/user/delete', (req, res, next) => {
  imCtrl.createRoom(req, res);
})

router.post('/room/users', (req, res, next) => {
  imCtrl.getRoomUsers(req, res);
})

router.get('/room/users', (req, res, next) => {
  imCtrl.getRoomUsers(req, res);
})

module.exports = router;
