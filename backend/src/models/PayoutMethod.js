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
  description: {
    type: DataTypes.STRING,
    allowNull: true
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
