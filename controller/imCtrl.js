const co = require("co");
const response = require('../util/response');
const em = require('../service/em');
const live = require('../service/live');

class IMCtrl {

  //得到观众列表
  getRoomUsers(req, res) {
    let {
      roomId: roomId1
    } = req.body;
    let {
      roomId: roomId2
    } = req.query;
    let roomId = roomId1 || roomId2;
    co(function*() {
      "use strict";
      var users = yield live.getPlayListUsers(roomId);

      response.success(res, users);
    }).catch((err) => {
      response.onError(err, res);
    });
  }
}

module.exports = new IMCtrl();
