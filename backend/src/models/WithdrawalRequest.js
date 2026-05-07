const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WithdrawalRequest = sequelize.define('WithdrawalRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  payout_method_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  payout_tier_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount_text: {
    type: DataTypes.STRING,
    allowNull: false
  },
  coins_used: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  payout_details: {
    type: DataTypes.TEXT, // UPI ID, Email, Phone, etc.
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  admin_note: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'withdrawal_requests',
  timestamps: true,
  underscored: true
});

module.exports = WithdrawalRequest;
