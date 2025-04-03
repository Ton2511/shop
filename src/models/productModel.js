const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// สร้าง Schema สำหรับรูปภาพสินค้า
const productImageSchema = new Schema({
  url: { type: String, required: true },
  isFeatured: { type: Boolean, default: false }, // รูปภาพหลักหรือไม่
  order: { type: Number, default: 0 }, // ลำดับการแสดงผล
  caption: { type: String } // คำอธิบายภาพ (ถ้ามี)
});

const productSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  sku: { type: String, sparse: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category' }, // เชื่อมโยงกับ Category
  price: { type: String },
  stock: { type: Number, default: 0 },
  description: { type: String },
  
  // เพิ่มฟิลด์สำหรับรูปภาพหลายรูป
  images: [productImageSchema],
  
  // เพิ่มฟิลด์สำหรับยอดการเข้าชม
  views: {
    real: { type: Number, default: 0 }, // ยอดการเข้าชมจริง
    fake: { type: Number, default: 0 }  // ยอดการเข้าชมที่แสดงผลกับลูกค้า
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ลบ index ที่ซ้ำซ้อน (ถ้ามี)
// คุณต้องตรวจสอบใน MongoDB ว่ามี index ชื่อ sku_1 หรือไม่ แล้วลบออก

const Product = mongoose.model('Product', productSchema);

module.exports = Product;