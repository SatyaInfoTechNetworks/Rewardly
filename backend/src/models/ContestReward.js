const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContestReward = sequelize.define('ContestReward', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  contest_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  rank_from: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  rank_to: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reward_type: {
    type: DataTypes.ENUM('coins', 'cash'),
    defaultValue: 'coins'
  },
  reward_value: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reward_text: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Display text like ₹500 or 5000 Coins'
  }
}, {
  tableName: 'contest_rewards',
  underscored: true
});

module.exports = ContestReward;
