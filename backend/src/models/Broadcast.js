const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Broadcast = sequelize.define('Broadcast', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  media_type: {
    type: DataTypes.STRING,
    defaultValue: 'none' // 'none', 'photo', 'video', 'animation'
  },
  media_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  button_text: {
    type: DataTypes.STRING,
    allowNull: true
  },
  button_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  target_type: {
    type: DataTypes.STRING,
    allowNull: false // 'all_users', 'active_users', 'inactive_users', 'vip_users', 'new_users', 'referral_users', 'wallet_users'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'draft' // 'draft', 'scheduled', 'running', 'completed', 'failed'
  },
  scheduled_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'broadcasts',
  timestamps: true,
  underscored: true
});

module.exports = Broadcast;
