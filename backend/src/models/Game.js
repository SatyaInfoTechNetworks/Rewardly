const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Game = sequelize.define('Game', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING, // e.g., 'canvas_2d', 'html5'
    defaultValue: 'canvas_2d'
  },
  thumbnail_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  config: {
    type: DataTypes.JSON, // For game-specific settings like gravity, speed
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'maintenance', 'disabled'),
    defaultValue: 'active'
  }
}, {
  tableName: 'games',
  timestamps: true,
  underscored: true
});

module.exports = Game;
