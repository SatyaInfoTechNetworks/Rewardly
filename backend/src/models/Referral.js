const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Referral = sequelize.define('Referral', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  referrer_user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'referrer_id'
  },
  referred_user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'validated', 'rejected', 'fraud'),
    defaultValue: 'pending'
  },
  is_valid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'reward_given'
  },
  validated_at: {
    type: DataTypes.DATE,
    field: 'completed_at'
  },
  ip_address: { type: DataTypes.STRING },
  device_id: { type: DataTypes.STRING }
}, {
  tableName: 'referrals',
  timestamps: true,
  underscored: true
});

module.exports = Referral;
