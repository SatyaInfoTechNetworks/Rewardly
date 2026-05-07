const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  telegram_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('survey', 'task', 'daily_streak', 'spin', 'withdrawal', 'game'),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  external_id: {
    type: DataTypes.STRING,
    allowNull: true
    // unique: true removed temporarily to fix "Too many keys" error
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'completed'
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  underscored: true
});

module.exports = Transaction;
