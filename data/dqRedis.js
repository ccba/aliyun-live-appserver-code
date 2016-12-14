const redis = require('redis');
const util = require('util');
const config = require('../config.js');

class DqRedis {
  constructor(options = config.redis) {
    this.client = redis.createClient({
      host: config.redis.host,
      port: config.redis.port
    });
    if (config.redis.password)
      this.client.auth(config.redis.password, (err) => {
        if (err)
          console.log(err);
      });
    this.client.on("error", function(err) {
      console.log("Redis rrror " + err);
    });
    this.client.on('connect', function() {

      console.log(`Redis connecte to ${config.redis.host}:${config.redis.port}`);
    });
  }
}

module.exports = new DqRedis().client;
