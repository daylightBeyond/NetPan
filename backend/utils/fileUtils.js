const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const dayjs = require('dayjs');;
const logger = require('./logger');
const redisUtils = require('./redisUtil');
const { UserModel, FileModel } = require('../models/index');
const { generateUUid } = require('./utils');
const { createCover4Video, createCover4Image } = require('./scaleFilter');
const {
  UPLOAD_TEMP_FOLDER,
  REDIS_USER_FOLDER,
  REDIS_KEY_EXPIRE_SEVEN_DAY,
  REDIS_KEY_EXPIRE_SIX_MIN,
  REDIS_KEY_EXPIRE_THIRTY_MIN,
  TS_NAME, M3U8_NAME,
  IMAGE_PNG_SUFFIX,
  LENGTH_6, LENGTH_150,
  USER_FILE_FOLDER,
  REDIS_TEMP_FOLDER, REDIS_KEY_EXPIRE_DAY,
  REDIS_KEY_DOWNLOAD,
} = require('../constants/constants');
const { fileTypeEnums, fileStatusEnum, uploadStatusEnum, fileFolderTypeEnum, fileDelFlagEnum} = require('../enums/fileEnum');
const { dateTimePatternEnum } = require('../enums/dateTimePatterEnum');
const { responseCodeEnum } = require('../enums/enums');
const {resolve} = require("@babel/core/lib/vendor/import-meta-resolve");

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
    logger.info('文件夹不存在, 已创建成功', folderPath);
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
    logger.info('源文件不存在--moveFile');
    return;
  }

  // 检查目标路径是否存在, 不存在则创建
  isFolderExits(targetDirectory);

  const targetPath = path.join(targetDirectory, newFilename);
  logger.info('移动临时文件到目标路径', targetPath);

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
  logger.info('拷贝文件--source', source);
  logger.info('拷贝文件--destination', destination);
  const sourcePath = path.resolve(source);
  const destinationPath = path.resolve(destination);

  // 检查源文件是否存在
  if (!fs.existsSync(sourcePath)) {
    logger.info('源文件不存在--copyFile');
    return;
  }

  // 创建目标目录（如果目录不存在）
  if (!fs.existsSync(destinationPath)) {
    fs.mkdirSync(destinationPath, { recursive: true });
  }

  // 拷贝文件
  const fileName = path.basename(sourcePath);
  const destinationFile = path.join(destinationPath, fileName);
  logger.info('拷贝文件路径', destinationFile);
  fs.copyFileSync(sourcePath, destinationFile);
  logger.info('文件拷贝成功');
};

/**
 * @description 删除文件夹下所有文件及文件夹
 */
const deleteFolder = function(folderPath) {
  logger.info('删除文件的目录', folderPath);
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
    fs.rmdirSync(folderPath);
  }
}

/**
 * 自动重命名
 */
