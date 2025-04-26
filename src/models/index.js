// models/index.js - เป็นจุดรวมสำหรับโมเดลทั้งหมด
const { sequelize } = require('../../db');
const { DataTypes } = require('sequelize');

// นำเข้าโมเดล
const User = require('./User');
const Category = require('./categoryModel');
const Product = require('./productModel');
const ProductImage = require('./productImageModel');

// กำหนดความสัมพันธ์ระหว่างโมเดล
// One-to-Many: Category - Product
Category.hasMany(Product, { 
  foreignKey: 'categoryId',
  as: 'products'
});
Product.belongsTo(Category, { 
  foreignKey: 'categoryId',
  as: 'category'
});

// One-to-Many: Product - ProductImage
Product.hasMany(ProductImage, {
  foreignKey: 'productId',
  as: 'images'
});
ProductImage.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product'
});

// ส่งออกโมเดลทั้งหมด
module.exports = {
  sequelize,
  User,
  Category,
  Product,
  ProductImage,
};