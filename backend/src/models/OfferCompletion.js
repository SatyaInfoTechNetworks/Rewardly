const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OfferCompletion = sequelize.define('OfferCompletion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  offer_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  click_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reward_coins: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'offer_completions',
  timestamps: true,
  underscored: true
});

module.exports = OfferCompletion;