const autoRename = async (filePid, userId, fileName, delFlag) => {
  const count = await FileModel.count({ where: { filePid, userId, fileName, delFlag } });
  logger.info('查询文件数量', count);
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
  const tolowerSuffix = fileSuffix.toLowerCase();
  logger.info('文件后缀类型', tolowerSuffix);
  for (let i = 0; i < obj2Arr.length; i++) {
    const [k, v] = obj2Arr[i];
    if (v.suffix.includes(tolowerSuffix)) {
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
  logger.info('取文件名，不包含后缀时--fileName', fileName);
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
  logger.info('取文件后缀--fileName', fileName);

  const index = fileName.lastIndexOf('.');
  if (index == -1) {
    return '';
  }
  logger.info('截取文件后缀开始的索引位置', index);
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
  return fileNameReal + '_' + generateUUid(LENGTH_6) + suffix;
};

/**
 * 暂存临时文件到redis
 * @param userId
 * @param fileId
 * @param fileSize
 */
const saveFileTempSize = async function (userId, fileId, fileSize) {
  const currentSize = await getFileTempSize(userId, fileId);
  logger.info('从redis获取临时文件大小', currentSize);
  const saveTempRedisKey = `${REDIS_TEMP_FOLDER}:${userId}:${fileId}:tempFileSize`;
  logger.info('暂存redis文件大小的key', saveTempRedisKey);
  await redisUtils.set(saveTempRedisKey, currentSize + fileSize, REDIS_KEY_EXPIRE_THIRTY_MIN);
};

/**
 * 获取临时文件大小
 * @param userId
 * @param fileId
 * @returns {Promise}
 */
const getFileTempSize = async function(userId, fileId) {
  return new Promise(async (resolve) => {
    const currentTempRedisKey = `${REDIS_TEMP_FOLDER}:${userId}:${fileId}:tempFileSize`;
    const currentSize = await getFileSizeFromRedis(currentTempRedisKey);
    resolve(currentSize);
  });



  // const folderPath = UPLOAD_TEMP_FOLDER + userId + '/' + fileId;
  // logger.info('当前临时文件目录', folderPath);
  // let totalSize = 0;
  //
  // const files = fs.readdirSync(folderPath);
  // logger.info('读取临时文件', files);
  // files.forEach(file => {
  //   const filePath = path.join(folderPath, file);
  //   logger.info('临时文件路径信息', filePath);
  //   const stats = fs.statSync(filePath);
  //   logger.info('获取临时文件信息stats', stats);
  //   if(stats.isFile) {
  //     totalSize += stats.size;
  //   } else if(stats.isDirectory) {
  //     totalSize += getFileTempSize(userId, fileId);
  //   }
  // })
  //
  // return totalSize;
};

/**
 * 从redis中获取文件大小
 * @param key redis 键
 * @returns {Promise}
 */
const getFileSizeFromRedis = function(key) {
  logger.info('getFileSizeFromRedis--key', key);
  return new Promise(async (resolve) => {
    const sizeObj = await redisUtils.get(key);
    logger.info('从redis中获取临时文件大小', sizeObj);
    if (sizeObj == null) {
      return resolve(0); // 只是用resolve后面的代码还是会执行
    }
    if (sizeObj instanceof Number) {
      return resolve(sizeObj);
    }
    return resolve(0);
  })
};

/**
 * 更新用户网盘信息
 */
const updateUserSpace = async function (userId, useSpace, totalSpace = 0) {
  logger.info('更新用户网盘信息参数', userId, useSpace);
  const user = await UserModel.findByPk(userId);
  logger.info('查询用户网盘信息', user);
  const { useSpace: dbUseSpace, totalSpace: dbTotalSpace } = user;
  let updateSpace = null;
  if (dbUseSpace + useSpace <= dbTotalSpace && dbTotalSpace + totalSpace >= dbUseSpace) {
    updateSpace = await UserModel.update(
      { useSpace: dbUseSpace + useSpace },
      { where: { userId } }
    )
  }
  logger.info('更新用户的网盘空间信息', updateSpace);
  if (updateSpace == null) {
    throw new Error(responseCodeEnum.CODE_904.value);
  }
  // 更新redis的使用空间
  const userInfo = await redisUtils.get(`${REDIS_USER_FOLDER}:${userId}:userInfo`);

  userInfo['useSpace'] = userInfo['useSpace'] + useSpace;

  await redisUtils.set(`${REDIS_USER_FOLDER}:${userId}:userInfo`, userInfo, REDIS_KEY_EXPIRE_DAY);
  await redisUtils.set(`${REDIS_USER_FOLDER}:${userId}:fileSizeSum`, userInfo['useSpace'], REDIS_KEY_EXPIRE_DAY);
};

/**
 * 合并分片文件
 * @param dirPath 文件目录
 * @param toFilePath
 * @param fileName
 * @param delSource 是否删除旧文件目录
 */
const union = async function(dirPath, toFilePath, fileName, delSource, delFolder) {
  logger.info('合并文件--开始');
  logger.info('合并文件-dirPath', dirPath);
  logger.info('合并文件-toFilePath', toFilePath);
  logger.info('合并文件-fileName', fileName);
  logger.info('合并文件-delSource', delSource);
  logger.info('合并文件-delFolder', delFolder);
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(dirPath)) {
        throw new Error('文件目录不存在');
    }

    // 同步读取目录文件
    const fileList = fs.readdirSync(dirPath);
    logger.info('同步读取源目录的文件夹下的文件', fileList);

    fileList.sort((a, b) => parseInt(a) - parseInt(b));
    logger.info('排序后的文件', fileList);

    // 构造目标文件的完整路径
    const targetFile = path.join(toFilePath, fileName);
    logger.info('需要合并的文件的最终路径', targetFile);
    const writeFile = fs.createWriteStream(targetFile, { flags: 'a' });

    try {
      fileList.forEach((item, index) => {
        const filePath = path.join(dirPath, item);
        const readFile = fs.readFileSync(filePath);
        logger.info(`合并第${index}片分片`, filePath);

        writeFile.write(readFile);
      })
      // 关闭可写流
      writeFile.end();
      // 监听writeFile的'finish'事件，表示所有数据已成功写出到磁盘
      writeFile.on('finish', () => {
        // 删除临时目录下的文件
        if (delSource && fs.existsSync(delFolder)) {
          try {
              deleteFolder(delFolder);
          } catch (error) {
              logger.error('删除目录失败', error);
          }
        }
        logger.info('合并文件--结束');
        resolve(true);
      })
    } catch (e) {
      logger.error('合并文件失败：', fileName, e);
      throw new Error('合并分片:' , fileName , ' 出错了');
      reject(false);
    }
  })
};

