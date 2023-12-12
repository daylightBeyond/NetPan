const { DataTypes } = require('sequelize');
const sequelize = require('../db/index'); // 引入 Sequelize 实例

const { INTEGER, STRING, CHAR, TINYINT, DATE, BIGINT } = DataTypes;
const Email = sequelize.define('EmailCode', {
  // 定义 EmailCode 模型的字段
  email: {
    type: STRING, // 使用 DataTypes.STRING 表示 VARCHAR 类型
    allowNull: false, // 不允许为空
    primaryKey: true, // 主键
    fields: 'email', // 如果数据库字段名和模型字段名不一致，可以使用 field 指定数据库字段名
  },
  code: {
    type: STRING, // 使用 DataTypes.STRING 表示 VARCHAR 类型
    allowNull: false, // 不允许为空
    primaryKey: true, // 主键
    fields: 'code', // 如果数据库字段名和模型字段名不一致，可以使用 field 指定数据库字段名
  },
  createTime: {
    type: DATE,
    fields: 'create_time',
  },
  status: {
    type: TINYINT,
    fields: 'status',
  },
}, {
  tableName: 'email_code', // 映射的数据库表
  underscored: true, // 将模型的驼峰形式转换为下划线形式
  underscoredAll: true, // 将所有字段的驼峰形式转换为下划线形式
});

module.exports = Email;