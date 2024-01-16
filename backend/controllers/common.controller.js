const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
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
    const { path, userId } = ctx.request.body;
    const pathArr = path.split('/');
    const condition = {
      userId,
      folderType: fileFolderTypeEnum.FOLDER.code,
      fileId: { [Op.in]: pathArr },
    };
    // 原本 sql 中排序要根据前端传的path顺序来排序
    // 比如 前端的文件夹有层级，传递的是 path: aaa/bbb/ccc 那么sql查询结果就是要 根据 aaa, bbb, ccc顺序排序
    // sql:  select * from file_info where fileId in ("aaa", "bbb") order by fileId(file_id, "aaa", "bbb")
    // 但是 sequelize 无法实现, 只能通过下列方式实现
    const fileList = await FileModel.findAll({ where: condition });
    logger.info("文件目录查询结果", fileList);
    // 创建一个用于存储有序结果的对象映射表
    const orderedMap = {};
    fileList.forEach(record => {
      fileList[record.fileId] = record;
    });

    // 按照给定数组顺序生成并返回新的有序数组
    const sortedRecords = pathArr.map(id => orderedMap[id]);

    // TODO 注意，返回前端的数据不应该全部返回
    ctx.body = {
      success: true,
      code: 200,
      data: sortedRecords
    }
  };

  /**
   * 创建下载链接
   * @param ctx
   * @returns {Promise<void>}
   */
  async createDownloadUrl(ctx) {
    const { fileId } = ctx.params;
    const user = ctx.state.user;
    const { userId } = user;

    const fileInfo = await FileModel.findOne({ where: { fileId, userId } });
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
      filepath: fileInfo.filepath,
      fileName: fileInfo.fileName
    };

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
    const downloadObj = await getDownloadCode(code);
    if (downloadObj == null) {
      return;
    }

    const filePath = USER_FILE_FOLDER + downloadObj.filePath;
    const fileName = downloadObj.fileName;

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
