const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const svgCaptcha = require('svg-captcha');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const { UserModel, EmailModel, FileModel } = require('../models/index');
const logger = require('../utils/logger');
const redisUtils = require('../utils/redisUtil');
const { generateRandomCode, generateRandomNumber, generateUUid } = require('../utils/utils');
const { userStatusEnum } = require('../enums/enums');
const { getMimeType, isFolderExits } = require('../utils/fileUtils');
const {
  ZERO,
  REDIS_EMAIL_FOLDER,
  REDIS_TEMP_FOLDER,
  REDIS_KEY_EXPIRE_SIX_MIN,
  REDIS_USER_FOLDER,
  REDIS_KEY_EXPIRE_DAY,
  REDIS_KEY_EXPIRE_SEVEN_DAY,
  INIT_TOTAL_SPACE,
  MB,

  PROJECT_FOLDER,
  FILE_FOLDER_FILE,
  FILE_FOLDER_AVATAR_NAME,
  AVATAR_DEFAULT,
  DEFAULT_AVATAR_TYPE
} = require('../constants/constants');
const handleException = require('../utils/handleException');

const { ADMIN_EMAIL, JWT_SECRET, JWT_EXPIRE } = process.env;

// 邮箱发送配置
const mailConfig = {
  service: 'qq', // QQ 邮箱服务提供商
  auth: {
    user: 'test@qq.com', // 发送验证码的邮箱地址
    pass: '11111', // 发送验证码的邮箱密码或授权码
  }
};

class UserController {
  async test(ctx) {
    const path = '/202401/Snipaste_2024-01-01_17-26-38.png';
    ctx.redirect(path);
    // ctx.send(path);
    // ctx.body = { relativeUrl };
    // return;
    // try {
    //   const users = await UserModel.findAll('a');
    //   console.log('users', users);
    //   ctx.body = { users, aa: REDIS_EMAIL_FOLDER };
    // } catch (err) {
    //   console.log('数据库查找异常', err)
    //   return handleException(ctx, err, '数据库查找异常');
    // }
  };

  // 获取验证码
  async getCheckCode(ctx) {
    logger.info('开始生成验证码');
    // 生成验证码
    const captcha = svgCaptcha.create({
      size: 4, // 验证码长度
      ignoreChars: 'Oo1i', // 避免包含难以识别的字符
      noise: 3, // 干扰线条数
      color: true, // 颜色
      background: '#f0f0f0', // 背景色
    });
    const uid = generateRandomCode(6);

    try {
      // 将验证码存储到 redis中
      await redisUtils.set(`${REDIS_TEMP_FOLDER}:${uid}:captcha`, captcha.text, REDIS_KEY_EXPIRE_SIX_MIN);
    } catch (e) {
      logger.error('验证码生成错误', e);
      throw new Error("验证码生成错误");
      return;
    }

    // 设置响应头
    ctx.type = 'image/png+xml';
    ctx.body = {
      success: true,
      uid: uid,
      text: captcha.text,
      data: captcha.data
    };
    logger.info('验证码生成结束', captcha.text);
  };

  /**
   * 获取邮箱验证码
   * 1. 首先查询数据库中是否有该邮箱
   * 2. 如果有则 提示邮箱已存在，否则就进行下一步
   * 3. 然后将该邮箱的验证的使用状态从未使用 => 已使用，0 => 1
   * 4. 发送邮箱验证码
   */
  async sendEmailCode(ctx) {
    logger.info('开始发送邮箱验证码');
    // email 字段必传
    const { email } = ctx.request.body;
    if (!email) {
      ctx.status = 400;
      ctx.body = { error: '必须选择邮箱' };
      return;
    }
    try {
      // 将该邮箱的验证码置为无效
      logger.info('更新邮箱验证码的有效性----开始');
      await EmailModel.update({ status: 1 }, {
        where: {
          email,
          status: 0
        }
      })
      logger.info('更新邮箱验证码的有效性----结束');

      // 生成随机验证码
      const emailCode = generateRandomNumber();
      // 创建邮件传输对象
      const transporter = nodemailer.createTransport(mailConfig);
      // 设置邮箱内容
      const mailOptions = {
        from: '2020658964@qq.com', // 发送验证码的邮箱地址
        to: email,
        subject: 'netpan验证码', // 邮箱主题
        text: `您的netpan邮箱验证码是：${emailCode}，六分钟内有效，请尽快使用`
      };

      // 发送邮件
      logger.info('发送邮箱验证码----开始');
      logger.info('邮箱发送内容：', mailOptions);
      await transporter.sendMail(mailOptions);
      logger.info('发送邮箱验证码----结束');
      // 将邮箱验证码存储到redis中
      await redisUtils.set(`${REDIS_EMAIL_FOLDER}:${email}:${emailCode}`, emailCode, REDIS_KEY_EXPIRE_SIX_MIN);
      const emailServerParams = {
        email,
        code: emailCode,
        createTime: new Date(),
        status: ZERO
      };
      // 往表中插入数据
      await EmailModel.create(emailServerParams);
      // 处理验证码
      ctx.body = {
        code: 200,
        success: true,
        message: '邮箱验证码发送成功，请查看邮箱',
        emailCode
      };
    } catch (err) {
      return handleException(ctx, err, '发送邮箱验证码失败');
    }
    logger.info('邮箱验证码发送结束');
  };

