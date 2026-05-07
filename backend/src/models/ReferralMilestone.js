const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReferralMilestone = sequelize.define('ReferralMilestone', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  required_referrals: { type: DataTypes.INTEGER, allowNull: false },
  reward_coins: { type: DataTypes.INTEGER, allowNull: false },
  icon: { type: DataTypes.STRING, defaultValue: 'Gift' },
  status: { type: DataTypes.STRING, defaultValue: 'active' },
  sort_order: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
  tableName: 'referral_milestones',
  timestamps: true,
  underscored: true
});

module.exports = ReferralMilestone;
