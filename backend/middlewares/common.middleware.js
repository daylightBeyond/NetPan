const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { UserModel } = require('../models/index');
const { JWT_SECRET } = process.env;


/**
 * @description 验证用户名和密码的中间件
 * @param ctx
 * @param next
 */
exports.userValidator = async (ctx, next) => {
  // 1. 获取用户传递的参数
  const { username, password } = ctx.request.body;

  // 2. 判断用户名、密码是否存在
  if(!username || !password) {
    logger.error('用户名或密码为空', ctx.request.body);
    ctx.throw(401, '用户名或密码为空');
  }

  await next();
};

/**
 * @description 验证该账号是否已经存在
 * @param ctx
 * @param next
 * @returns {Promise<void>}
 */
exports.verifyUser = async (ctx, next) => {
  try {
    // 1. 判断用户名是否存在
    const { username } = ctx.request.body;

    const res = UserModel.findOne({ where: { username }});

    // 2. 如果存在，说明用户名重复
    if(res.length) {
      logger.error('用户名已经存在', res);
      ctx.throw(401, '用户名已经存在');
      // return;
    }
  } catch (err) {
    logger.error('获取用户信息错误', err);
    ctx.throw(401, '获取用户信息错误');
    // return;
  }

  await next();
};

/**
 * 判断邮箱是否已经注册了
 * @param ctx
 * @param next
 */
exports.verifyEmail = async (ctx, next) => {
  try {
    const { email, type } = ctx.request.body;
    // type 0:注册 1：找回密码
    if(type == 0) {
      // 首先查询数据库中是否有该邮箱
      const queryUserEmail = UserModel.findOne({ where: { email }});
      if(queryUserEmail.length) {
        ctx.throw(401, '邮箱已经存在， 请勿重复注册');
      }
    }
  } catch (e) {
    logger.error('邮箱校验错误', e);
    throw new Error("邮箱校验错误", e);
  }

  await next();
};

/**
 * @description jwt鉴权，在接口请求之前判断token的有效性
 * @param ctx
 * @param next
 * @returns {Promise<boolean>}
 */
exports.authMiddleware = async (ctx, next) => {
  const { authorization = '' } = ctx.request.header;
  const token = authorization.replace('Bearer ', '');
  // logger.info('token', token);
  try {
    // user 包含了payload信息(userId, user_name, password)
    const user = jwt.verify(token, JWT_SECRET);
    // logger.info('jwt鉴权', user);
    ctx.state.user = user;
  } catch (err) {
    switch (err.name) {
      case 'TokenExpiredError':
        logger.error('token已过期', err);
        ctx.throw(401, 'token已过期，请重新登录');
      case 'JsonWebTokenError':
        logger.error('无效的token', err);
        ctx.throw(401, '无效的token，请重新登录');
    }
  }

  await next();
};
