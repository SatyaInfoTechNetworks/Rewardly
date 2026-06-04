const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserOfferProgress = sequelize.define('UserOfferProgress', {
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
    unique: true,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('STARTED', 'COMPLETED'),
    defaultValue: 'STARTED'
  },
  completed_tiers: {
    type: DataTypes.JSON,
    allowNull: true
  },
  user_input: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  admin_status: {
    type: DataTypes.STRING,
    defaultValue: 'PENDING'
  },
  admin_remark: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'user_offer_progress',
  timestamps: true,
  underscored: true
});

module.exports = UserOfferProgress;
