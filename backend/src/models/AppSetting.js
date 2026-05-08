const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AppSetting = sequelize.define('AppSetting', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  game_reward_coins: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  game_limit_per_day: {
    type: DataTypes.INTEGER,
    defaultValue: 20
  },
  adsgram_block_id: {
    type: DataTypes.STRING,
    defaultValue: '4376'
  },
  monetag_zone_id: {
    type: DataTypes.STRING,
    defaultValue: '10977311'
  },
  adsgram_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  monetag_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  onboarding_verification_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'app_settings',
  timestamps: true,
  underscored: true
});

module.exports = AppSetting;
