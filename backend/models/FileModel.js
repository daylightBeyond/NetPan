const { DataTypes } = require('sequelize');
const sequelize = require('../db/index'); // 引入 Sequelize 实例

const { INTEGER, STRING, CHAR, TINYINT, DATE, BIGINT } = DataTypes;
const FileInfo = sequelize.define('FileInfo', {
  // 定义 FileInfo 模型的字段
  fileId: {
    type: STRING, // 使用 DataTypes.STRING 表示 VARCHAR 类型
    allowNull: false, // 不允许为空
    primaryKey: true, // 主键
    fields: 'file_id', // 如果数据库字段名和模型字段名不一致，可以使用 field 指定数据库字段名
  },
  userId: {
    type: STRING,
    allowNull: false,
    primaryKey: true,
    fields: 'user_id',
  },
  fileMd5: {
    type: STRING,
    fields: 'file_md5',
  },
  filePid: {
    type: STRING,
    fields: 'file_pid',
  },
  fileSize: {
    type: BIGINT,
    fields: 'file_size',
  },
  fileName: {
    type: STRING,
    fields: 'file_name',
  },
  fileCover: {
    type: STRING,
    fields: 'file_cover',
  },
  filePath: {
    type: STRING,
    fields: 'file_path',
  },
  createTime: {
    type: DATE,
    fields: 'create_time',
  },
  lastUpdateTime: {
    type: DATE,
    fields: 'last_update_time',
  },
  folderType: {
    type: TINYINT,
    fields: 'folder_type',
  },
  fileCategory: {
    type: TINYINT,
    fields: 'file_category',
  },
  fileType: {
    type: TINYINT,
    fields: 'file_type',
  },
  status: {
    type: TINYINT,
    fields: 'status',
  },
  recoveryTime: {
    type: DATE,
    fields: 'recovery_time',
  },
  delFlag: {
    type: TINYINT,
    fields: 'del_flag',
  },
}, {
  tableName: 'file_info', // 映射的数据库表
  underscored: true, // 将模型的驼峰形式转换为下划线形式
  underscoredAll: true, // 将所有字段的驼峰形式转换为下划线形式
});

module.exports = FileInfo;