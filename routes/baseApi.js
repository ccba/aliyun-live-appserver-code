var express = require('express');
var router = express.Router();
var base = require('../controller/baseCtrl');

router.post('/login', (req, res, next) => {
  base.login(req, res);
})

router.post('/user/add', (req, res, next) => {
  base.addUser(req, res);
})

router.post('/user/delete', (req, res, next) => {
  base.deleteUser(req, res);
})

router.post('/reset', (req, res, next) => {
  base.reset(req, res);
})

router.post('/ali/assume/role', (req, res, next) => {
  base.aliToken(req, res);
})

module.exports = router;
