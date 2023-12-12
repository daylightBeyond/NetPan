const {
  MYSQL_HOST,
  MYSQL_PORT,
  MYSQL_DATABASE,
  MYSQL_USER,
  MYSQL_PASSWORD
} = process.env;

module.exports = {
  database: MYSQL_DATABASE,
  username: MYSQL_USER,
  password: MYSQL_PASSWORD,
  options: {
    host: MYSQL_HOST,
    dialect: 'mysql', // 数据库类型
    pool: {
      max: 5, // 数据库连接池最大数
      min: 0, // 数据库连接池最小数
      acquire: 30000, // 在抛出错误之前允许获取连接的最大时长（毫秒）
      idle: 10000 // // 在释放连接之前允许空闲的最大毫秒数
    },
    // logging: (...msg) => console.log(msg), // 显示所有日志函数调用参数
    define: {
      timestamps: false, // 禁用默认的 createdAt 和 updatedAt 字段
      freezeTableName: true // 表名默认不加 s
    },
    timezone: '+08:00', // 东八 区的时间设置
  }
}