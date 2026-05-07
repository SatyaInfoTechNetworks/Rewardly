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
  type: {
    type: DataTypes.ENUM('earning', 'referral', 'streak'),
    defaultValue: 'earning'
  },
  banner_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('upcoming', 'active', 'ended'),
    defaultValue: 'upcoming'
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rules: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  min_qualification: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Min coins/referrals needed to qualify'
  },
  prize_pool_text: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '₹0'
  },
  is_auto_distribute: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'contests',
  underscored: true
});

module.exports = Contest;
