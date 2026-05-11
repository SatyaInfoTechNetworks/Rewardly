const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contest = sequelize.define('Contest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  tracking_type: {
    type: DataTypes.ENUM('earnings', 'referrals'),
    defaultValue: 'earnings'
  },
  banner_image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'active', 'completed', 'cancelled'),
    defaultValue: 'draft'
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  prize_pool: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  prize_pool_type: {
    type: DataTypes.ENUM('fixed', 'dynamic'),
    defaultValue: 'fixed'
  },
  access_type: {
    type: DataTypes.ENUM('free', 'paid', 'invite_only'),
    defaultValue: 'free'
  },
  entry_fee: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  entry_fee_type: {
    type: DataTypes.ENUM('coins', 'cash'),
    defaultValue: 'coins'
  },
  maximum_participants: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rules: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  auto_join: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'If true, users join automatically on activity. If false, they must pay/click join.'
  },
  minimum_activity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Min coins or referrals needed to qualify'
  }
}, {
  tableName: 'contests',
  underscored: true
});

module.exports = Contest;
