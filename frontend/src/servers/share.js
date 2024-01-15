import request from '@/utils/request.js';

// 分享文件
export const shareFile = (param) => {
  return request({
    method: 'post',
    url: '/share/shareFile',
    data: param,
  });
};

export const getShareFolderInfo = (param) => {
  return request({
    method: 'post',
    url: '/share/getFolderInfo',
    data: param,
  });
};
