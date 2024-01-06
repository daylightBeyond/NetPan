import request from '@/utils/request.js';

// 获取注册验证码
// 更新用户头像
export const shareFile = (param) => {
  return request({
    method: 'post',
    url: '/share/shareFile',
    data: param,
  });
};
