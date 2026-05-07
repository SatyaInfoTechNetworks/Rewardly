const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Referral = sequelize.define('Referral', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  referrer_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  referred_user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'qualified', 'rewarded', 'rejected', 'fraud'),
    defaultValue: 'pending'
  },
  reward_given: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  completed_at: {
    type: DataTypes.DATE
  },
  ip_address: { type: DataTypes.STRING },
  device_id: { type: DataTypes.STRING }
}, {
  tableName: 'referrals',
  timestamps: true,
  underscored: true
});

module.exports = Referral;
