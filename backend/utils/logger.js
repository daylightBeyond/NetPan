const log4js = require('log4js');

// 加载 log4js配置文件
log4js.configure('log4js.json');

// 创建日志记录器并到处
const logger = log4js.getLogger();

module.exports = logger;

// 封装一个自定义日志输出函数
// function log(level, ...args) {
//   if (logger[level]) {
//     logger[level](...args);
//   } else {
//     logger.info(...args); // 默认使用 info 级别
//   }
// }

// module.exports = {
//   trace: (...args) => log('trace', ...args),
//   debug: (...args) => log('debug', ...args),
//   info: (...args) => log('info', ...args),
//   warn: (...args) => log('warn', ...args),
//   error: (...args) => log('error', ...args),
//   fatal: (...args) => log('fatal', ...args),
// }
