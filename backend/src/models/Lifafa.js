const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Lifafa = sequelize.define('Lifafa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  reward_coins: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  max_uses: {
    type: DataTypes.INTEGER,
    defaultValue: -1 // -1 means unlimited
  },
  current_uses: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active' // 'active', 'inactive'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'lifafas',
  timestamps: true,
  underscored: true
});

module.exports = Lifafa;
