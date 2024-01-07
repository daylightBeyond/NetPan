const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const redisUtils = require('../utils/redisUtil');
const { UserModel, EmailModel, FileModel } = require('../models/index');
const handleException = require("../utils/handleException");
const {
  generateUUid,
  isEmpty,
  pathIsOk
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
  REDIS_KEY_EXPIRE_THIRTY_MIN
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
    logger.info('开始查询文件列表');
    logger.info('查询文件列表请求参数', ctx.request.body);
    const { category, fileName, pageNum, pageSize, filePid } = ctx.request.body;
    const user = ctx.state.user;
    const { userId } = user;
    try {
      const fileCategory = fileCategoryEnums[category.toUpperCase()]; // 因为前端传的category是小写
      logger.info('fileCategory', fileCategory);

      const params = {
        userId,
        delFlag: fileDelFlagEnum.USING.code,
      };
      if (category && category != 'all') {
        params.fileCategory = fileCategory.category;
      }
      if (fileName) {
        params.fileName = fileName;
      }
      if (filePid) {
        params.filePid = filePid;
      }

      const offset = (pageNum - 1) * pageSize;

      const total = await FileModel.count({ where: params });

      const res = await FileModel.findAll({
        limit: pageSize,
        offset,
        order: [['lastUpdateTime', 'desc']],
        subQuery: false,
        where: params
      });
      logger.info(`查询文件列表信息:`, res);
      const data = {
        list: res,
        pageNum,
        pageSize,
        total
      };

      ctx.body = {
        code: 200,
        success: true,
        message: '请求成功',
        data
      };
      logger.info('结束查询文件列表');
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

    // 如果前端没传fileId 这里跟前端配合，前端的 fileId字段可能是 'undefined'
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
    const useSpace = await ctx.redisUtils.get(`${REDIS_USER_FOLDER}:${userId}:fileSizeSum`);
    logger.info('redis获取useSpace', useSpace);
    const totalSpace = await ctx.redisUtils.get(`${REDIS_USER_FOLDER}:${userId}:userInfo`);
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
        const dbFileList = await FileModel.findAll({where: {fileMd5, status: fileStatusEnum.USING.code}});
        logger.info('根据fileMd5和status查询是否已经上传过该文件', dbFileList);
        // 秒传
        if (dbFileList.length) {
          let dbFile = dbFileList[0];
          // return;
          logger.info('dbFile[fileSize]', dbFile['fileSize']);
          logger.info('dbFile.fileSize', dbFile.fileSize);
          // 判断文件大小
          if (dbFile['fileSize'] + useSpace > totalSpace) {
            ctx.app.emit(responseCodeEnum.CODE_904.value);
            return;
          }
          // 文件重命名
          fileName = await autoRename(filePid, userId, fileName, fileDelFlagEnum.USING.code);
          logger.info('文件新名字', fileName);
          dbFile = {
            // get({ plain: true }) 方法会将 Sequelize 实例转换为普通的 JavaScript 对象，
            // 这样就不会包含 dataValues 和 _previousDataValues 这些 Sequelize 特有的属性了
            ...dbFile.get({ plain: true }),
            fileId,
            filePid,
            userId,
            fileMd5,
            fileName,
            createTime: curDate,
            lastUpdateTime: curDate,
            status: fileStatusEnum.USING.code,
            delFlag: fileDelFlagEnum.USING.code,
          };
          logger.info('秒传插入表的数据', dbFile);
          // 插入秒传的重复数据
          await FileModel.create(dbFile);

          // 更新用户使用空间
          await updateUserSpace(userId, dbFile['fileSize']);
          ctx.body = {
            code: 200,
            success: true,
            data: {
              fileId: fileId,
              status: uploadStatusEnum.UPLOAD_FINISH.value,
              uploadMsg: uploadStatusEnum.UPLOAD_FINISH.desc
            }
          };
          fs.unlinkSync(file.filepath); // 异步删除临时文件
          return;
        }
      }
      /*
       * 由于前端上传的文件到服务器中名字变了
       * 需要将分片的文件按照 分片索引命名
       */
      await moveFile(file.filepath, fileChunkDir, chunkIndex);

      // 判断磁盘空间
      const curTempSize = getFileTempSize(userId, fileId);
      logger.info('当前临时文件大小', curTempSize, 'byte');
      // if (file.size + curTempSize + useSpace > totalSpace) {
      //     throw new Error(responseCodeEnum.CODE_904.value);
      // }

      // 暂存临时目录
      const tempFolderName = UPLOAD_TEMP_FOLDER;
      // 当前用户上传的文件目录
      const curUserFolderName = userId + '/' + fileId;

      userFolderPath = tempFolderName + curUserFolderName;
      logger.info('用户存储文件目录', userFolderPath);

      // 分成多片时，处于中间的分片
      if (chunkIndex < chunks - 1) {
        await redisUtils.set(`${REDIS_USER_FOLDER}:${userId}:${fileId}:tempFileSize`, curTempSize, REDIS_KEY_EXPIRE_THIRTY_MIN);
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
      await redisUtils.set(`${REDIS_USER_FOLDER}:${userId}:${fileId}:tempFileSize`, curTempSize, REDIS_KEY_EXPIRE_THIRTY_MIN);

      // 判断是否所有文件分片都已上传, 最后一个分片上传完成，记录数据库，异步合并分片
      const month = dayjs(new Date()).format(dateTimePatternEnum.YYYYMM);
      // 根据文件名获取文件后缀再转小写
      const fileSuffix = getFileSuffix(fileName).toLowerCase();
      logger.info('根据文件名获取文件后缀', fileSuffix);

      // 真实文件名
      const realFileName = curUserFolderName + fileSuffix;
      const fileTypeEnum = getFileTypeBySuffix(fileSuffix);
      logger.info('根据后缀获取文件类型getFileTypeBySuffix', fileTypeEnum);
      // 自动重命名
      // fileName = autoRename(filePid, userId, fileName, fileDelFlagEnum.USING.value);

      // 合并分片
      logger.info('文件类型', fileCategoryEnums[fileTypeEnum.category.toUpperCase()]);

      const insertFileInfo = {
        fileId,
        filePid,
        userId,
        fileMd5,
        fileSize: file.size,
        fileName,
        filePath: month + '/' + fileName,
        createTime: curDate,
        lastUpdateTime: curDate,
        folderType: fileFolderTypeEnum.FILE.code,
        fileCategory: fileCategoryEnums[fileTypeEnum.category.toUpperCase()].category,
        fileType: fileTypeEnum.type,
        status: fileStatusEnum.TRANSFER.code,
        delFlag: fileDelFlagEnum.USING.code,
      };
      logger.info('插入表数据', insertFileInfo);
      // 将这条文件信息插入表中
      await FileModel.create(insertFileInfo);

      const totalSize = getFileTempSize(userId, fileId);
      logger.info('获取总使用文件大小', totalSize);
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

    } catch (err) {
      return handleException(ctx, err, '文件上传异常');
    }
  };

  /**
   * 获取文件封面
   * @param ctx
   * @returns {Promise<void>}
   */
  async getImage(ctx) {
    logger.info('获取文件封面请求参数', ctx.params);
    const { imageFolder, imageName } = ctx.params;
    // if (isEmpty(imageFolder) || isEmpty(imageName) || !pathIsOk(imageFolder) || !pathIsOk(imageName)) {
    //   ctx.throw(401, '文件路径无效或文件名不存在');
    //   return;
    // }
    try {
      let imageSuffix = getFileSuffix(imageName).toLowerCase();
      const filePath = USER_FILE_FOLDER + imageFolder + '/' + imageName;
      if (!fs.existsSync(filePath)) {
        ctx.throw(404, '图片不存在');
        return;
      }
      imageSuffix = imageSuffix.replace('.' ,'');
      const contentType = 'image/' + imageSuffix;
      const imageData = await fs.promises.readFile(filePath);
      // const imageData = fs.createReadStream(filePath);
      const base64Image = imageData.toString('base64');
      logger.info('imageData', imageData);
      logger.info('封面图片资源类型', typeof imageData);
      ctx.set('Content-Type', contentType);
      ctx.set('Cache-Control', 'max-age=2592000');
      ctx.body = Buffer.from(imageData, 'binary');
    } catch (e) {
      ctx.status = 500;
      ctx.body = '获取封面异常';
    }

  };
};

module.exports = new FileController();
