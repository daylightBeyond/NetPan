const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * 根据文件扩展名获取对应的 MIME 类型
 * @param extname
 * @returns {Promise<void>}
 */
exports.getMimeType = function (extname) {
  switch (extname.toLowerCase()) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg';
    default:
      return 'application/octet-stream'; // 默认返回二进制流类型
  }
};

// 判断目录文件是否存在，不存在则创建
exports.isFolderExits = function(folderPath) {
  if(fs.existsSync(folderPath)) {
    logger.info('文件夹存在');
  } else {
    // 创建父级目录
    const parentDir = path.dirname(folderPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.mkdirSync(folderPath, { recursize: true });
    logger.info('文件夹不存在, 已创建成功');
  }
};