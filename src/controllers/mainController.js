const Category = require('../models/categoryModel');
const Product = require('../models/productModel');

// หน้าแรก - แสดงหมวดหมู่และสินค้าขายดี
exports.getHomePage = async (req, res) => {
  try {
    // ดึงข้อมูลหมวดหมู่ทั้งหมด
    const categories = await Category.find();
    
    // ดึงข้อมูลสินค้าที่เป็นสินค้าขายดี (ใช้สินค้าที่มียอดเข้าชมสูงสุดแทน) - จำกัด 5 รายการ
    const featuredProducts = await Product.find()
      .populate('category')
      .sort({ 'views.fake': -1 }) // เรียงตามยอดเข้าชมปลอมจากมากไปน้อย
      .limit(5); // จำกัดผลลัพธ์แค่ 5 รายการ
    
    res.render('index', { 
      categories,
      featuredProducts,
      title: 'หน้าหลัก | ร้านค้าออนไลน์'
    });
  } catch (err) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูลสำหรับหน้าแรก:', err);
    res.render('index', { 
      categories: [],
      featuredProducts: [],
      title: 'หน้าหลัก | ร้านค้าออนไลน์'
    });
  }
};