const logger = require('./logger');

/**
 * @description 返回异常信息给前端
 * @param ctx 上下文
 * @param err 错误对象
 * @param errorMsg 错误信息
 */
const handleException = function (ctx, err, errorMsg = '异常错误') {
  logger.error(errorMsg, err);
  ctx.status = err.status || 500;
  ctx.body = {
    success: false,
    errorMsg,
    err
  };
};

module.exports = handleException;