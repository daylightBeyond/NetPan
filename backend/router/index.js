const fs = require('fs');
const path = require('path');
const Router = require('koa-router');
const router = new Router();

fs.readdirSync(__dirname).forEach(file => {
  if(file === 'index.js') return;

  if(file.includes('.router.js')) {
    const r = require(`./${file}`);
    router.use(r.routes(), r.allowedMethods());
  } else {
    fs.readdirSync(path.resolve(__dirname, file)).forEach(dirFile => {
      const dirRouter = require(`${path.resolve(__dirname, file)}/${dirFile}`);
      router.use(dirRouter.routes(), dirRouter.allowedMethods());
    })
  }
});

// -------------------------------------------------------

// const files = fs.readdirSync(__dirname);
// // 过滤出以 .js 为后缀的文件
// const routerFiles = files.filter(file => file.endsWith('.js'));
// // 导入并解析每个路由文件，并将其合并到 router 实例中
// routerFiles.forEach(file => {
//   if(file !== 'index.js') {
//     const route = require(path.join(__filename, file));
//     console.log('asasdasd')
//     router.use(route.routes(), route.allowedMethods());
//   }
// });

module.exports = router;