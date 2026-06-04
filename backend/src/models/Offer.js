const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Offer = sequelize.define('Offer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  external_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  icon_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tracking_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  total_reward: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  actual_price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  likes_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_hot: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'online'
  },
  input_type: {
    type: DataTypes.STRING,
    allowNull: true
  },
  input_instruction: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reward_type: {
    type: DataTypes.STRING,
    defaultValue: 'Multi Reward'
  },
  extra_label: {
    type: DataTypes.STRING,
    allowNull: true
  },
  estimated_time: {
    type: DataTypes.STRING,
    allowNull: true
  },
  difficulty: {
    type: DataTypes.STRING,
    defaultValue: 'Medium'
  },
  daily_completion_cap: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  country_targeting: {
    type: DataTypes.STRING,
    defaultValue: 'IN'
  }
}, {
  tableName: 'offers',
  timestamps: true,
  underscored: true
});

module.exports = Offer;
