const co = require("co");
const config = require('../config');
const live = require('../service/live');
const videoCall = require('../service/videocall');
const mns = require('../service/mns/mnstopic');
const alinotify = require('../service/alinotify');
const util = require('../util/util');
const delayQueue = require('../util/delayQueue');
const response = require('../util/response');

class AliCtrl {
  notifyFromMixAvailability(req, res) {
    let {
      Event: event,
      App: app,
      Domain: domain,
      Stream: roomId
    } = req.query;
    let templateName = config.videocall.templateName;
    roomId = roomId.replace(templateName, '');
    alinotify.mixAvailablity(roomId);
    response.success(res);
  }

  notifyFromStream(req, res) {
    let {
      action,
      id: roomId
    } = req.query;
    let result = util.notAllowEmpty(roomId, 'id')
    if (result) {
      response.fail(res, result)
      return;
    }
    co(function*() {
      let liveInfo = yield live.getLives(roomId);
      if (!liveInfo || liveInfo.length == 0) {
        response.success(res);
        return
      }
      if (action === 'publish') {
        alinotify.publish(liveInfo[0]);
      } else if (action === 'publish_done') {
        alinotify.publishEnd(liveInfo[0]);
      }
      response.success(res);
    });
  }

  notifyFromMixStatus(req, res) {
    let {
      MainMixDomain, //主流域名
      MainMixApp, //主流应用
      MainMixStream, // 主流流名
      MixDomain, //副流域名
      MixApp, //副流应用
      MixStream, //副流流名
      MixType, //混流类型（ stream 或者 channel）
      MixTemplate, //混流模板
      Message, //错误描述
      Event, //EventMix EventMixStop，
      Code
    } = req.query;
    let templateName = config.videocall.templateName;
    if (MainMixStream.toLowerCase().indexOf(templateName) > 0) {
      MainMixStream = MainMixStream.replace(templateName, '');
    }

    if (MixStream.toLowerCase().indexOf(templateName) > 0) {
      MixStream = MixStream.replace(templateName, '');
    }

    if (Code == 'Success') {
      live.setProperty(MainMixStream, 'mixedStatus', 1);
      live.setProperty(MixStream, 'mixedStatus', 1);
    } else {
      live.setProperty(MainMixStream, 'mixedStatus', 0);
      live.setProperty(MixStream, 'mixedStatus', 0);
    }

    let msg = util.createMqttMsg({
      mainMixRoomId: MainMixStream, // 主流房间ID
      mixRoomId: MixStream, //副流房间ID
      mixType: MixType, //混流类型（ stream 或者 channel）
      mixTemplate: MixTemplate, //混流模板
      event: Event, //EventMix EventMixStop 混流开始，混流结束
      message: Message, //错误描述
      code: Code
    }, 16);
    co(function*() {
      let ishoster = yield live.isHoster(MainMixStream);
      if (ishoster)
        mns.publish(MainMixStream, msg, 5);
      ishoster = yield live.isHoster(MixStream);
      if (ishoster)
        mns.publish(MixStream, msg, 5);
      response.success(res);
    });
  }
}

module.exports = new AliCtrl()
