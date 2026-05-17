const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LifafaClaim = sequelize.define('LifafaClaim', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  lifafa_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  claimed_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'lifafa_claims',
  timestamps: true,
  underscored: true
});

module.exports = LifafaClaim;
