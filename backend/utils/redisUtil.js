const redis = require('redis');
const {promisify} = require('util');
// 引入 封装的 log4js
const logger = require('./logger.js');
// 获取redis配置信息
const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;
// 创建一个 Redis 客户端实例
const client = redis.createClient({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD
});

// 将 Redis 操作方法转换为 Promise 风格
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const delAsync = promisify(client.del).bind(client);

// 封装常用的 Redis 工具方法
const redisUtils = {
  get: async (key) => {
    try {
      const value = await getAsync(key);
      // logger.info(`redis get 值：`, value);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('redis get方法发生错误：', error);
      return null;
    }
  },

  set: async (key, value, expirationInSec) => {
    try {
      const stringValue = JSON.stringify(value);
      // logger.info('redis set 值', value);
      if(expirationInSec) {
        await setAsync(key, stringValue, 'EX', expirationInSec);
      } else {
        await setAsync(key, stringValue);
      }
      return true;
    } catch (error) {
      logger.error('redis set方法发生错误：', error);
      return false;
    }
  },

  del: async (key) => {
    try {
      // logger.info(`redis delete 值：${key}`);
      await delAsync(key);
      return true;
    } catch (error) {
      logger.error('redis del方法发生错误：', error);
      return false;
    }
  }
};

module.exports = redisUtils;