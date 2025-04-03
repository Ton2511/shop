const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  sku: { type: String, sparse: true }, // เพิ่มฟิลด์ sku ที่มี sparse index
  category: { type: Schema.Types.ObjectId, ref: 'Category' }, // เชื่อมโยงกับ Category
  price: { type: String },
  stock: { type: Number },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ลบ index ที่ซ้ำซ้อน (ถ้ามี)
// คุณต้องตรวจสอบใน MongoDB ว่ามี index ชื่อ sku_1 หรือไม่ แล้วลบออก

const Product = mongoose.model('Product', productSchema);

module.exports = Product;