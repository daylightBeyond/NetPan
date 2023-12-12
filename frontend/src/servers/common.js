import request from '@/utils/request.js';

// 获取注册验证码
export const getCheckCode = (param) => {
  return request({
    method: 'get',
    url: '/getCheckCode?',
    param,
    header: {
      isToken: false,
    }
  });
};

// 发送邮箱验证码
export const sendEmailCode = (param) => {
  return request({
    method: 'post',
    url: '/sendEmailCode',
    data: param,
    header: {
      isToken: false,
    }
  });
};

// 注册
export const register = (param) => {
  return request({
    method: 'post',
    url: '/register',
    data: param,
    header: {
      isToken: false,
    }
  });
};

// 登录
export const login = (param) => {
  return request({
    method: 'post',
    url: '/login',
    data: param,
    header: {
      isToken: false,
    }
  });
};

// 重置密码
export const resetPassword = (param) => {
  return request({
    method: 'post',
    url: '/resetPassword',
    data: param,
  });
};

// 获取用户头像
export const getAvatar = (param) => {
  return request({
    method: 'post',
    url: '/getAvatar',
    data: param,
    responseType: 'blob'
  });
};

// 更新用户头像
export const updateUserAvatar = (param) => {
  return request({
    method: 'post',
    url: '/updateUserAvatar',
    data: param,
    showLoading: true,
    headers: {
      'Content-Type': 'multer/form-data'
    }
  });
};