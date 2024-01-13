import request from '@/utils/request.js';

// 获取用户文件列表
export const loadFileList = (param) => {
  return request({
    method: 'get',
    url: '/admin/loadFileList',
    param,
    header: {
      isToken: false,
    }
  });
};

// 删除用户文件
export const delFile = (param) => {
  return request({
    method: 'get',
    url: '/admin/delFile',
    param,
    header: {
      isToken: false,
    }
  });
};

// 创建下载链接
export const createDownloadUrl = (param) => {
  return request({
    method: 'get',
    url: '/admin/createDownloadUrl',
    param,
    header: {
      isToken: false,
    }
  });
};

// 下载文件
export const download = (param) => {
  return request({
    method: 'get',
    url: '/admin/download',
    param,
    header: {
      isToken: false,
    }
  });
};
