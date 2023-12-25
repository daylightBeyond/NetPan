// const sharp = require('sharp');
const logger = require('./logger');
const { LENGTH_150 } = require('../constants/constants');
const { exec } = require('child_process');

/**
 * 生成视频缩略图
 * @param sourceFile 源文件
 * @param width 缩略图宽
 * @param targetFile 保存的目标文件
 */

exports.createCover4Video = function createCover4Video(sourceFile, width, targetFile) {
    // 调用 ffmpeg 生成缩略图命令
    const command = `ffmpeg -i ${sourceFile} -ss 00:00:05 -vf 'scale=${width}:${width}' -vframes 1 ${targetFile}`;

    try {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                logger.error('生成缩略图异常', error.message);
                return;
            }
            if (stderr) {
                logger.error('生成缩略图异常', stderr);
                return;
            }
            logger.log('缩略图已生成');
        })
    } catch (error) {
        logger.error('生成缩略图失败', error);
    }
}

/**
 * 生成图片缩略图，即压缩图片
 * @param sourceFile 源文件
 * @param width 缩略图宽
 * @param targetFile 保存的目标文件
 */
exports.createCover4Image = function createCover4Image(sourceFile, width, targetFile) {
    console.log('adsadsads')
    // sharp(sourceFile)
    // .resize(width, width) // 宽高都是 150
    // .toFile(targetFile, (error, info) => {
    //   if (error) {
    //     logger.error('生成缩略图出错: ', error.message);
    //     return false;
    //   }
    //   logger.info('缩略图已生成');
    //   return true;
    // })
}
