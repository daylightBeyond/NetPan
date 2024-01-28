const fs = require('fs');
const path = require('path');
const { Op, where} = require('sequelize');
const logger = require("../utils/logger");
const { fileDelFlagEnum, fileFolderTypeEnum} = require("../enums/fileEnum");
const { FileModel, UserModel} = require("../models");
const redisUtils = require('../utils/redisUtil');
const { findAllSubFolderFileList, rename } = require('../utils/fileUtils');
const handleException = require("../utils/handleException");
const { ZERO_STR, REDIS_USER_FOLDER, REDIS_KEY_EXPIRE_DAY } = require('../constants/constants');
const { isEmpty } = require("../utils/utils");

class RecycleController {
  /**
   * 查询回收站的文件列表
   * 前端传递参数： pageNum, pageSize
   * @param ctx
   * @returns {Promise<void>}
   */
  async queryRecycleList(ctx) {
    logger.info('开始查询回收站文件列表');
    logger.info('查询文件列表请求参数', ctx.request.body);
    const { pageNum, pageSize } = ctx.request.body;
    const user = ctx.state.user;
    const { userId } = user;
    try {
      const params = {
        userId,
        delFlag: fileDelFlagEnum.RECYCLE.code,
      };

      const offset = (pageNum - 1) * pageSize;

      const { count, rows } = await FileModel.findAndCountAll({
        limit: pageSize,
        offset,
        order: [['recoveryTime', 'desc']],
        subQuery: false,
        where: params
      });
      logger.info(`查询回收站文件列表信息:`, rows);
      logger.info(`查询回收站文件列表数量:`, count);
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
      logger.info('结束查询回收站文件列表');
    } catch (err) {
      return handleException(ctx, err, '查询回收站文件列表失败');
    }
  };

  /**
   * 恢复回收站文件
   * 前端传递的参数：fileIds(以 , 分割拼接的文件id)
   * @param ctx
   * @returns {Promise<void>}
   */
  async recoverFile(ctx) {
    const { fileIds } = ctx.request.body;
    const user = ctx.state.user;
    const { userId } = user;

    const fileIdArray = fileIds.split(',');
    logger.info('fileId集合', fileIdArray);

    try {
      const queryDelFile = {
        userId,
        fileId: { [Op.in]: fileIdArray },
        delFlag: fileDelFlagEnum.RECYCLE.code
      };

      const fileInfoList = await FileModel.findAll({ where: queryDelFile });
      logger.info('条件查询回收站的文件', fileInfoList);
      const delFileSubFolderFileIdList = [];
      for (let fileInfo of fileInfoList) {
        // 如果是文件夹
        if (fileFolderTypeEnum.FOLDER.code == fileInfo.folderType) {
          await findAllSubFolderFileList(delFileSubFolderFileIdList, userId, fileInfo.fileId, fileDelFlagEnum.DEL.code);
        }
      }
      logger.info('被还原的文件夹下所有的文件id', delFileSubFolderFileIdList);

        // 查询所有根目录的文件
      const queryDelRootFile = {
        userId,
        delFlag: fileDelFlagEnum.USING.code,
        filePid: ZERO_STR,
      };
      logger.info('查询根目录的条件', queryDelRootFile);
      const allRootFileList = await FileModel.findAll({ where: queryDelRootFile });
      logger.info('所有根目录下的文件', allRootFileList);
      // 将相同名字的文件转成map类型，文件名作为key，文件信息作为值
      const rootFileMap = allRootFileList.reduce((preFileInfo, fileInfo) => {
        preFileInfo[fileInfo.fileName] = fileInfo;
        return preFileInfo;
      }, {});
      logger.info('根目录下文件map', rootFileMap);

      // 查询所有选中文件，将目录下的所有删除的文件更新为使用中
      if (!isEmpty(rootFileMap)) {
        const fileInfo = {
          delFlag: fileDelFlagEnum.USING.code
        };
        const condition = {
          userId,
          filePid: { [Op.in]: delFileSubFolderFileIdList },
          delFlag: fileDelFlagEnum.DEL.code
        };
        await FileModel.update(fileInfo, { where: condition })
      }

      // 将选中的文件更新为正常，且父级目录到根目录
      const delFileList = Array.from(fileIdArray);
      const updateInfo = {
        delFlag: fileDelFlagEnum.USING.code,
        filePid: ZERO_STR, // 还原的文件移动根目录中
        lastUpdateTime: new Date(),
      };
      const conditionBatch = {
        userId,
        fileId: { [Op.in]: delFileList },
        delFlag: fileDelFlagEnum.RECYCLE.code
      };
      await FileModel.update(updateInfo, { where: conditionBatch } );

        // 将所选文件重命名
      for (let item of fileInfoList) {
        const rootFileInfo = rootFileMap[item.fileName];
        logger.info('根目录下与被还原的文件名字冲突的文件', rootFileInfo);

        if (!isEmpty(rootFileInfo)) {
          // 文件名已经存在，重命名被还原的文件名
          const fileName = rename(item.fileName);
          logger.info('修改重复文件名的文件后的新名字', fileName);
          const updateName = { fileName };
          await FileModel.update(updateName, { where: { userId, fileId: item.fileId } });
        }
      }

      ctx.body = {
        code: 200,
        success: true,
        message: '文件还原成功'
      }
    } catch (err) {
      handleException(ctx, err, err.message || '还原文件失败');
    }
  };

