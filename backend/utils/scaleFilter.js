const fs = require('fs');
const sharp = require('sharp');
const logger = require('./logger');
const { LENGTH_150 } = require('../constants/constants');
const { exec } = require('child_process');

/**
 * 生成视频缩略图
 * @param sourceFile 源文件
 * @param width 缩略图宽
 * @param targetFile 保存的目标文件
 */

exports.createCover4Video = function(sourceFile, width, targetFile) {
  // 调用 ffmpeg 生成缩略图命令
  const command = `ffmpeg -i "${sourceFile}" -ss 00:00:05 -vf "scale=${width}:${width}" -vframes 1 "${targetFile}"`;

  return new Promise((resolve, reject) => {
    try {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          logger.error('生成缩略图异常', error.message);
          reject(error);
        } else {
          logger.log('缩略图已生成');
          resolve();
        }
      })
    } catch (error) {
      logger.error('生成缩略图失败', error);
    }
  })
}

/**
 * 生成图片缩略图，即压缩图片
 * @param sourceFile 源文件
 * @param width 缩略图宽
 * @param targetFile 保存的目标文件
 */
exports.createCover4Image = async function(sourceFile, width = LENGTH_150, targetFile) {
  logger.info('创建缩略图--sourceFile', sourceFile);
  logger.info('创建缩略图--targetFile', targetFile);
  logger.info('是否存在源文件', fs.existsSync(sourceFile));
  return new Promise(async (resolve, reject) => {
    await sharp(sourceFile)
      .resize(width, width) // 宽高都是 150
      .toFile(targetFile, (error, info) => {
        if (error) {
          logger.error('生成缩略图出错: ', error);
          resolve(false);
          return;
        }
        logger.info('缩略图已生成');
        resolve(true);
        return;
      })
  })
}
