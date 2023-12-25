const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');
const ffmpeg = require('ffmpeg');
const logger = require('./logger');
const redisUtils = require('./redisUtil');
const sequelize = require('../db/index'); // 引入 Sequelize 实例
const { UserModel, FileModel } = require('../models/index');
const { generateUUid } = require('./utils');
const { createCover4Video, createCover4Image } = require('./scaleFilter');
const {
  UPLOAD_TEMP_FOLDER,
  REDIS_USER_FOLDER,
  REDIS_KEY_EXPIRE_SEVEN_DAY,
  TS_NAME,
  M3U8_NAME,
  IMAGE_PNG_SUFFIX,
  LENGTH_150,
  USER_FILE_FOLDER,
} = require('../constants/constants');
const { fileTypeEnums, fileStatusEnum, uploadStatusEnum } = require('../enums/fileEnum');
const { dateTimePatternEnum } = require('../enums/dateTimePatterEnum');
const { responseCodeEnum } = require('../enums/enums');

// 将枚举对象 fileTypeEnums 转换为数组
const obj2Arr = Object.entries(fileTypeEnums);

/**
 * 根据文件扩展名获取对应的 MIME 类型
 * @param extname 文件扩展名
 * @returns {Promise<void>}
 */
const getMimeType = function (extname) {
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

/**
 * 判断目录文件是否存在，不存在则创建
 * @param folderPath 文件目录
 */
const isFolderExits = function(folderPath) {
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

/**
 * @description 将文件移动到另一个文件下，并重新命名
 * @param sourcePath 源文件路径
 * @param targetDirectory 目标文件目录
 * @param newFilename 新的文件名
 */
const moveFile = function(sourcePath, targetDirectory, newFilename) {
  // 检查原文件是否存在
  if (!fs.existsSync(sourcePath)) {
    logger.error('源文件不存在--moveFile');
    return;
  }

  // 检查目标路径是否存在, 不存在则创建
  isFolderExits(targetDirectory);

  const targetPath = path.join(targetDirectory, newFilename);

  // 关闭源文件的所有句柄
  fs.closeSync(fs.openSync(sourcePath, 'r'));

  // 移动并重命名文件
  fs.rename(sourcePath, targetPath, (err) => {
    if (err) {
      logger.error('移动文件失败', err);
    } else {
      logger.info('移动文件成功');
    }
  });
};

/**
 * @description 将文件复制到另一个文件中，文件名不会改变
 * @param source 源文件
 * @param destination 目的文件
 */
const copyFile = function(source, destination) {
  const sourcePath = path.resolve(source);
  const destinationPath = path.resolve(destination);

  // 检查源文件是否存在
  if (!fs.existsSync(sourcePath)) {
    logger.error('源文件不存在--copyFile');
    return;
  }

  // 创建目标目录（如果目录不存在）
  if (!fs.existsSync(destinationPath)) {
    fs.mkdirSync(destinationPath, { recursive: true });
  }

  // 拷贝文件
  const fileName = path.basename(sourcePath);
  const destinationFile = path.join(destinationPath, fileName);

  fs.copyFileSync(sourcePath, destinationFile);
  logger.info('文件拷贝成功');
};

/**
 * @description 删除文件夹下所有文件及文件夹
 */
const deleteFolder = function(folderPath) {
  console.log('删除文件的目录', folderPath);
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach(file => {
      const curPath = path.join(folderPath, file);

      // fs.lstatSync: 同步方法，用于获取指定路径所对应文件或目录的状态信息
      if (fs.lstatSync(curPath).isDirectory()) {
        // 如果是子文件夹，则递归调用自身
        deleteFolder(curPath);
      } else {
        // 如果是文件，则直接删除
        fs.unlinkSync(curPath);
      }
    });

    // 删除空文件夹
    // fs.rmdirSync(folderPath);
    // fs.rmdir(folderPath, { recursice: true });
  }
}

/**
 * 自动重命名
 */
const autoRename = async (filePid, userId, fileName, delFlag) => {
  const count = FileModel.count({ where: { filePid, userId, fileName, delFlag } });
  console.log('查询文件数量', count);
  if (count > 0) {
    fileName = rename(fileName);
  }
  return fileName;
};

/**
 * 根据后缀查询文件类型
 * @param fileSuffix 文件后缀
 */
const getFileTypeBySuffix = function(fileSuffix) {
  console.log('文件后缀类型', fileSuffix);
  for (let i = 0; i < obj2Arr.length; i++) {
    const [k, v] = obj2Arr[i];
    if (v.suffix.includes(fileSuffix)) {
      return v;
    }
  }
  return fileTypeEnums.OTHERS;
};

/**
 * 取文件名的名字，不包含后缀
 * @param fileName
 * @returns {*}
 */
const getFileNameNoSuffix = function(fileName) {
  console.log('取文件名，不包含后缀时--fileName', fileName);
  const index = fileName.lastIndexOf('.');
  if (index == -1) {
    return fileName;
  }
  return fileName.slice(0, index);
};

/**
 * 取文件后缀
 * @param fileName
 * @returns {*}
 */
const getFileSuffix = function(fileName) {
  console.log('取文件后缀--fileName', fileName);

  const index = fileName.lastIndexOf('.');
  if (index == -1) {
    return fileName;
  }
  return fileName.slice(index);
};

/**
 * 文件重命名
 * @param fileName
 * @returns {string}
 */
const rename = function(fileName) {
  const fileNameReal = getFileNameNoSuffix(fileName);
  const suffix = getFileSuffix(fileName);
  return fileNameReal + '_' + generateUUid() + suffix;
};

// 读取上传的临时文件目录大小
const getFileTempSize = function(userId, fileId) {
  const folderPath = UPLOAD_TEMP_FOLDER + userId + '/' + fileId;
  logger.info('当前临时文件目录', folderPath);
  let totalSize = 0;

  const files = fs.readdirSync(folderPath);
  files.forEach(file => {
    const filePath = path.join(folderPath, file);
    const stats = fs.statSync(filePath);

    if(stats.isFile) {
      totalSize += stats.size;
    } else if(stats.isDirectory) {
      totalSize += getFileTempSize(userId, fileId);
    }
  })

  return totalSize;
};

/**
 * 更新用户网盘信息
 */
const updateUserSpace = async function (userId, useSpace, totalSpace = 0) {
  const count = UserModel.update(
      { useSpace: sequelize.literal('useSpace' + Number(useSpace)) },
      {
        where: {
          userId,
          [sequelize.Op.and]: [
            sequelize.literal('useSpace + ' + useSpace + ' <= totalSpace'),
            sequelize.literal('totalSpace + ' + totalSpace + ' >= userSpace'),
          ],
        }
      }
  )
  logger.info('更新用户的网盘空间信息', count);
  // const count = updateUserSpaceServer(userId, useSpace, 0);
  if (count === 0) {
    throw new Error(responseCodeEnum.CODE_904.value);
  }
  // 更新redis的使用空间
  const userInfo = await redisUtils.get(`${REDIS_USER_FOLDER}${userId}:userInfo`);

  userInfo['useSpace'] = userInfo['useSpace'] + useSpace;

  await redisUtils.set(`${REDIS_USER_FOLDER}${userId}:userInfo`, userInfo, REDIS_KEY_EXPIRE_SEVEN_DAY);
};

/**
 * 合并分片文件
 * @param dirPath 文件目录
 * @param toFilePath
 * @param fileName
 * @param delSource 是否删除旧文件目录
 */
const union = async function(dirPath, toFilePath, fileName, delSource, delFolder) {
  console.log('合并文件--开始');
  console.log('合并文件-dirPath', dirPath);
  console.log('合并文件-toFilePath', toFilePath);
  console.log('合并文件-fileName', fileName);
  console.log('合并文件-delSource', delSource);
  if (!fs.existsSync(dirPath)) {
    throw new Error('文件目录不存在');
  }

  // 同步读取目录文件
  const fileList = fs.readdirSync(dirPath);
  console.log('同步读取源目录的文件夹下的文件', fileList);

  fileList.sort((a, b) => parseInt(a) - parseInt(b));
  console.log('排序后的文件', fileList);

  // 构造目标文件的完整路径
  const targetFile = path.join(toFilePath, fileName);
  console.log('需要合并的文件', targetFile);
  const writeFile = fs.createWriteStream(targetFile, { flags: 'a' });

  try {
    fileList.forEach((item, index) => {
      const filePath = path.join(dirPath, item);
      const readFile = fs.readFileSync(filePath);
      console.log(`合并第${index}片分片`, filePath);

      writeFile.write(readFile);
    })
    // 关闭可写流
    writeFile.end();
    // 删除临时目录下的文件
    if (delSource && fs.existsSync(delFolder)) {
      try {
        deleteFolder(delFolder);
      } catch (error) {
        logger.error('删除目录失败', error);
      }
    }
    console.log('合并文件--结束');
  } catch (e) {
    logger.error('合并文件失败：', fileName, e);
    throw new Error('合并分片:' , fileName , ' 出错了');
  }
};

/**
 * 视频切割
 */
const cutFileForVideo = function(fileId, videoFilePath) {
  // 创建同名切片目录
  const tsFolder = videoFilePath.substring(0, videoFilePath.lastIndexOf('.'));
  console.log('ts文件目录', tsFolder);
  if (fs.existsSync(tsFolder)) {
    fs.mkdirSync(tsFolder);
  }

  // ts文件路径
  const tsPath = tsFolder + '/' + TS_NAME;

  return new Promise((resolve, reject) => {
    try {
      const process = new ffmpeg(videoFilePath);

      process.then((video) => {
        video
            .outputOptions(['-hls_time 10', '-hls_list_size 0'])
            .output(path.join(tsPath, M3U8_NAME))
            .on('end', () => {
              resolve('视频转换为TS成功！');
            })
            .on('error', (error) => {
              reject('视频转换为TS失败：', error);
            })
            .run();
        // 删除 index.ts
        fs.unlink(tsPath, (err) => {
          if (err) {
            console.log('删除 ts 文件失败', err);
            return;
          }
          console.log('删除 ts 文件成功');
        })
      });
    } catch (error) {
      reject('视频转换为TS失败：', error);
    }
  });
};

/**
 * 文件转码
 * @param fileId 文件Id
 * @param user 用户信息
 */
const transferFile = async function(fileId, user) {
  let transferSuccess = true;
  let targetFilePath = null;

  let cover = null;
  let fileTypeEnum = null;
  const userId = user.userId;

  const fileInfo = await FileModel.findAll({ where: { fileId, userId } });
  // const fileInfo = await selectByFileIdAndUserId(fileId, userId);
  console.log('根据文件ID和用户ID查询文件信息', fileInfo);
  try {
    // TODO 这里的fileInfo可能是数组形式，后期改
    if (fileInfo == null || !fileStatusEnum.TRANSFER.value === fileInfo.status) {
      return;
    }

    // 临时目录
    const tempFolderName = UPLOAD_TEMP_FOLDER;
    // 当前用户上传的文件目录
    const curUserFolderName = userId + '/' + fileId;
    // 文件目录
    const fileFolder = tempFolderName + curUserFolderName + '/chunks';
    console.log('fileFolder', fileFolder);
    // 文件后缀
    const fileSuffix = getFileSuffix(fileInfo.file_name);
    console.log('dateTimePatternEnum.YYYYMM', dateTimePatternEnum.YYYYMM);
    const month = dayjs(fileInfo['createTime']).format(dateTimePatternEnum.YYYYMM);

    // 目标目录
    const targetFolderName = USER_FILE_FOLDER;
    // 目标文件目录
    const targetFolder = targetFolderName + month;
    console.log('目标文件目录', targetFolder);

    await isFolderExits(targetFolder);
    // 真实的文件名
    // const realFileName = curUserFolderName + fileSuffix;
    // 上传文件的文件名
    const originFileName = fileInfo['fileName'];
    // 最终文件存储目录
    // targetFilePath = targetFolder + '/' + originFileName;
    const targetFilePath = path.join(targetFolder, originFileName);
    console.log('targetFilePath', targetFilePath);

    // 合并文件
    // union(fileFolder, targetFilePath, fileInfo['file_name'], true);
    union(fileFolder, targetFolder, originFileName, true, curUserFolderName);


    // 视频文件切割
    fileTypeEnum = getFileTypeBySuffix(fileSuffix);
    console.log('文件类型', fileTypeEnum);
    // console.log('fileTypeEnums.VIDEO', fileTypeEnums.VIDEO);
    // console.log('fileTypeEnums.IMAGE', fileTypeEnums.IMAGE);
    if (fileTypeEnums.VIDEO.type === fileTypeEnum.type) {
      // 切割视频，转成 ts文件类型
      await cutFileForVideo(fileId, targetFilePath);
      // 视频生成缩略图
      cover = month + '/' + curUserFolderName + IMAGE_PNG_SUFFIX;
      const coverPath = targetFolderName + cover;
      console.log('视频coverPath', coverPath);
      createCover4Video(targetFilePath, LENGTH_150, coverPath);
    } else if(fileTypeEnums.IMAGE.type === fileTypeEnum.type) {
      // 生成图片缩略图
      cover = month + '/' + originFileName.replace('.', '_.');
      const coverPath = targetFolderName + cover;
      console.log('图片coverPath', coverPath);
      const created = createCover4Image(targetFilePath, LENGTH_150, coverPath);
      if (!created) {
        exports.copyFile(targetFilePath, coverPath);
      }
    }
  } catch (e) {
    logger.error('文件转码失败, 文件ID:', fileId, 'userId:', userId, e);
    transferSuccess = false;
  } finally {
    // const targetFile = fs.readdirSync(targetFilePath);
    // console.log('目标文件', targetFile);
    // const size = targetFile.size;
    // console.log('文件size', size);
    const updateInfo = {
      fileSize: fileInfo['fileSize'],
      fileCover: cover,
      status: transferSuccess ? fileStatusEnum.USING.code : fileStatusEnum.TRANSFER_FAIL.code
    };
    logger.info('更新文件info', updateInfo);
    await FileModel.update({
      fileSize: updateInfo, fileCover: cover, where: {
        fileId, userId, status: fileStatusEnum.TRANSFER.code
      }
    });
    // await updateFileStatusWithOldStatus(updateInfo, fileId, userId, fileStatusEnum.TRANSFER.value);

  }
};

module.exports = {
  getMimeType,
  isFolderExits,
  moveFile,
  copyFile,
  deleteFolder,
  autoRename,
  getFileTypeBySuffix,
  getFileNameNoSuffix,
  getFileSuffix,
  rename,
  getFileTempSize,
  updateUserSpace,
  union,
  cutFileForVideo,
  transferFile,
}
