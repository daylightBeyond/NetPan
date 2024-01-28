const Router = require('koa-router');

const {
    queryRecycleList,
    recoverFile,
    delFileBatch
} = require('../controllers/recycle.controller');

const {
    authMiddleware
} = require('../middlewares/common.middleware');
const router = new Router({ prefix: '/api' });

// 查询文件列表接口
router.post('/recycle/queryRecycleList', authMiddleware, queryRecycleList,);

// 恢复文件
router.post('/recycle/recoveryFile', authMiddleware, recoverFile);

// 彻底删除文件
router.post('/recycle/delFile', authMiddleware, delFileBatch);

module.exports = router;
