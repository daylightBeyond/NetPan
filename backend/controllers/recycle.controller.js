const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const logger = require("../utils/logger");
const { fileDelFlagEnum, fileFolderTypeEnum} = require("../enums/fileEnum");
const { FileModel } = require("../models");
const { findAllSubFolderFileList } = require('../utils/fileUtils');
const handleException = require("../utils/handleException");

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

        const query = {
            userId,
            fileId: { [Op.in]: fileIdArray },
            delFlag: fileDelFlagEnum.RECYCLE.code
        };

        const fileInfoList = await FileModel.findAll({ where: query });
        logger.info('查询回收站的文件', fileInfoList);
        const delFileSubFolderFileIdList = [];
        for (let fileInfo of fileInfoList) {
            // 如果是文件
            if (fileFolderTypeEnum.FOLDER.code == fileInfo.folderType) {
                await findAllSubFolderFileList(delFileSubFolderFileIdList, userId, fileInfo.fileId, fileDelFlagEnum.DEL.code);
            }
        }

        // 查询所有根目录的文件
        // TODO 未完成
    };
};

module.exports = new RecycleController();
