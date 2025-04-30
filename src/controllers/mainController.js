// controllers/mainController.js
const { Category, Product, ProductImage } = require('../models');
const { Op, fn, literal } = require('sequelize');

// หน้าแรก - แสดงหมวดหมู่และสินค้าขายดี
exports.getHomePage = async (req, res) => {
  try {
    // ดึงข้อมูลหมวดหมู่ทั้งหมด
    const categories = await Category.findAll();

    // ดึงข้อมูลสินค้าขายดี (เรียงตาม fakeViews)
    const featuredProducts = await Product.findAll({
      include: [
        { model: Category, as: 'category' },
        { model: ProductImage, as: 'images' }
      ],
      order: [['fakeViews', 'DESC']],
      limit: 10
    });

    // ดึงข้อมูลสินค้าแบบสุ่ม 10 รายการ
    const randomProducts = await Product.findAll({
      include: [
        { model: Category, as: 'category' },
        { model: ProductImage, as: 'images' }
      ],
      order: [literal('RAND()')], // หรือ fn('RANDOM') สำหรับ PostgreSQL/SQLite
      limit: 10
    });

    res.render('index', { 
      categories,
      featuredProducts,
      randomProducts,
      title: 'หน้าหลัก | ร้านค้าออนไลน์'
    });
  } catch (err) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูลสำหรับหน้าแรก:', err);
    res.render('index', { 
      categories: [],
      featuredProducts: [],
      randomProducts: [],
      title: 'หน้าหลัก | ร้านค้าออนไลน์'
    });
  }
};
