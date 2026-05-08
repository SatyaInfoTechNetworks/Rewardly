const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DailyReward = sequelize.define('DailyReward', {
  day: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    primaryKey: true
  },
  reward_amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10
  }
}, {
  tableName: 'daily_rewards',
  timestamps: false,
  underscored: true
});

module.exports = DailyReward;
