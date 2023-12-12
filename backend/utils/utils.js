const { v4: uuidv4 } = require('uuid');

/**
 * 获取随机验证码
 * @param number 随机生成 number 位是随机数， 默认是 4
 * @returns {string}
 */
exports.generateRandomCode = function generateRandomCode(number = 4) {
  return Math.random().toString(36).substring(2, number + 2).toUpperCase();
};

/**
 * 随机生成 6 位数字
 * @returns {number}
 */
exports.generateRandomNumber = function generateRandomNumber() {
  return Math.floor(Math.random() * 900000) + 100000;
};

/**
 * 随机生成uuid，默认是十位数
 */
exports.generateUUid = function generateUUid(number = 10) {
  return uuidv4().replace(/-/g, '').substring(0, number);
}