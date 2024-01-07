const Router = require('koa-router');

const {
  queryFile,
  uploadFile,
  getImage
} = require('../controllers/file.controller');

const {
  authMiddleware
} = require('../middlewares/common.middleware');
const router = new Router({ prefix: '/api' });

// // 查询文件列表接口
router.post('/file/queryFile', authMiddleware, queryFile);

// 文件分片上传
router.post('/file/uploadFile', authMiddleware, uploadFile);

// 获取文件封面
router.get('/file/getImage/:imageFolder/:imageName', authMiddleware, getImage);

module.exports = router;
