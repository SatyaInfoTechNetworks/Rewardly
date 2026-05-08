const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserVisit = sequelize.define('UserVisit', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  task_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  completed_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_visits',
  timestamps: false,
  underscored: true
});

module.exports = UserVisit;
