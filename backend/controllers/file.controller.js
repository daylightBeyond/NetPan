const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const redisUtils = require('../utils/redisUtil');
const { UserModel, EmailModel, FileModel } = require('../models/index');
const handleException = require("../utils/handleException");
const {
  generateUUid
} = require('../utils/utils');
const {
  moveFile,
  autoRename,
  updateUserSpace,
  getFileTempSize,
  getFileSuffix,
  getFileTypeBySuffix,
  transferFile,
} = require('../utils/fileUtils')
const { responseCodeEnum } = require('../enums/enums');
const {
  fileCategoryEnums,
  fileDelFlagEnum,
  fileStatusEnum,
  uploadStatusEnum,
  fileFolderTypeEnum,
} = require('../enums/fileEnum');
const { dateTimePatternEnum } = require('../enums/dateTimePatterEnum');
const {
  UPLOAD_TEMP_FOLDER,
  REDIS_USER_FOLDER,
  USER_FILE_FOLDER,
} = require('../constants/constants');

class FileController {
  /**
   * 根据条件分页查询文件列表
   * category 分类
   * fileName 文件名
   * filePid 文件父id
   * pageNum 页码
   * pageSize 分页大小
   */
  async queryFile(ctx, next) {
    const { userId, category, fileName, filePid, pageNum, pageSize } = ctx.request.body;

    try {
      const fileCategoryArr = fileCategoryEnums.filter(x => x.key === category);
      let fileCategoryObj = {};
      if(fileCategoryArr.length) {
        fileCategoryObj = fileCategoryArr[0];
      }

      const params = {
        userId,
        fileCategory: fileCategoryObj.category,
        fileName,
        // filePid,
        delFlag: fileDelFlagEnum.USING.value,
        // sortField: 'last_update_time',
        // pageNum: parseInt(pageNum) || 1,
        // pageSize: parseInt(pageSize) || 10,
      }

      const offset = (pageNum - 1) * pageSize;

      const res = await FileModel.findAll({
        limit: pageSize,
        offset,
        order: [['last_update_time', 'desc']],
        where: params
      });
      logger.info(`查询文件${fileCategoryObj.category}列表信息:`, res);

      ctx.body = {
        code: 200,
        success: true,
        message: '请求成功',
        data: res
      }
    } catch (err) {
      return handleException(ctx, err, '查询文件列表失败');
    }
  };

