const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
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
  getFileNameNoSuffix,
  saveFileTempSize, checkFileName,
  rename: fileRename,
  findAllSubFolderFileList
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
  REDIS_KEY_EXPIRE_THIRTY_MIN, LENGTH_10, REDIS_TEMP_FOLDER, ZERO
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
  async queryFile(ctx) {
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

      const { count, rows } = await FileModel.findAndCountAll({
        limit: pageSize,
        offset,
        order: [['lastUpdateTime', 'desc']],
        subQuery: false,
        where: params
      });
      logger.info(`查询文件列表数量:`, count);
      // logger.info(`查询文件列表信息:`, rows);
      const data = {
        list: rows,
        pageNum,
        pageSize,
        total: count
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
    // 实时获取用户上传过的文件大小
    const useSpace = await redisUtils.get(`${REDIS_USER_FOLDER}:${userId}:fileSizeSum`);
    logger.info('redis获取useSpace', useSpace);
    const userInfo = await redisUtils.get(`${REDIS_USER_FOLDER}:${userId}:userInfo`);
    logger.info('redis获取userInfo', userInfo);
    const { totalSpace } = userInfo || {};
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
          logger.info('dbFile.fileSize', dbFile.fileSize);
          // 判断文件大小
          if (dbFile['fileSize'] + useSpace > totalSpace) {
            ctx.throw(responseCodeEnum.CODE_904.key, responseCodeEnum.CODE_904.value);
            return;
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
          fs.unlinkSync(file.filepath); // 同步删除临时文件
          return;
        }
      }
      /*
       * 由于前端上传的文件到服务器中名字变了
       * 需要将分片的文件按照 分片索引命名
       */
      await moveFile(file.filepath, fileChunkDir, chunkIndex);

      // 判断磁盘空间
      const curTempSize = await getFileTempSize(userId, fileId);
      logger.info('当前临时文件大小', curTempSize, 'byte');
      if (file.size + curTempSize + useSpace > totalSpace) {
        ctx.throw(responseCodeEnum.CODE_904.key, responseCodeEnum.CODE_904.value);
        return;
        // throw new Error(responseCodeEnum.CODE_904.value);
      }

      // 暂存临时目录
      const tempFolderName = UPLOAD_TEMP_FOLDER;
      // 当前用户上传的文件目录
      const curUserFolderName = userId + '/' + fileId;

      userFolderPath = tempFolderName + curUserFolderName;
      logger.info('用户存储文件目录', userFolderPath);

      // 分成多片时，处于中间的分片
      if (chunkIndex < chunks - 1) {
        await saveFileTempSize(userId, fileId, file.size);
        // await saveFileTempSize(`${REDIS_TEMP_FOLDER}:${userId}:${fileId}:tempFileSize`, curTempSize, REDIS_KEY_EXPIRE_THIRTY_MIN)
        // await redisUtils.set(`${REDIS_USER_FOLDER}:${userId}:${fileId}:tempFileSize`, curTempSize, REDIS_KEY_EXPIRE_THIRTY_MIN);
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
      // await redisUtils.set(`${REDIS_USER_FOLDER}:${userId}:${fileId}:tempFileSize`, curTempSize, REDIS_KEY_EXPIRE_THIRTY_MIN);

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
        fileSize: file.size, // TODO 待修改
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

      const totalSize = await getFileTempSize(userId, fileId);
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
   * 前端传的参数就是 fileCover 文件封面路径
   * @param ctx
   * @returns {Promise<void>}
   */
  async getImage(ctx) {
    logger.info('获取文件封面请求参数', ctx.params);
    const { imageFolder, imageName } = ctx.params;
    if (isEmpty(imageFolder) || isEmpty(imageName) || !pathIsOk(imageFolder) || !pathIsOk(imageName)) {
      ctx.throw(401, '文件路径无效或文件名不存在');
      return;
    }
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
      // const base64Image = imageData.toString('base64');
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

  /**
   * 视频预览
   * 前端传的参数 文件id: fileId
   * @param ctx
   * @returns {Promise<void>}
   */
  async getFile(ctx) {
    const { fileId } = ctx.params;
    const user = ctx.state.user;
    const { userId } = user;

    let filePath = null;

    try {
      if (fileId.endsWith('.ts')) { // 视频ts文件预览
        const tsArr = fileId.split('_');
        logger.info('tsArr', tsArr);
        const realFileId = tsArr[0];
        logger.info('realFileId', realFileId);
        const fileInfo = await FileModel.findOne({ where: { userId, realFileId } });
        logger.info('fileInfo.filePath', fileInfo.filePath);
        if (fileInfo == null) {
          ctx.throw(404, '文件资源不存在');
          return;
        }
        let fileName = fileInfo.filePath;
        fileName = getFileNameNoSuffix(fileName) + '/' + fileId;
        logger.info('fileName', fileName);
        filePath = USER_FILE_FOLDER + fileName
        logger.info('filePath', filePath);
        ctx.set('Content-Type', 'video/mpt2'); // 设置 td 文件的 MIME 类型
        ctx.body = '';
      } else {
        const fileInfo = await FileModel.findOne({ where: { userId, fileId } });
        if (fileInfo == null) {
          ctx.throw(404, '文件资源不存在');
          return;
        }

        if (fileCategoryEnums.VIDEO.category == fileInfo.fileCategory) { // 如果是视频 m3u8
          const fileNameNoSuffix = getFileNameNoSuffix(fileInfo.filePath);
          logger.info('根据文件路径获取不带后缀的文件名');
          filePath = USER_FILE_FOLDER + fileNameNoSuffix + '/' + 'index.m3u8';
          logger.info('获取视频资源路径', filePath);
        } else { // 其他类型，例如 txt, excel, doc, ppt 等等
          filePath = USER_FILE_FOLDER + fileInfo.filePath;
        }

        if (!fs.existsSync(filePath)) {
          ctx.throw(404, '文件资源不存在');
          return;
        }

        const file = fs.createReadStream(filePath);
        ctx.set('Content-Type', 'application/x-mpegURL'); // 设置 m3u8 文件的 MIME 类型
        ctx.body = file;
      }
    } catch (err) {
      return handleException(ctx, err, '获取视频资源异常');
    }
  };

  /**
   * 新建目录
   * 前端传的参数：fileName, filePid
   * @param ctx
   * @returns {Promise<void>}
   */
  async newFolder(ctx) {
    const { fileName, filePid } = ctx.request.body;
    const user = ctx.state.user;
    const { userId } = user;
    try {
      await checkFileName(filePid, userId, fileName, fileFolderTypeEnum.FOLDER.code);
      const curDate = new Date();
      const insertParams = {
        fileId: generateUUid(LENGTH_10),
        userId,
        filePid,
        fileName,
        folderType: fileFolderTypeEnum.FOLDER.code,
        createTime: curDate,
        lastUpdateTime: curDate,
        status: fileStatusEnum.USING.code,
        delFlag: fileDelFlagEnum.USING.code,
      };
      logger.info('新增文件目录数据', insertParams);

      const insertFileInfo = await FileModel.create(insertParams);
      logger.info('新增目录成功', insertFileInfo);

      // 由于在返回新增的结果时，字段不全，所以重新查一遍再返回前端，如果全部字段返回了，也可以不用查
      const fileInfo = await FileModel.findOne({ where: insertParams });
      logger.info('查询新增目录的结果', fileInfo);

      ctx.body = {
        success: true,
        code: 200,
        data: fileInfo,
        message: '新建目录成功'
      }
    } catch (err) {
      handleException(ctx, err, err.message);
    }
  };

  /**
   * 文件重命名，也有可能时文件夹
   * 前端传递的参数：fileId, fileName
   * @param ctx
   * @returns {Promise<void>}
   */
  async rename(ctx) {
    let { fileId, fileName } = ctx.request.body;
    const user = ctx.state.user;
    const { userId } = user;

    const fileInfo = await FileModel.findOne({ where: { fileId, userId } });
    logger.info('重命名查询文件', fileInfo);
    if (fileInfo == null) {
      ctx.throw(404, '文件不存在');
      return;
    }

    try {
      const filePid = fileInfo.filePid;
      await checkFileName(filePid, userId, fileName, fileInfo.folderType, ctx);
      // 获取文件后缀
      if (fileFolderTypeEnum.FILE.code == fileInfo.folderType) {
        // 因为前端是传不包含后缀的文件名，这里要加上文件后缀
        fileName = fileName + getFileSuffix(fileInfo.fileName);
      }
      const curData = new Date();
      const dbInfo = {
        fileName,
        lastUpdateTime: curData
      };
      await FileModel.update(dbInfo, { where: { userId, fileId }});

      const queryParams = {
        filePid,
        userId,
        fileName,
      };
      const count = await FileModel.count({ where: queryParams });
      logger.info('查询文件名是否重复', count);
      if (count > 1) {
        ctx.throw(409, `文件名${fileName}已经存在`); // 409 代表资源冲突
        return;
      }

      ctx.body = {
        success: true,
        code: 200,
        data: dbInfo // TODO 这里不应该全部信息都返回前端，需要调整
      };
    } catch (err) {
      handleException(ctx, err, err.message);
    }
  };

  /**
   * 加载所有的文件文件目录信息，用于移动文件时展示
   * 前端需要传递参数：fileIds (非必填)，filePid
   * @param ctx
   * @returns {Promise<void>}
   */
  async loadAllFolder(ctx) {
    const { fileIds, filePid } = ctx.request.body;
    const user = ctx.state.user;
    const { userId } = user;

    const queryInfo = {
      userId,
      filePid,
      folderType: fileFolderTypeEnum.FOLDER.code,
    };

    if (!fileIds) {
      // queryInfo['excludedFileArray'] = fileIds.split(',');
      queryInfo['fileId'] = { [Op.notIn]: fileIds.split(',') }
    }
    queryInfo['delFlag'] = fileDelFlagEnum.USING.code;
    logger.info('获取文件所有夹的查询参数条件', queryInfo);
    const fileInfoList = await FileModel.findAll({
      order: [['createTime', 'desc']],
      where: queryInfo,
    });

    ctx.body = {
      success: true,
      code: 200,
      data: fileInfoList, // TODO 这里不应该全部返回给前端
    };
  };

  /**
   * 移动文件，修改文件的目录位置
   * 前端传递的参数：fileIds, filePid
   * @param ctx
   * @returns {Promise<void>}
   */
  async changeFileFolder(ctx) {
    const { fileIds, filePid } = ctx.request.body;
    const user = ctx.state.user;
    const { userId } = user;

    if (fileIds == filePid) {
      ctx.throw(responseCodeEnum.CODE_600.key, responseCodeEnum.CODE_600.value);
      return;
    }

    if (String(ZERO) == filePid) {
      // 这里的作用是防止用户移动文件到原本目录，就抛出错误信息
      const fileInfo = await FileModel.findOne({ where: { fileId: filePid, userId } });
      if (fileInfo == null || !(fileDelFlagEnum.USING.code == fileInfo.delFlag)) {
        ctx.throw(responseCodeEnum.CODE_600.key, responseCodeEnum.CODE_600.value)
        return;
      }
    }

    const fileIdArray = fileIds.split(',');
    const query = {
      filePid,
      userId,
    }
    const dbFileList = await FileModel.fildAll({ where: query });

    const dbFileNameMap = dbFileList.reduce((acc, fileInfo) => {
      acc[fileInfo.fileName] = fileInfo;
      return acc;
    }, {});

    logger.info('将文件列表转换成以文件名和文件信息的map', dbFileNameMap);

    // 查询选中的文件
    const querySelect = {
      userId,
      fileId: { [Op.notIn]: fileIdArray },
    };
    const selectFileList = await FileModel.findAll({ where: querySelect });

    // 将所选文件重命名
    for (const item of selectFileList) {
      const rootFileInfo = dbFileNameMap[item.fileName];
      // 文件名已经存在，重命名被还原的文件名
      const updateInfo = {};
      if (rootFileInfo != null) {
        const fileName = fileRename(item.fileName);
        updateInfo['fileName'] = fileName;
      }
      updateInfo[filePid] = filePid;
      await FileModel.update(updateInfo,{ where: { userId, fileId: item.fileId } });
    }
  };

  /**
   * 批量删除文件到回收站
   * 前端传递参数：userId, fileIds(多个文件id字符串)
   * @param ctx
   * @returns {Promise<void>}
   */
  async removeFile2RecycleBatch(ctx) {
    const { fileIds } = ctx.request.body;
    console.log('fileIds', fileIds);
    const user = ctx.state.user;
    const { userId } = user;

    const fileIdArray = fileIds.split(',');

    try {
      const query = {
        userId,
        delFlag: fileDelFlagEnum.USING.code,
        fileId: { [Op.in]: fileIdArray },
      };

      logger.info('查询删除的条件', query);

      const fileInfoList = await FileModel.findAll({ where: query });
      logger.info('查询到需要删除的文件', fileInfoList);
      if (!fileInfoList.length) {
        return;
      }
      // 注意：如果前端选中的是文件夹删除，则文件夹里面的所有文件也都要删除
      // 如果文件夹内还有文件夹，这里只能用递归
      const delFilePidList = [];
      for (let fileInfo of fileInfoList) {
        await findAllSubFolderFileList(delFilePidList, userId, fileInfo.fileId, fileDelFlagEnum.USING.code);
      }

      logger.info('递归查询被删除的文件夹下所有的文件', delFilePidList);

      // 目录
      if (!delFilePidList.length) {
        const updateInfo = {
          delFlag: fileDelFlagEnum.DEL.code,
        };

        const conditionBatch = {
          userId,
          filePid: { [Op.in]: delFilePidList },
          delFlag: fileDelFlagEnum.USING.code
        };

        // 将选中的文件夹下，所有的filePid, 使用标识为使用的数据，使用标识改为删除
        await FileModel.update(updateInfo, { where: conditionBatch });
      }

      // 文件
      // 将选中的文件更新为回收站
      const fileInfo = {
        recoveryTime: new Date(),
        delFlag: fileDelFlagEnum.RECYCLE.code
      };
      const condition = {
        userId,
        fileId: { [Op.in]: fileIdArray },
        delFlag: fileDelFlagEnum.USING.code
      };

      await FileModel.update(fileInfo, { where: condition });

      ctx.body = {
        success: true,
        code: 200,
        message: '删除文件成功'
      }
    } catch (err) {
      handleException(ctx, err, '删除文件失败');
    }
  };

};

module.exports = new FileController();
