const Router = require('koa-router');

const {
  queryFile,

} = require('../controllers/file.controller');

const {
  authMiddleware
} = require('../middlewares/common.middleware');
const router = new Router({ prefix: '/api' });

// // 查询文件列表接口
router.post('/file/queryFile', authMiddleware, queryFile);

// 文件分片上传
// router.post('/file/uploadFile', authMiddleware, uploadFile);

module.exports = router;
