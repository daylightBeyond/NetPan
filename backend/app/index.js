const Koa = require('koa2');
const cors = require('koa2-cors');
const staticServe = require('koa-static');
const sequelize = require('../db/index'); // 引入 Sequelize 实例
const router = require('../router/index');

// 引入二次封装的 log4j
const logger = require('../utils/logger');
// 引入封装的redis工具方法
const redisUtils = require('../utils/redisUtil');
const { UPLOAD_TEMP_FOLDER } = require('../constants/constants');
// 同步数据库表
sequelize.sync()
  .then(() => {
    console.log('数据库表已同步');
  })
  .catch((err) => {
    console.error('数据库表同步异常', err);
  });

// 解析前端的请求体的参数为 json 格式
const { koaBody } = require('koa-body');

// 创建 koa 示例
const app = new Koa();
// 全局注册 log4js
app.context.logger = logger;
// 全局注册 redisUtils
app.context.redisUtils = redisUtils;
// 配置跨域
app.use(cors({
  origin: 'http://localhost:3002', // 替换成前端的实际地址和端口
  credentials: true,
  // allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  // allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// 托管静态资源,设置静态文件服务的根目录
app.use(staticServe('/app/netpan/file'));

// 配置前端请求
// 下面是文件上传时的配置
app.use(koaBody({
  multipart: true, // 支持文件上传
  formidable: {
    maxFieldSize: 15 * 1024 * 1024, // 设置上传文件的最大大小为 15MB
    uploadDir: UPLOAD_TEMP_FOLDER, // 上传文件的存储目录 '/app/netpan/temp_uploads'
    keepExtensions: true, // 保留扩展名
    multiparty: true, // 允许上传多个文件
  }
}));



// 挂载路由
app.use(router.routes()).use(router.allowedMethods());

// 处理异常中间件
app.on('error', (err, ctx) => {
  // 在这里处理未捕获的异常
  logger.error('异常错误:', err);

  // 可以返回一个适当的错误响应给客户端
  ctx.status = err.status || 500;
  ctx.body = {
    error: {
      message: 'Internal Server Error',
    },
  };
})

module.exports = app;
