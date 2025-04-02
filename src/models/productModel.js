// models/productModel.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category' }, // เชื่อมโยงกับ Category
  price: { type: String },
  stock: { type: Number },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
