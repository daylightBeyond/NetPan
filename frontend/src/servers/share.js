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

// 获取视频类文件预览
export const getVideoUrl = (param) => {
  return request({
    method: 'post',
    url: '/share/ts/getVideoInfo',
    data: param,
  });
};

// 非视频类文件的预览
export const getFileUrl = (param) => {
  return request({
    method: 'post',
    url: '/share/getFile',
    data: param,
  });
};

// 创建下载链接
export const createDownloadUrl = (param) => {
  return request({
    method: 'get',
    url: '/share/createDownloadUrl',
    param,
  });
};

// 下载文件
export const download = (param) => {
  return request({
    method: 'get',
    url: '/share/download',
    param,
    header: {
      isToken: false,
    }
  });
};
