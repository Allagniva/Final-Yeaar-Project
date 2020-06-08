const Sequelize = require('sequelize');

const sequelize = new Sequelize('node-complete', 'root', 'mySql@7489', {
  dialect: 'mysql',
  host: 'localhost'
});

module.exports = sequelize;
