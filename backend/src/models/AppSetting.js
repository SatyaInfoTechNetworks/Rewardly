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
  },
  pubscale_app_id: {
    type: DataTypes.STRING,
    defaultValue: '26048184'
  },
  pubscale_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  opinion_universe_url: {
    type: DataTypes.TEXT,
    defaultValue: 'https://opinionuniverse.com/offerwall?pubId=1863&app_id=ID_eb1f5bea3e8caadcfcf6ccb5d35a1d1d'
  },
  opinion_universe_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  pubscale_sandbox: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  adsgram_checkin_block_id: {
    type: DataTypes.STRING,
    defaultValue: '30393'  // Dedicated AdsGram block for daily streak check-in
  },
  adsgram_draw_block_id: {
    type: DataTypes.STRING,
    defaultValue: '30393'  // Dedicated AdsGram block for lucky draws & contests
  }
}, {
  tableName: 'app_settings',
  timestamps: true,
  underscored: true
});

module.exports = AppSetting;
