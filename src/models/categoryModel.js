// models/categoryModel.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  name: { type: String, required: true },
  image: { type: String },
  products: [{ type: Schema.Types.ObjectId, ref: 'Product' }] // เพิ่มฟิลด์ products ที่เชื่อมโยงกับ Product
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
