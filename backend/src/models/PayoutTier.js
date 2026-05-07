const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PayoutTier = sequelize.define('PayoutTier', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  payout_method_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount_text: {
    type: DataTypes.STRING, // e.g. "₹50", "$10"
    allowNull: false
  },
  coins_required: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  }
}, {
  tableName: 'payout_tiers',
  timestamps: true,
  underscored: true
});

module.exports = PayoutTier;