  /**
   * 回收站彻底删除文件
   * 前端传的参数, fileIds：文件 id 字符串拼接，adminOp: 是否是管理员操作，没传的话默认是false
   * @param ctx
   * @returns {Promise<void>}
   */
  async delFileBatch(ctx) {
    const { fileIds, adminOp = false } = ctx.request.body;
    const user = ctx.state.user;
    const { userId } = user;

    try {
      const fileIdArray = fileIds.split(',');
      logger.info('需要删除的文件id集合', fileIdArray)
      const queryParams = {
        userId,
        fileId: { [Op.in]: fileIdArray },
        delFlag: fileDelFlagEnum.RECYCLE.code
      };
      // 查询选中的需要彻底删除的文件
      const fileInfoList = await FileModel.findAll({ where: queryParams });
      logger.info('查询选中的需要彻底删除的文件', fileInfoList);
      const delFileSubFileFolderFileIdList = [];
      // 找到所选文件子目录文件ID
      for (let fileInfo of fileInfoList) {
        if (fileFolderTypeEnum.FOLDER.code == fileInfo.folderType) {
          await findAllSubFolderFileList(delFileSubFileFolderFileIdList, userId, fileInfo.fileId, fileDelFlagEnum.DEL.code);
        }
      }
      logger.info('需要彻底删除的文件Id集合', delFileSubFileFolderFileIdList);

      // 删除所选文件子目录中的文件，注意是目录中的文件
      if (delFileSubFileFolderFileIdList.length) {
        const condition = {
          userId,
          filePid: { [Op.in]: delFileSubFileFolderFileIdList },
        }
        // 如果不是管理员操作就将文件为回收状态的彻底删除
        if (!adminOp) {
          condition['delFlag'] = fileDelFlagEnum.RECYCLE.code
        }
        await FileModel.destroy({ where: condition });
      }

      // 删除所选文件
      const whereCondition = {
        userId,
        fileId: { [Op.in]: fileIdArray },
      };
      if (!adminOp) {
        whereCondition['delFlag'] = fileDelFlagEnum.RECYCLE.code
      }
      await FileModel.destroy({ where: whereCondition });

      // 注意上面的操作并没有删除服务器的文件，因为有可能别人上传了相同的文件，这边删除会影响别人上传的文件，所以并没有删除服务器的文件
      // 当然，肯定还有别的条件可以控制完全删除，比如 md5，获取数据库的表多几个字段来表示，都可以

      // 删除文件后需要，更新使用空间
      // 查询用户上传文件的总大小
      const fileSizeSum = await FileModel.sum('fileSize', { where: { userId } });
      logger.info('用户上传文件总大小fileSizeSum', fileSizeSum);
      const updateUserInfo = {
        useSpace: fileSizeSum || 0,
        lastUpdateTime: new Date(),
      };
      // 更新用户使用空间信息
      await UserModel.update(updateUserInfo,{ where: { userId } });

      const userInfo = await redisUtils.get(`${REDIS_USER_FOLDER}:${userId}:userInfo`);
      logger.info('redis获取用户信息', userInfo);
      userInfo['useSpace'] = fileSizeSum;
      logger.info('更新后的信息', userInfo);
      await redisUtils.set(`${REDIS_USER_FOLDER}:${userId}:userInfo`, userInfo, REDIS_KEY_EXPIRE_DAY);
      await redisUtils.set(`${REDIS_USER_FOLDER}:${userId}:fileSizeSum`, fileSizeSum, REDIS_KEY_EXPIRE_DAY);

      ctx.body = {
        code: 200,
        success: true,
        message: '文件删除成功'
      };
    } catch (err) {
      handleException(ctx, err, err.message || '删除文件失败');
    }
  };
};

module.exports = new RecycleController();
