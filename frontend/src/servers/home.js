import request from '@/utils/request.js';

export const testUrl = (param) => {
  return request({
    method: 'get',
    url: '/test',
    param,
  });
};

// 获取注册验证码
// 更新用户头像
export const updateUserAvatar = (param) => {
  return request({
    method: 'post',
    url: '/updateUserAvatar',
    data: param,
    headers: {
      'Content-Type': 'multer/form-data'
    }
  });
};

// 更新密码
export const updatePassword = (param) => {
  return request({
    method: 'post',
    url: '/updatePassword',
    data: param,
  });
};

// 退出
export const logout = (param) => {
  return request({
    method: 'get',
    url: '/logout',
    param,
  });
};

export const getUseSpace = (param) => {
  return request({
    method: 'get',
    url: '/getUseSpace',
    param,
  });
};

// 获取文件列表
export const queryFile = (param, callback) => {
  return request({
    method: 'post',
    url: '/file/queryFile',
    data: param,
    ...callback
  });
};

// 文件分片上传
export const uploadFile = (param, callback) => {
  const { errorCallback, uploadProgressCallback } = callback || {};
  return request({
    method: 'post',
    url: '/file/uploadFile',
    data: param,
    headers: {
      'Content-Type': 'multer/form-data'
    },
    onUploadProgress: (event) => {
      if (uploadProgressCallback) {
        uploadProgressCallback(event);
      }
    },
    errorCallback,
  });
};

// 获取文件封面
export const getImage = (param) => {
  return request({
    method: 'get',
    url: '/file/getImage/' + param,
    responseType: 'blob'
  });
};

// 新建目录
export const createFolder = (param) => {
  return request({
    method: 'post',
    url: '/file/newFolder',
    data: param,
  });
};

// 文件重命名
export const rename = (param) => {
  return request({
    method: 'post',
    url: '/file/rename',
    data: param,
  });
};

// 获取当前文件目录
export const getFileFolderInfo = (param) => {
  return request({
    method: 'post',
    url: '/file/getFolderInfo',
    data: param,
  });
};

// 获取所有目录
export const loadAllFolder = (param) => {
  return request({
    method: 'post',
    url: '/file/loadAllFolder',
    data: param,
  });
};

// 修改文件目录，移动文件
export const changeFileFolder = (param) => {
  return request({
    method: 'post',
    url: '/file/changeFileFolder',
    data: param,
  });
};

// 删除文件
export const deleteFile = (param) => {
  return request({
    method: 'post',
    url: '/file/delFile',
    data: param,
  });
};

// 获取视频类文件预览
export const getVideoUrl = (param) => {
  return request({
    method: 'get',
    url: '/file/ts/getVideoInfo/' + param,
  });
};

// 非视频类文件的预览
export const getFileUrl = (param) => {
  return request({
    method: 'get',
    url: '/file/getFile/' + param,
  });
};

// 创建下载链接
export const createDownloadUrl = (param) => {
  return request({
    method: 'get',
    url: '/file/createDownLoadUrl/' + param,
  });
};

// 下载文件
export const downloadFile = (param) => {
  return request({
    method: 'get',
    url: '/file/download/' + param,
  });
};
