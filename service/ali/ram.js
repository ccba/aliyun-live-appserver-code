const request = require('./alirequest');
const config = require('../../config');

class RAM {
  static assumeRole(assumeRole, roleSessionName, policy = '', durationSeconds = config.ali.tokeExpired) {
    let query = {
      Action: 'AssumeRole',
      RoleArn: assumeRole,
      RoleSessionName: roleSessionName,
      DurationSeconds: durationSeconds
    };
    if (policy)
      query["Policy"] = policy;
    query['AccessKeyId'] = config.ali.sts.AccessKeyId;
    query['AccessKeySecret'] = config.ali.sts.AccessKeySecret;
    query['Version'] = config.ali.urls.sts.version;
    return request.get(config.ali.urls.sts.url, query);
  }
}

module.exports = RAM;
