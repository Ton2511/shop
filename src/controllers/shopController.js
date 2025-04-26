// controllers/shopController.js
const { Category, Product, ProductImage } = require('../models');
const { Op } = require('sequelize');

// หน้าแสดงหมวดหมู่ทั้งหมดสำหรับลูกค้า
exports.showCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.render("shop/categories", { 
      categories,
      title: "หมวดหมู่สินค้า"
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่:", err);
    res.redirect("/");
  }
};

// หน้าแสดงสินค้าในหมวดหมู่ที่เลือก
exports.showProductsByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    
    const category = await Category.findByPk(categoryId);
    
    if (!category) {
      console.error("ไม่พบหมวดหมู่ที่ระบุ");
      return res.redirect("/shop");
    }
    
    const products = await Product.findAll({
      where: { categoryId },
      include: [{ model: ProductImage, as: 'images' }]
    });
    
    res.render("shop/products", { 
      category, 
      products,
      title: `สินค้าในหมวดหมู่ ${category.name}`
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า:", err);
    res.redirect("/shop");
  }
};

// หน้าแสดงรายละเอียดสินค้า
exports.showProductDetails = async (req, res) => {
  try {
    const productId = req.params.productId;
    
    const product = await Product.findByPk(productId, {
      include: [
        { model: Category, as: 'category' },
        { model: ProductImage, as: 'images' }
      ]
    });
    
    if (!product) {
      console.error("ไม่พบสินค้าที่ระบุ");
      return res.redirect("/shop");
    }
    
    // เพิ่มยอดเข้าชมจริง
    await incrementRealViews(productId);
    
    // สุ่มเพิ่มยอดเข้าชมปลอม
    await incrementFakeViews(productId);
    
    // ดึงข้อมูลสินค้าอีกครั้งหลังจากอัพเดทยอดเข้าชม
    const updatedProduct = await Product.findByPk(productId, {
      include: [
        { model: Category, as: 'category' },
        { model: ProductImage, as: 'images' }
      ]
    });
    
    // ดึงสินค้าที่เกี่ยวข้องอื่นๆ ในหมวดหมู่เดียวกัน (สูงสุด 4 รายการ)
    const relatedProducts = await Product.findAll({
      where: {
        categoryId: updatedProduct.categoryId,
        id: { [Op.ne]: productId } // ไม่รวมสินค้าปัจจุบัน
      },
      include: [{ model: ProductImage, as: 'images' }],
      limit: 4
    });
    
    res.render("shop/product-details", { 
      product: updatedProduct,
      relatedProducts,
      title: updatedProduct.name,
      displayViews: updatedProduct.fakeViews // ส่งยอดเข้าชมปลอมไปแสดงผล
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า:", err);
    res.redirect("/shop");
  }
};

// แสดงสินค้าทั้งหมด (ไม่แยกหมวดหมู่)
exports.showAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        { model: Category, as: 'category' },
        { model: ProductImage, as: 'images' }
      ]
    });
    
    res.render("shop/all-products", { 
      products,
      title: "สินค้าทั้งหมด"
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า:", err);
    res.redirect("/shop");
  }
};

// ฟังก์ชันเพิ่มยอดเข้าชมจริง
const incrementRealViews = async (productId) => {
  try {
    await Product.increment('realViews', { by: 1, where: { id: productId } });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการอัพเดทยอดเข้าชมจริง:", err);
  }
};

// ฟังก์ชันเพิ่มยอดเข้าชมปลอม (สุ่ม 5-11)
const incrementFakeViews = async (productId) => {
  try {
    // สุ่มตัวเลขระหว่าง 5-11
    const randomIncrement = Math.floor(Math.random() * 7) + 5;
    
    await Product.increment('fakeViews', { 
      by: randomIncrement, 
      where: { id: productId } 
    });
    
    console.log(`เพิ่มยอดเข้าชมปลอม +${randomIncrement} สำหรับสินค้า ${productId}`);
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการอัพเดทยอดเข้าชมปลอม:", err);
  }
};