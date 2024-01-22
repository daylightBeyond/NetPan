const Router = require('koa-router');
const router = new Router({ prefix: '/api' });

const { authMiddleware } = require('../middlewares/common.middleware');
const {
  getFolderInfo,
  createDownloadUrl,
  download
} = require('../controllers/common.controller');

// 获取文件信息
router.post('/file/getFolderInfo', authMiddleware, getFolderInfo);

// 创建下载链接
router.get('/file/createDownloadUrl/:fileId', createDownloadUrl);

// 下载文件
// 无需校验登录信息，因为会分享文件到外部使用
router.get('/file/download/:code', download);

module.exports = router;
