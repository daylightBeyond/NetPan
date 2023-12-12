const dotenv = require('dotenv');

// dotenv.config() 就是把 .env 文件读取到 config 中
dotenv.config();

// process 代表的 node 执行的进程， env 代表环境变量
module.exports = process.env;