/**
 * 视频切割成ts文件
 */
const cutFileForVideo = function(fileId, videoFilePath) {
  // 创建同名切片目录
  const tsFolder = videoFilePath.substring(0, videoFilePath.lastIndexOf('.'));
  logger.info('ts文件目录', tsFolder);
  if (!fs.existsSync(tsFolder)) {
    logger.info('ts文件目录不存在');
    fs.mkdirSync(tsFolder);
    logger.info('ts视频文件目录创建成功');
  }

  // ffmpeg切割并转换为TS的命令
  const cmd = `ffmpeg -y -i "${videoFilePath}" -c:v copy -c:a copy -bsf:v h264_mp4toannexb -hls_time 15 -hls_list_size 0 -hls_segment_filename "${tsFolder}/${fileId}"_%03d.ts -f hls "${tsFolder}/${M3U8_NAME}"`;

  return new Promise((resolve, reject) => {
    try {
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          logger.error('执行ffmpeg出错', error);
          reject(error);
        } else {
          logger.info('视频切割成功');
          resolve();
        }
      })
    } catch (error) {
      reject('视频切割失败：', error);
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

  const [fileInfo] = await FileModel.findAll({ where: { fileId, userId } });
  logger.info('根据文件ID和用户ID查询文件信息', fileInfo);
  try {
    if (fileInfo == null || !fileStatusEnum.TRANSFER.value === fileInfo.status) {
      return;
    }

    // 临时目录
    const tempFolderName = UPLOAD_TEMP_FOLDER;
    // 当前用户上传的文件目录
    const curUserFolderName = userId + '/' + fileId;
    // 文件目录
    const fileFolder = tempFolderName + curUserFolderName + '/chunks';
    // 需要删除的临时文件目录
    const delFolderPath = tempFolderName + userId;
    logger.info('fileFolder', fileFolder);
    // 文件后缀
    const fileSuffix = getFileSuffix(fileInfo.fileName);
    logger.info('dateTimePatternEnum.YYYYMM', dateTimePatternEnum.YYYYMM);
    const month = dayjs(fileInfo['createTime']).format(dateTimePatternEnum.YYYYMM);

    // 目标目录
    const targetFolderName = USER_FILE_FOLDER;
    // 目标文件目录
    const targetFolder = targetFolderName + month;
    logger.info('创建目标文件目录--targetFolder', targetFolder);

    await isFolderExits(targetFolder);
    // 上传文件的文件名
    const originFileName = fileInfo['fileName'];
    // 最终文件存储目录
    targetFilePath = targetFolder + '/' + originFileName;
    logger.info('targetFilePath', targetFilePath);

    // 合并文件
    await union(fileFolder, targetFolder, originFileName, true, delFolderPath);

    // 获取文件类型
    fileTypeEnum = getFileTypeBySuffix(fileSuffix);
    logger.info('文件类型', fileTypeEnum);
    // logger.info('fileTypeEnums.VIDEO', fileTypeEnums.VIDEO);
    // logger.info('fileTypeEnums.IMAGE', fileTypeEnums.IMAGE);

    // 视频文件切割
    if (fileTypeEnums.VIDEO.type === fileTypeEnum.type) {
      // 切割视频，转成 ts文件类型
      await cutFileForVideo(fileId, targetFilePath);
      // 获取文件名，不要后缀，因为是要生成图片类型，跟视频类型不一样
      const coverName = getFileNameNoSuffix(originFileName);
      // 视频生成缩略图
      cover = month + '/' + coverName + '_' + IMAGE_PNG_SUFFIX;
      const coverPath = targetFolderName + cover;
      logger.info('视频coverPath', coverPath);
      await createCover4Video(targetFilePath, LENGTH_150, coverPath);
    } else if(fileTypeEnums.IMAGE.type === fileTypeEnum.type) {
      // 生成图片缩略图
      cover = month + '/' + originFileName.replace('.', '_.');
      const coverPath = targetFolderName + cover;
      logger.info('图片coverPath', coverPath);
      const created = await createCover4Image(targetFilePath, LENGTH_150, coverPath);
      logger.info('是否创建缩略图', created);
      // 如果图片文件太小生成不了缩略图，就直接将该文件复制一份，重命名
      if (!created) {
        // TODO 现在的复制文件会将该文件复制到文件命名的文件夹下，直接复制到同级别的路径下即可
        copyFile(targetFilePath, coverPath);
      }
    }
  } catch (e) {
    logger.error('文件转码失败, 文件ID:', fileId, 'userId:', userId, e);
    transferSuccess = false;
  } finally {
    const updateInfo = {
      fileSize: fileInfo['fileSize'],
      fileCover: cover,
      status: transferSuccess ? fileStatusEnum.USING.code : fileStatusEnum.TRANSFER_FAIL.code
    };
    logger.info('更新文件info', updateInfo);
    await FileModel.update(updateInfo,
      { where: { fileId, userId, status: fileStatusEnum.TRANSFER.code } }
    );
  }
};

