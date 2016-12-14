var express = require('express');
var router = express.Router();
var liveCtrl = require('../controller/liveCtrl');

router.post('/create', (req, res, next) => {
  liveCtrl.create(req, res);
})


router.post('/play', (req, res, next) => {
  liveCtrl.play(req, res);
})

router.post('/leave', (req, res, next) => {
  liveCtrl.leave(req, res);
})

router.post('/audience/leave', (req, res, next) => {
  liveCtrl.userLeave(req, res);
})

router.post('/comment', (req, res, next) => {
  liveCtrl.comment(req, res);
});

router.post('/like', (req, res, next) => {
  liveCtrl.like(req, res);
});

router.post('/list', (req, res, next) => {
  liveCtrl.list(req, res);
});

router.get('/list', (req, res, next) => {
  liveCtrl.list(req, res);
});



module.exports = router;
