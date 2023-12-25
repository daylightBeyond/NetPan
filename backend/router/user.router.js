const Router = require('koa-router');
const {
  test,
  getCheckCode,
  sendEmailCode,
  register,
  login,
  resetPassword,
  getAvatar,
  getUseSpace,
  logout,
  updateUserAvatar,
  updatePassword
} = require('../controllers/user.controller');
const {
  userValidator,
  verifyUser,
  verifyEmail,
  authMiddleware
} = require('../middlewares/common.middleware');
const {
  verifyLogin,
  verifyEmailCode,
  verifyCaptcha,
  bcryptPassword
} = require('../middlewares/user.middleware');

const router = new Router({ prefix: '/api' });

router.get('/test', test);

// 注册账号时需要验证码
router.get('/getCheckCode', getCheckCode);

// 发送邮箱验证码
router.post('/sendEmailCode', verifyEmail, sendEmailCode);

/*
* 注册
* 1. 先判断用户名和密码是否为空
* 2. 判断用户名是否已经存在
* 3. 校验验证码
* 4. 校验密码是否符合8018位，并且由数字，字母，符号组成
* 4. 给密码加密
* 5. 往数据库中添加用户的账号和密码等信息
* */
router.post('/register', userValidator, verifyUser, verifyEmail, verifyEmailCode, verifyCaptcha, bcryptPassword, register);

/*
* 登录
* 1. 先判断用户名和密码是否为空
* 2. 判断是否存在该用户
* 3. 校验验证码
* 3. 根据密码解码配对，错误报错，正确返回token
* */
router.post('/login', userValidator, verifyLogin, verifyCaptcha, login);

// 重置密码 (不需要校验登录)
// TODO 优化重置密码接口，
// 需要校验邮箱和用户是否存在，不存在则提示改邮箱或账号不存在
router.post('/resetPassword', userValidator, bcryptPassword, resetPassword);

// 获取用户头像 (不需要校验登录)
router.post('/getAvatar', authMiddleware, getAvatar);

// 获取用户网盘空间
router.get('/getUseSpace', authMiddleware, getUseSpace);

// 退出登录 (不需要校验登录)
router.get('/logout', authMiddleware, logout);

// 更新头像
router.post('/updateUserAvatar', authMiddleware, updateUserAvatar);

// 更新密码
router.post('/updatePassword', authMiddleware, bcryptPassword, updatePassword);

module.exports = router;