/**
 * 校验文件名
 * @param filePid
 * @param userId
 * @param fileName
 * @param folderType 文件类型 0:文件 1:目录
 * @param ctx 上下文
 * @returns {Promise<void>}
 */
const checkFileName = async function(filePid, userId, fileName, folderType, ctx = null) {
  const whereCondition = {
    folderType,
    fileName,
    filePid,
    userId,
    delFlag: fileDelFlagEnum.USING.code
  };

  const count = await FileModel.count({ where: whereCondition });
  logger.info('查询是否有重复文件名', count);
  if (count > 0) {
    if (ctx) {
      ctx.throw(409, '此目录下已经存在同名文件，请修改名称');
      return;
    }
    throw new Error('此目录下已经存在同名文件，请修改名称')
  }
};

/**
 * redis存储下载对象信息
 * @param code 下载码
 * @param downloadFileObj 存储到redis的下载文件对象信息
 * @returns {Promise<void>}
 */
const saveDownloadCode = async function(code, downloadFileObj) {
  await redisUtils.set(`${REDIS_KEY_DOWNLOAD}:${code}`, downloadFileObj, REDIS_KEY_EXPIRE_SIX_MIN)
};

/**
 * 从redis中获取需要下载的文件信息
 * @param code
 * @returns {Promise<void>}
 */
const getDownloadCode = async function(code) {
  const fileObj = await redisUtils.get(`${REDIS_KEY_DOWNLOAD}:${code}`);
  return fileObj;
};

/**
 * 递归查询文件夹下的所有文件夹id，注意是文件夹，也是文件的pid
 * @param fileIdList
 * @param userId
 * @param fileId
 * @param delFlag
 * @returns {Promise<void>}
 */
const findAllSubFolderFileList = async function(fileIdList, userId, fileId, delFlag) {
  fileIdList.push(fileId);
  const query = {
    userId,
    filePid: fileId,
    delFlag,
    folderType: fileFolderTypeEnum.FOLDER.code
  };
  const fileInfoList = await FileModel.findAll({where: query});
  logger.info('根据文件id查询所有子文件', fileInfoList);
  for (let fileInfo of fileInfoList) {
      await findAllSubFolderFileList(fileIdList, userId, fileInfo.fileId, delFlag);
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
  saveFileTempSize,
  getFileTempSize,
  updateUserSpace,
  union,
  cutFileForVideo,
  transferFile,
  checkFileName,
  saveDownloadCode,
  getDownloadCode,
  findAllSubFolderFileList,
}
