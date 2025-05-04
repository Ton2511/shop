// models/User.js - โมเดลผู้ใช้
const { sequelize } = require('../../db');
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    // Remove unique constraint from model definition
    // We'll handle this manually if needed
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'users',
  timestamps: true,
  // Add this option to prevent Sequelize from auto-creating indexes
  indexes: [] // Explicitly define no automatic indexes
});

// Hook สำหรับเข้ารหัสรหัสผ่านก่อนบันทึก
User.beforeCreate(async (user) => {
  user.password = await bcrypt.hash(user.password, 10);
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

// เพิ่มเมธอด instance สำหรับเปรียบเทียบรหัสผ่าน
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;