const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LuckyDrawEntry = sequelize.define('LuckyDrawEntry', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  lucky_draw_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  entry_source: {
    type: DataTypes.ENUM('free', 'ad', 'coins', 'referral'),
    defaultValue: 'free'
  }
}, {
  tableName: 'lucky_draw_entries',
  timestamps: true,
  underscored: true
});

module.exports = LuckyDrawEntry;
