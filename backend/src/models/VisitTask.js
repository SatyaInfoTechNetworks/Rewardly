const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VisitTask = sequelize.define('VisitTask', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  reward_amount: {
    type: DataTypes.INTEGER,
    defaultValue: 20
  },
  icon: {
    type: DataTypes.STRING,
    defaultValue: 'Globe'
  },
  timer_seconds: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  }
}, {
  tableName: 'visit_tasks',
  timestamps: true,
  underscored: true
});

module.exports = VisitTask;