  /**
   * 注册
   */
  async register(ctx) {
    logger.info('开始注册');
    /**
     * username: 用户账号
     * password：用户密码
     * checkCode：验证码
     * uid：验证码匹配的临时uid
     * email: 邮箱
     * emailCode: 邮箱验证码
     */
      // 1. 获取用户账号密码
    const { username, password, email } = ctx.request.body;
    // 2. 随机生成 10 位数的 user_id
    const userId = generateUUid();
    const joinTime = new Date(); // 创建时间
    const useSpace = 0; // 使用空间
    const totalSpace = INIT_TOTAL_SPACE * MB; // 1024 MB 分配用户初始空间
    // 3. 往数据库中添加数据
    const createUserParams = {
      userId,
      username,
      password,
      email,
      joinTime,
      status: userStatusEnum.ENABLE, // 账号启用状态
      useSpace,
      totalSpace,
      admin: email === ADMIN_EMAIL ? 1 : 0 // 是否为超级管理员账号 0：否 1：是
    };

    try {
      // 往表中插入数据
      await UserModel.create(createUserParams);
      // 4. 返回结果
      const body = {
        code: 200,
        message: '用户注册成功',
        success: true,
      }

      logger.info('注册结束');

      ctx.body = body;
    } catch (err) {
      return handleException(ctx, err, '用户注册失败');
    }
  };

  /**
   * 登录
   */
  async login(ctx) {
    logger.info('开始登录');
    const { username, password } = ctx.request.body;

    try {
      await UserModel.update({ lastLoginTime: new Date() }, {
        where: {
          username: username
        }
      })
      logger.info('更新用户信息');
      const res = await UserModel.findOne({ where: { username } });
      logger.info('查询用户信息：', res);
      const userId = res.userId;
      // 以 username, password 进行加密生成 token，JWT_SECRET 是秘钥，expiresIn 设置有效期
      const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
      await redisUtils.set(`${REDIS_USER_FOLDER}:${userId}:token`, token, REDIS_KEY_EXPIRE_SEVEN_DAY);
      await redisUtils.set(`${REDIS_USER_FOLDER}:${userId}:userInfo`, res, REDIS_KEY_EXPIRE_DAY);

      // 查询用户上传文件的总大小
      const fileSizeSum = await FileModel.sum('fileSize', { where: { userId } });
      logger.info('登录时获取用户上传文件总大小fileSizeSum', fileSizeSum || 0);
      await redisUtils.set(`${REDIS_USER_FOLDER}:${userId}:fileSizeSum`, fileSizeSum || 0, REDIS_KEY_EXPIRE_DAY);

      const body = {
        code: 200,
        success: true,
        message: '用户登录成功',
        data: {
          username,
          admin: res['admin'],
          userId: res['userId'],
          email: res['email'],
          useSpace: fileSizeSum,
          totalSpace: res['totalSpace'],
          token
        }
      };
      ctx.logger.info('登录方法结束');
      ctx.body = body;
    } catch (err) {
      return handleException(ctx, err, '用户登录失败');
    }
  };

  /**
   * 重置密码接口
   * @param ctx
   * @returns {Promise<void>}
   */
  async resetPassword(ctx) {
    // 1. 获取数据
    console.log('获取user', ctx.state.user);
    const { userId } = ctx.state.user;
    const { password } = ctx.request.body;

    console.log('获取密码', password);

    // 2. 操作数据库
    try {
      const updateRes = await UserModel.update({ password }, { where: { userId } });
      logger.info('更新用户信息', updateRes);

      ctx.body = {
        success: 200,
        message: '密码重置成功',
        data: null
      };
    } catch (err) {
      return handleException(ctx, err, '重置密码异常');
    }
  };

