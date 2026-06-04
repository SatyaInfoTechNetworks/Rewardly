const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OfferTier = sequelize.define('OfferTier', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  offer_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tier_title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  app_tier_title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reward: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  steps: {
    type: DataTypes.JSON,
    allowNull: true
  },
  sequence: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'ACTIVE'
  }
}, {
  tableName: 'offer_tiers',
  timestamps: true,
  underscored: true
});

module.exports = OfferTier;
