import request from '@/utils/request.js';

// 获取用户文件列表
export const loadFileList = (param) => {
  return request({
    method: 'get',
    url: '/admin/loadFileList',
    param,
  });
};

// 删除用户文件
export const delFile = (param) => {
  return request({
    method: 'get',
    url: '/admin/delFile',
    param,
  });
};

// 创建下载链接
export const createDownloadUrl = (param) => {
  return request({
    method: 'get',
    url: '/admin/createDownloadUrl',
    param,
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

// 获取文件信息
export const getAdminFolderInfo = (param) => {
  return request({
    method: 'get',
    url: '/admin/getFolderInfo',
    param,
  });
};
