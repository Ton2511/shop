// models/productImageModel.js - โมเดลรูปภาพสินค้า
const { sequelize } = require('../../db');
const { DataTypes } = require('sequelize');

const ProductImage = sequelize.define('ProductImage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  caption: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'product_images',
  timestamps: true
});

module.exports = ProductImage;