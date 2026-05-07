const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReferralSetting = sequelize.define('ReferralSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  welcome_bonus: { type: DataTypes.INTEGER, defaultValue: 50 },
  referral_reward: { type: DataTypes.INTEGER, defaultValue: 300 },
  reward_trigger: { 
    type: DataTypes.ENUM('signup', 'earning', 'offer', 'redeem_request', 'redeem_approved'),
    defaultValue: 'redeem_approved'
  },
  min_earnings: { type: DataTypes.INTEGER, defaultValue: 500 },
  min_offers: { type: DataTypes.INTEGER, defaultValue: 3 },
  min_redeem_amount: { type: DataTypes.INTEGER, defaultValue: 10 },
  same_device_block: { type: DataTypes.BOOLEAN, defaultValue: true },
  vpn_detection: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'referral_settings',
  timestamps: true,
  underscored: true
});

module.exports = ReferralSetting;
