// response-handler.js
const logger = require('../utils/logger');
async function responseHandler(ctx, next) {
  try {
    // 执行下一个中间件
    await next();

    // 如果没有抛出异常，则认为是成功的响应
    if (!ctx.body && ctx.status === 404) {
      ctx.status = 404;
      ctx.body = {
        status: 'error',
        message: 'Not Found',
      };
    } else {
      // 在这里设置成功的响应格式
      ctx.body = {
        status: 'success',
        data: ctx.body,
      };
    }
  } catch (error) {
    // 在这里处理捕获到的异常
    ctx.status = error.status || 500;
    ctx.body = {
      status: 'error',
      message: error.message || 'Internal Server Error',
    };
    // 可以在这里记录日志或者执行其他操作
    logger.error(error);
  }
}

module.exports = responseHandler;