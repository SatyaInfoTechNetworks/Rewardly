const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GameSession = sequelize.define('GameSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  game_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  contest_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  duration: {
    type: DataTypes.INTEGER, // in seconds
    defaultValue: 0
  },
  is_valid: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  metadata: {
    type: DataTypes.JSON, // For tracking anti-cheat data, device info, etc.
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('started', 'completed', 'cancelled'),
    defaultValue: 'started'
  }
}, {
  tableName: 'game_sessions',
  timestamps: true,
  underscored: true
});

module.exports = GameSession;
