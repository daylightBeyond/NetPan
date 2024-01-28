const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const sequelize = require('../db/index');
const { fileFolderTypeEnum } = require("../enums/fileEnum");
const { FileModel, UserModel} = require("../models");
const logger = require("../utils/logger");
const { REDIS_EMAIL_FOLDER, LENGTH_50, USER_FILE_FOLDER} = require("../constants/constants");
const handleException = require("../utils/handleException");
const { generateRandomCode, generateUUid } = require("../utils/utils");
const {saveDownloadCode, getDownloadCode} = require("../utils/fileUtils");

class CommonController {
  async test(ctx) {
    try {
      const users = await UserModel.findAll('a');
      console.log('users', users);
      ctx.body = { users, aa: REDIS_EMAIL_FOLDER };
    } catch (err) {
      console.log('数据库查找异常', err)
      return handleException(ctx, err, '数据库查找异常');
    }
  };
  /**
   * 获取当前目录信息
   * 前端传的参数，path: 文件id（因为前端是根据目录的路由）
   * @param ctx
   * @returns {Promise<void>}
   */
  async getFolderInfo(ctx) {
    logger.info('获取当前目录信息请求参数', ctx.request.body);
    const { path, shareId } = ctx.request.body;
    const { userId } = ctx.state.user;
    const pathArr = path.split('/');
    const condition = {
      userId,
      folderType: fileFolderTypeEnum.FOLDER.code,
      fileId: { [Op.in]: pathArr },
    };

    logger.info('获取文件信息的查询条件', condition);

    // 注意这里的排序非常重要
    // 原本 sql 中排序要根据前端传的path顺序来排序
    // 比如 前端的文件夹有层级，传递的是 path: aaa/bbb/ccc 那么sql查询结果就是要 根据 aaa, bbb, ccc顺序排序
    // sql:  select * from file_info where fileId in ("aaa", "bbb", "ccc") order by field(file_id, "aaa", "bbb"，  "ccc")
    const orderByClause = sequelize.literal(`FIELD(file_id, ${pathArr.map(value => `'${value}'`).join(',')})`);
    logger.info('排序条件', orderByClause);
    const fileList = await FileModel.findAll({ where: condition, order: [orderByClause] });
    logger.info("*文件目录查询结果*", fileList);

    // 注意这里查询到的结果不用全部返回前端
    const newFileList = fileList.map(item => {
      return { fileId: item.fileId, fileName: item.fileName }
    });
    ctx.body = {
      success: true,
      code: 200,
      data: newFileList
    }
  };

  /**
   * 创建下载链接
   * @param ctx
   * @returns {Promise<void>}
   */
  async createDownloadUrl(ctx) {
    const { fileId, userId } = ctx.params;

    const fileInfo = await FileModel.findOne({ where: { fileId, userId } });
    logger.info('提供下载的文件信息')
    if (fileInfo == null) {
      ctx.throw(404, '资源不存在');
      return;
    }

    if (fileFolderTypeEnum.FOLDER.code == fileInfo.folderType) {
      ctx.throw(404, '资源不存在');
      return;
    }

    const code = generateUUid(LENGTH_50);
    const downloadObj = {
      code,
      filePath: fileInfo.filePath,
      fileName: fileInfo.fileName
    };

    logger.info('存储到redis的下载对象信息', downloadObj);
    await saveDownloadCode(code, downloadObj);

    ctx.body = {
      success: true,
      code: 200,
      data: code
    };
  };

  /**
   * 下载文件
   * @param ctx
   * @returns {Promise<void>}
   */
  async download(ctx) {
    const { code } = ctx.params;
    logger.info('文件提取码', code);
    const downloadObj = await getDownloadCode(code);
    logger.info('从redis提取下载对象信息', downloadObj);
    if (downloadObj == null) {
      return;
    }

    const filePath = USER_FILE_FOLDER + downloadObj.filePath;
    logger.info('下载路径', filePath);

    const fileName = downloadObj.fileName;
    logger.info('下载的文件名', fileName);
    ctx.set({
      'Content-Type': 'application/x-msdownload; charset=UTF-8',
      'Content-Disposition': `attachment; filename=${encodeURIComponent(fileName)}`
    });

    // 创建可读流并管道到响应流
    const fileStream = fs.createReadStream(filePath);
    ctx.body = fileStream;
  };
};

module.exports = new CommonController();
