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
  reference_id: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING, // Changed to STRING for flexibility
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  external_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'completed'
  },
  contest_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  underscored: true
});

module.exports = Transaction;
