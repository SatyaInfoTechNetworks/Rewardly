const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LuckyDraw = sequelize.define('LuckyDraw', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  banner_image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('daily_free', 'weekly_mega', 'coin_jackpot', 'referral_draw', 'watch_win', 'flash_draw', 'special_event'),
    defaultValue: 'daily_free'
  },
  prize_type: {
    type: DataTypes.ENUM('coins', 'cash', 'gift_card', 'item'),
    defaultValue: 'coins'
  },
  prize_amount: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '1000 Coins'
  },
  prize_value: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Internal numerical reward value (e.g. coin count or cash cents)'
  },
  status: {
    type: DataTypes.ENUM('upcoming', 'active', 'ended'),
    defaultValue: 'active'
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  free_entries_allowed: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  ad_entries_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  max_ad_entries: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  coin_entry_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  coin_cost_per_entry: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  max_entries_per_user: {
    type: DataTypes.INTEGER,
    defaultValue: 25
  },
  referral_entries_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  auto_winner_announcement: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  winners_count: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  tableName: 'lucky_draws',
  timestamps: true,
  underscored: true
});

module.exports = LuckyDraw;
