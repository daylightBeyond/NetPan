const Sequelize = require('sequelize');
const dbConfig = require('./db');

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig.options
);
module.exports = sequelize;