  /**
   * 获取头像接口
   * 1. 因为用户刚开始注册时，没有上传过头像，那么就需要给一个默认头像
   * 2. 所以开发之前 先创建存放默认头像的文件目录
   * 3. 然后根据用户ID匹配头像，没有的话，返回默认头像
   * @param ctx
   * @param next
   * @returns {Promise<void>}
   */
  async getAvatar(ctx) {
    logger.info('获取用户头像---开始');

    const { userId } = ctx.request.body;
    const avatarFolderName = PROJECT_FOLDER + FILE_FOLDER_FILE + FILE_FOLDER_AVATAR_NAME;
    let avatarPath = null, avatarType = null; // 头像路径，头像类型
    console.log('avatarFolderName', avatarFolderName);

    const avatarInfo = await UserModel.findOne({ where: { userId } });
    console.log('avatarInfo', avatarInfo);

    if (avatarInfo['avatarPath']) {
      avatarPath = avatarInfo['avatarPath'];
      avatarType = getMimeType(avatarInfo['avatarType']);
    } else {
      avatarPath = avatarFolderName + AVATAR_DEFAULT;
      avatarType = DEFAULT_AVATAR_TYPE;
    }
    console.log('avatarPath:', avatarPath);

    try {
      const file = fs.readFileSync(avatarPath);
      console.log('file', file)
      const resizedImage = await sharp(avatarPath).resize(300, 300).toBuffer();
      // const avatarData = await readFileAsync(avatarPath);

      ctx.type = avatarType;
      // 本来这里是想转成 base64，但是页面上无法显示图片
      // const imageBase64 = Buffer.from(avatarData).toString('base64');
      // ctx.body = imageBase64;

      ctx.body = Buffer.from(resizedImage, 'binary');

    } catch (err) {
      return handleException(ctx, err, '读取头像异常');
    }
    logger.info('获取用户头像---结束');
  };

  // 获取用户网盘空间使用情况
  async getUseSpace(ctx) {
    logger.info('获取用户网盘空间使用信息--开始');
    const user = ctx.state.user;
    const { userId } = user;
    logger.info('获取用户ID', userId);

    try {
      const res = await UserModel.findOne({ where: { userId } });
      logger.info('根据用户id查询用户信息', res);

      // 查询用户上传文件的总大小
      const fileSizeSum = await FileModel.sum('fileSize', { where: { userId } });
      logger.info('用户上传文件总大小fileSizeSum', fileSizeSum);

      ctx.body = {
        code: 200,
        success: true,
        data: {
          useSpace: fileSizeSum || 0,
          totalSpace: res['totalSpace']
        }
      };
      logger.info('获取用户网盘空间使用信息--结束');
    } catch (err) {
      return handleException(ctx, err, '获取用户信息异常');
    }
  };

  // 退出登录
  async logout(ctx) {
    try {
      if (ctx.state.user) {
        const { userId } = ctx.state.user;
        await redisUtils.del(`${REDIS_USER_FOLDER}:${userId}:token`);
        delete ctx.state.user;
      }

      ctx.body = {
        code: 200,
        success: true,
      };
    } catch (err) {
      logger.error('退出异常', err);
      ctx.status = err.status || 500;
      ctx.body = "退出异常";
      return;
    }
  };

  // 更新头像
  async updateUserAvatar(ctx) {
    logger.info('更新用户头像---开始');
    console.log('请求文件参数', ctx.request.files);
    console.log('请求普通参数', ctx.request.body);
    try {
      const { avatar } = ctx.request.files;
      // 住：avatar.filepath 包含上传文件的临时路径

      const { userId } = ctx.request.body;

      const uploadDir = PROJECT_FOLDER + FILE_FOLDER_FILE + userId; // '/app/netpan/staticfile/' + userId
      console.log('uploadDir', uploadDir)

      // 查询是否有该文件的目录，无则创建
      await isFolderExits(uploadDir);

      // 获取上传文件路径的文件后缀
      const fileExt = path.extname(avatar.newFilename);
      console.log('fileExt', fileExt);

      // 移动文件到指定的存储目录
      const targetPath = path.join(uploadDir, `${userId}${fileExt}`);
      console.log('targetPath', targetPath)
      console.log('avatar.filepath', avatar.filepath)
      await fs.promises.rename(avatar.filepath, targetPath);

      ctx.body = {
        code: 200,
        success: true,
        message: '头像上传成功'
      };
      const userInfo = await ctx.redisUtils.get(`${REDIS_USER_FOLDER}:${userId}:userInfo`);
      console.log('userInfo', userInfo);

      if(userInfo['avatarPath'] && targetPath !== userInfo['avatarPath'] ) {
        console.log('userInfo[avatarPath]', userInfo['avatarPath']);
        fs.unlinkSync(userInfo['avatarPath']);
      }

      logger.info('开始更新数据库');
      userInfo['avatarPath'] = targetPath;
      userInfo['avatarType'] = fileExt;
      UserModel.update({ avatarPath: targetPath, avatarType: fileExt }, { where: { userId } });

      await redisUtils.set(`${REDIS_USER_FOLDER}:${userId}:userInfo`, userInfo, REDIS_KEY_EXPIRE_DAY);

    } catch (err) {
      return handleException(ctx, err, '上传文件失败');
    }

    logger.info('更新用户头像---结束');
  };

  // 更新密码
  async updatePassword(ctx) {
    try {
      const { password, userId } = ctx.request.body;
      // console.log('user', ctx.state.user);
      // const { user } = ctx.state.user;
      UserModel.update({ password }, { where: { userId } });
      ctx.body = {
        code: 200,
        success: true,
        message: '密码更新成功',
      }
    } catch (err) {
      return handleException(ctx, err, '密码更新失败');
    }
  };
};

module.exports = new UserController();
