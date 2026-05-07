const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PayoutMethod = sequelize.define('PayoutMethod', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  logo_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  conversion_rate: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "₹1 = 100 Coins"
  },
  fee_text: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "0% Fees"
  },
  disclaimer: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  custom_inputs: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active' // active, disabled
  },
  order_index: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'payout_methods',
  timestamps: true,
  underscored: true
});

module.exports = PayoutMethod;
