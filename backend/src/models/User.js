const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  telegram_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    unique: true,
    primaryKey: true,
    autoIncrement: false
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  balance: {
    type: DataTypes.BIGINT,
    defaultValue: 0
  },
  pending_balance: {
    type: DataTypes.BIGINT,
    defaultValue: 0
  },
  streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  last_check_in: {
    type: DataTypes.DATE
  },
  is_banned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  },
  google_aid: { type: DataTypes.STRING, allowNull: true },
  ios_idfa: { type: DataTypes.STRING, allowNull: true },
  phone_number: { type: DataTypes.STRING, allowNull: true },
  is_phone_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_channel_joined: { type: DataTypes.BOOLEAN, defaultValue: false },
  referred_by: { type: DataTypes.BIGINT, allowNull: true },
  ip_address: { type: DataTypes.STRING, allowNull: true },
  photo_url: { type: DataTypes.STRING, allowNull: true },
  daily_games_played: { type: DataTypes.INTEGER, defaultValue: 0 },
  last_game_date: { type: DataTypes.DATEONLY, allowNull: true }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true
});

module.exports = User;
