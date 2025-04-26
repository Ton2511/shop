// controllers/mainController.js
const { Category, Product, ProductImage } = require('../models');
const { Op } = require('sequelize');

// หน้าแรก - แสดงหมวดหมู่และสินค้าขายดี
exports.getHomePage = async (req, res) => {
  try {
    // ดึงข้อมูลหมวดหมู่ทั้งหมด
    const categories = await Category.findAll();
    
    // ดึงข้อมูลสินค้าที่เป็นสินค้าขายดี (ใช้สินค้าที่มียอดเข้าชมสูงสุดแทน) - จำกัด 5 รายการ
    const featuredProducts = await Product.findAll({
      include: [
        { model: Category, as: 'category' },
        { model: ProductImage, as: 'images' }
      ],
      order: [['fakeViews', 'DESC']], // เรียงตามยอดเข้าชมปลอมจากมากไปน้อย
      limit: 5 // จำกัดผลลัพธ์แค่ 5 รายการ
    });
    
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