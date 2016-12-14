var express = require('express');
var router = express.Router();
var aliCtrl = require('../controller/aliCtrl');

router.get('/stream/notify', (req, res, next) => {
  aliCtrl.notifyFromStream(req, res);
});

router.get('/mix/status/notify', (req, res, next) => {
  aliCtrl.notifyFromMixStatus(req, res);
});

router.get('/mix/availability/notify', (req, res, next) => {
  aliCtrl.notifyFromMixAvailability(req, res);
});



module.exports = router;
