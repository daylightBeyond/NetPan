const Router = require('koa-router');

const {
    queryRecycleList
} = require('../controllers/recycle.controller');

const {
    authMiddleware
} = require('../middlewares/common.middleware');
const router = new Router({ prefix: '/api' });

// 查询文件列表接口
router.post('/recycle/queryRecycleList', authMiddleware, queryRecycleList,);

module.exports = router;
