const Router = require('koa-router');

const {
  queryFile,
  uploadFile,
  getImage,
  getFile,
  newFolder,
  rename,
  loadAllFolder,
  changeFileFolder,
  // createDownloadUrl,
} = require('../controllers/file.controller');

const {
  authMiddleware
} = require('../middlewares/common.middleware');
const router = new Router({ prefix: '/api' });

// 查询文件列表接口
router.post('/file/queryFile', authMiddleware, queryFile);

// 文件分片上传
router.post('/file/uploadFile', authMiddleware, uploadFile);

// 获取文件封面
router.get('/file/getImage/:imageFolder/:imageName', authMiddleware, getImage);

// 视频文件预览
router.get('/file/ts/getVideoInfo/:fileId', authMiddleware, getFile);

// 非文件类型预览
router.get('/file/getFile/:fileId', authMiddleware, getFile);

// 新建目录
router.post('/file/newFolder', authMiddleware, newFolder);

// 获取文件信息
// router.post('/file/getFolderInfo', authMiddleware, getFolderInfo);

// 重命名
router.post('/file/rename', authMiddleware, rename);

// 加载所有文件目录
// 移动文件时，需要展示所有的文件目录信息
router.post('/file/loadAllFolder', authMiddleware, loadAllFolder);

// 移动文件
router.post('/file/changeFileFolder', authMiddleware, changeFileFolder);



module.exports = router;
