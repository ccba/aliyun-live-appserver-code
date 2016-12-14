var express = require('express');
var router = express.Router();
var videocallCtrl = require('../controller/videocallCtrl');

/* GET home page. */
router.post('/invite', (req, res, next) => {
  videocallCtrl.invite(req, res);
});

/* GET home page. */
router.post('/feedback', (req, res, next) => {
  videocallCtrl.feedback(req, res);
});


/* GET close . */
router.post('/close', (req, res, next) => {
  videocallCtrl.close(req, res);
});



module.exports = router;
