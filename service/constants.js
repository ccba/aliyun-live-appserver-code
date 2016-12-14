const config = require('../config.js');
exports.LIVE_LIST_KEY = `${config.redis.keyprefix}/live/list`;
exports.INVITER_LIST_KEY = `${config.redis.keyprefix}/inviter/list`;
exports.USER_LIST_KEY = `${config.redis.keyprefix}/user/list`;
exports.USER_ID_INDEX = `${config.redis.keyprefix}_user_ID_Index`;
exports.UQEUE_NAME_PRFIX = "vcq";



exports.ALI_MIX_ERROR_CODE = {
  InvalidArgument: 3400,
  NoSuchStream: 3404,
  InternalError: 3500
}
