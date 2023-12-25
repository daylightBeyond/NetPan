// ---------------------------- 用户列表 ---------------------------------

// 用户状态枚举
exports.userStatusEnum = {
  DISABLE: 0, // 禁用
  ENABLE: 1, // 启用
};

exports.responseCodeEnum = {
  CODE_200: { key: 200, value: '请求成功' },
  CODE_404: { key: 404, value: '请求地址不存在' },
  CODE_600: { key: 600, value:  '请求参数错误' },
  CODE_601: { key: 601, value: '薪资已经存在' },
  CODE_500: { key: 500, value: '服务器返回错误，请联系管理员' },
  CODE_901: { key: 901, value: '登录超时，请重新登录' },
  CODE_904: { key: 904, value: '网盘空间不足, 请减小上传文件大小或扩容' },
};