  /**
   * 需要接受参数：
   * fileId
   * file文件 (必传)
   * fileName (必传)
   * filePid (必传)
   * fileMd5 (必传，前端处理的)
   * chunkIndex 分片索引
   * chunks 总公共多少片
   *
   * 上传文件逻辑：
   * 1. 接受第一片文件信息时，根据md5值查询数据库，如果查得到，说明是相同的文件，则是秒传
   * 1. 由于前端上传的文件到服务器后，服务器会自动给文件重命名，所以首先将文件移动到
   *   对应的userId下的chunks里面，并由分片索引命名文件名字
   * 2.
   * 3.
   * */
  async uploadFile(ctx) {
    logger.info('文件上传切片开始');
    // 设置存储文件分片的目录
    const chunkDir = UPLOAD_TEMP_FOLDER;
    logger.info('请求文件参数', ctx.request.files);
    logger.info('请求普通参数', ctx.request.body);
    const { file } = ctx.request.files;
    let { fileName, fileId, filePid, fileMd5, chunks, chunkIndex } = ctx.request.body;

    // 如果前端没传fileId
    if(fileId == 'null' || fileId == 'undefined') {
      // 随机生成 10 位数的 fileId
      fileId = generateUUid();
      logger.info('随机生成文件id', fileId);
    }

    // 当前日期
    const curDate = dayjs().format(dateTimePatternEnum.YYYY_MM_DD_HH_MM_SS);
    const user = ctx.state.user;
    const { userId } = user;
    logger.info('userId', userId);
    const useSpace = await ctx.redisUtils.get(`${REDIS_USER_FOLDER}${userId}:fileSizeSum`);
    logger.info('redis获取useSpace', useSpace);
    const totalSpace = await ctx.redisUtils.get(`${REDIS_USER_FOLDER}${userId}:userInfo`);
    logger.info('redis获取totalSpace', totalSpace);
    // 创建初始文件分片的目录
    logger.info('fileId', fileId);
    const fileChunkDir = path.join(chunkDir, userId, fileId, 'chunks');
    logger.info('文件临时分片的目录', fileChunkDir);

    // 临时文件目录
    let userFolderPath = null;
    // 上传成功标志
    let uploadSuccess = true;

    try {
      // 当文件上传的是第一个切片时，根据文件的md5值和文件的status判断是否已经上传过了
      if (chunkIndex == 0) {
        const dbFileList = await FileModel.findOne({ where: { fileMd5, status: fileStatusEnum.USING.code } });
        // 秒传
        if (dbFileList.length) {
          let dbFile = dbFileList[0];
          // 判断文件大小
          if (dbFile['file_size'] + useSpace > totalSpace) {
            ctx.app.emit(responseCodeEnum.CODE_904.value);
            return;
          }
          dbFile = {
            ...dbFile,
            fileId,
            filePid,
            userId,
            fileMd5,
            createTime: curDate,
            lastUpdateTime: curDate,
            status: fileStatusEnum.USING.code,
            delFlag: fileDelFlagEnum.USING.code,
          }
          // dbFile['file_id'] = fileId;
          // dbFile['file_pid'] = filePid;
          // dbFile['user_id'] = userId;
          // dbFile['create_time'] = curDate;
          // dbFile['lastUpdateTime'] = curDate;
          // dbFile['status'] = fileStatusEnum.USING.value;
          // dbFile['del_flag'] = fileDelFlagEnum.USING.value;
          // dbFile['file_md5'] = fileMd5;
          // 文件重命名
          fileName = await autoRename(filePid, userId, fileName, fileDelFlagEnum.USING.value);
          dbFile['file_name'] = fileName;
          // 插入这条数据
          await FileModel.create(dbFile);
          // await createFileInfo(dbFile);

          // 更新用户使用空间
          await updateUserSpace(userId, dbFile['file_size']);
        }

        /**
         * 由于前端上传的文件到服务器中名字变了
         * 需要将分片的文件按照 分片索引命名
         */
        await moveFile(file.filepath, fileChunkDir, chunkIndex);

        // 判断磁盘空间
        const curTempSize = getFileTempSize(userId, fileId);
        logger.info('当前临时文件大小', curTempSize, 'byte');
        if (file.size + curTempSize + useSpace > totalSpace) {
            throw new Error(responseCodeEnum.CODE_904.value);
        }

        // 暂存临时目录
        const tempFolderName = UPLOAD_TEMP_FOLDER;
        // 当前用户上传的文件目录
        const curUserFolderName = userId + '/' + fileId;

        userFolderPath = tempFolderName + curUserFolderName;
        logger.info('用户存储文件目录', userFolderPath);

        if (chunkIndex < chunks - 1) {
          await redisUtils.set(`${REDIS_USER_FOLDER}${userId}:${fileId}:tempFileSize`, curTempSize, REDIS_KEY_EXPIRE_THIRTY_MIN);
          ctx.body = {
            code: 200,
            success: true,
            data: {
              status: uploadStatusEnum.UPLOADING.value,
              fileId: fileId,
              uploadMsg: uploadStatusEnum.UPLOADING.desc
            }
          };
          return uploadStatusEnum.UPLOADING.desc;
        }

        // 最后一片上传完成，记录数据库，异步合并分片
        await redisUtils.set(`${REDIS_USER_FOLDER}${userId}:${fileId}:tempFileSize`, curTempSize, REDIS_KEY_EXPIRE_THIRTY_MIN);

        // 判断是否所有文件分片都已上传, 最后一个分片上传完成，记录数据库，异步合并分片
        const month = dayjs(new Date()).format(dateTimePatternEnum.YYYYMM);
        const fileSuffix = getFileSuffix(fileName);

        // 真实文件名
        const realFileName = curUserFolderName + fileSuffix;
        const fileTypeEnum = getFileTypeBySuffix(fileSuffix);
        console.log('根据后缀获取文件类型getFileTypeBySuffix', fileTypeEnum);
        // 自动重命名
        // fileName = autoRename(filePid, userId, fileName, fileDelFlagEnum.USING.value);

        // 合并分片
        console.log('文件类型', fileCategoryEnums[fileTypeEnum.category.toUpperCase()]);

        const insertFileInfo = {
          fileId,
          filePid,
          userId,
          fileMd5,
          fileSize: file.size,
          fileName,
          filePath: USER_FILE_FOLDER + month + '/' + fileName,
          createTime: curDate,
          lastUpdateTime: curDate,
          folderType: fileFolderTypeEnum.FILE.code,
          fileCategory: fileCategoryEnums[fileTypeEnum.category.toUpperCase()].category,
          fileType: fileTypeEnum.type,
          status: fileStatusEnum.TRANSFER.value,
          delFlag: fileDelFlagEnum.USING.value,
        };
        console.log('插入表数据', insertFileInfo);
        // 将这条文件信息插入表中
        await FileModel.create(insertFileInfo);
        // await createFileInfo(insertFileInfo);

        const totalSize = getFileTempSize(userId, fileId);
        console.log('获取总使用文件大小', totalSize);
        // 根据用户ID更新用户空间信息
        await updateUserSpace(userId, totalSize);

        // 文件转码
        await transferFile(fileId, user);

        ctx.body = {
          code: 200,
          success: true,
          data: {
            fileId: fileId,
            status: uploadStatusEnum.UPLOAD_FINISH.value,
            uploadMsg: uploadStatusEnum.UPLOAD_FINISH.desc
          }
        };
      }
    } catch (err) {
      return handleException(ctx, err, '文件上传异常');
    }
  }
};

module.exports = new FileController();
