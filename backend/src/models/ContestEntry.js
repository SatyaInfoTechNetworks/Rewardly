const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContestEntry = sequelize.define('ContestEntry', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  contest_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  rank: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'disqualified', 'winner'),
    defaultValue: 'active'
  },
  reward_claimed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'contest_participants',
  timestamps: true,
  underscored: true
});

module.exports = ContestEntry;
