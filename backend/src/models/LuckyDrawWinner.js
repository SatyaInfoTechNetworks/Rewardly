const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LuckyDrawWinner = sequelize.define('LuckyDrawWinner', {
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
  prize_won: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rank: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid'),
    defaultValue: 'pending'
  },
  proof_image: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'lucky_draw_winners',
  timestamps: true,
  underscored: true
});

module.exports = LuckyDrawWinner;
