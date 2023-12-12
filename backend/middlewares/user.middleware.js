const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const redisUtils = require('../utils/redisUtil');
const { userStatusEnum } = require('../enums/enums');
const { REDIS_TEMP_FOLDER, REDIS_EMAIL_FOLDER } = require('../constants/constants');
const { UserModel } = require("../models");
const handleException = require('../utils/handleException');

/**
 * @description 对密码进行加密
 * @param ctx
 * @param next
 * @returns {Promise<void>}
 */
exports.bcryptPassword = async (ctx, next) => {
  // 1. 获取用户密码
  const { password } = ctx.request.body;

  try {
    // 2. 利用 bcryptjs 对密码进行加密
    const salt = bcrypt.genSaltSync(10); // 进行 10 次加盐
    logger.info('加盐操作', salt);

    // hash 保存的是密文
    const hash = bcrypt.hashSync(password, salt);
    logger.info('密文保存', hash);
    // 3. 将密码挂在到 body，原来的密码覆盖掉
    ctx.request.body.password = hash;

    await next();
  } catch (err) {
    return handleException(ctx, err, '密码加密错误');
  }
};

/**
 * 校验图片验证码
 * @param ctx
 * @param next
 * @returns {Promise<void>}
 */
exports.verifyCaptcha = async (ctx, next) => {
  logger.info('校验图片验证码---开始');
  try {
    const { uid } = ctx.request.body;
    const captcha = await redisUtils.get(`${REDIS_TEMP_FOLDER}:${uid}:captcha`);
    logger.info('获取redis验证码', captcha);

    if (!captcha) {
      logger.info('无图片验证码');
      ctx.throw(401, '验证码已过期');
      return;
    }

    // 忽略大小写
    if (captcha.toLowerCase() !== ctx.request.body.checkCode.toLowerCase()) {
      ctx.throw(401, '无效验证码');
      return;
    }
  } catch (err) {
    return handleException(ctx, err, '图片验证码校验错误');
  }
  logger.info('校验图片验证码---结束');
  await next();
};

/**
 * @description 校验用户登录信息
 * @param ctx
 * @param next
 * @returns {Promise<void>}
 */
exports.verifyLogin = async (ctx, next) => {
  // 1. 判断用户是否存在
  const { username, password } = ctx.request.body;
  try {
    const res = await UserModel.findOne({ where: { username }});
    logger.info('verifyLogin校验用户信息', res);
    if (!res) {
      logger.info(username,'用户不存在');
      ctx.throw(401, '用户不存在');
    }

    // 2. 密码是否匹配（不匹配，报错）
    if (!bcrypt.compareSync(password, res.password)) {
      ctx.throw(401, '密码不匹配');
    }

    // 3. 判断用户禁用状态
    if(res.status === userStatusEnum.DISABLE) {
      ctx.throw(401, '账号已禁用');
    }
  } catch (err) {
    return handleException(ctx, err, '用户登录失败');
  }

  await next();
};

/**
 * @description 根据邮箱校验邮箱验证码的正确性和有效性
 * @param ctx
 * @param next
 * @returns {Promise<void>}
 */
exports.verifyEmailCode = async (ctx, next) => {
  const { email, emailCode } = ctx.request.body;
  try {
    logger.info('校验邮箱验证码---开始');
    const emailCodeRedis = await redisUtils.get(`${REDIS_EMAIL_FOLDER}:${email}:${emailCode}`);
    logger.info('redis中获取邮箱验证码', emailCodeRedis);

    // 1. 判断邮箱验证码是否已过期
    if(!emailCodeRedis) {
      ctx.throw(401, '邮箱验证码已过期');
    }

    // 2. 校验邮箱验证码的准确性
    if(emailCodeRedis != emailCode) {
      ctx.throw(401, '邮箱验证码错误，请重新输入');
    }

  } catch (err) {
    return handleException(ctx, err, '邮箱校验错误');
  }
  ctx.logger.info('校验邮箱验证码---结束');
  await next();
};