const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BroadcastLog = sequelize.define('BroadcastLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  broadcast_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  telegram_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending' // 'pending', 'success', 'failed', 'blocked'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  clicked: {
    type: DataTypes.TINYINT,
    defaultValue: 0
  },
  opened: {
    type: DataTypes.TINYINT,
    defaultValue: 0
  }
}, {
  tableName: 'broadcast_logs',
  timestamps: true,
  underscored: true
});

module.exports = BroadcastLog;
