const Router = require('koa-router');
const router = new Router({ prefix: '/api' });

const { authMiddleware } = require('../middlewares/common.middleware');
const {
  getFolderInfo,
  createDownloadUrl
} = require('../controllers/common.controller');

// 获取文件信息
router.post('/file/getFolderInfo', authMiddleware, getFolderInfo);

// 创建下载链接
router.post('/file/createDownloadUrl/{fileId}', authMiddleware, createDownloadUrl);

module.exports = router;
