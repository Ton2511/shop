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
  sku: { type: String }, // ลบ sparse: true เพื่อให้ไม่ใช้เป็น unique index
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

// ลบการสร้าง index ที่มีปัญหา
// productSchema.index({ sku: 1 }, { unique: true, sparse: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;