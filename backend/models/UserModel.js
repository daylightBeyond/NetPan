const { DataTypes } = require('sequelize');
const sequelize = require('../db/index'); // 引入 Sequelize 实例

const { INTEGER, STRING, CHAR, TINYINT, DATE, BIGINT } = DataTypes;
const User = sequelize.define('UserInfo', {
  // 定义 User 模型的字段
  userId: {
    type: STRING, // 使用 DataTypes.STRING 表示 VARCHAR 类型
    allowNull: false, // 不允许为空
    primaryKey: true, // 主键
    fields: 'user_id', // 如果数据库字段名和模型字段名不一致，可以使用 field 指定数据库字段名
  },
  username: {
    type: STRING,
    fields: 'username',
  },
  email: {
    type: STRING,
    fields: 'email',
  },
  password: {
    type: STRING,
    fields: 'password',
  },
  joinTime: {
    type: DATE,
    fields: 'join_time',
  },
  lastLoginTime: {
    type: DATE,
    fields: 'last_login_time',
  },
  status: {
    type: TINYINT,
    fields: 'status',
  },
  useSpace: {
    type: BIGINT,
    fields: 'use_space',
  },
  totalSpace: {
    type: BIGINT,
    fields: 'total_space',
  },
  admin: {
    type: BIGINT,
    fields: 'admin',
  },
  avatarPath: {
    type: STRING,
    fields: 'avatar_path',
  },
  avatarType: {
    type: STRING,
    fields: 'avatar_type',
  },
}, {
  tableName: 'user_info', // 映射的数据库表
  underscored: true, // 将模型的驼峰形式转换为下划线形式
  underscoredAll: true, // 将所有字段的驼峰形式转换为下划线形式
});

module.exports = User;