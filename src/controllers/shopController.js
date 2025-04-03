const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const mongoose = require('mongoose');
const productController = require('./productController'); // นำเข้า productController เพื่อใช้ฟังก์ชัน incrementProductViews

// หน้าแสดงหมวดหมู่ทั้งหมดสำหรับลูกค้า
exports.showCategories = async (req, res) => {
  try {
    const categories = await Category.find();
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
    
    // ตรวจสอบว่า categoryId ถูกต้องหรือไม่
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      console.error("รูปแบบของ categoryId ไม่ถูกต้อง:", categoryId);
      return res.redirect("/shop");
    }
    
    const category = await Category.findById(categoryId);
    
    if (!category) {
      console.error("ไม่พบหมวดหมู่ที่ระบุ");
      return res.redirect("/shop");
    }
    
    const products = await Product.find({ category: categoryId });
    
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
    
    // ตรวจสอบว่า productId ถูกต้องหรือไม่
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.error("รูปแบบของ productId ไม่ถูกต้อง:", productId);
      return res.redirect("/shop");
    }
    
    const product = await Product.findById(productId).populate('category');
    
    if (!product) {
      console.error("ไม่พบสินค้าที่ระบุ");
      return res.redirect("/shop");
    }
    
    // เพิ่มยอดเข้าชมจริง
    await productController.incrementProductViews(productId);
    
    // ดึงสินค้าที่เกี่ยวข้องอื่นๆ ในหมวดหมู่เดียวกัน (สูงสุด 4 รายการ)
    const relatedProducts = await Product.find({
      category: product.category ? product.category._id : null,
      _id: { $ne: product._id } // ไม่รวมสินค้าปัจจุบัน
    }).limit(4);
    
    res.render("shop/product-details", { 
      product,
      relatedProducts,
      title: product.name,
      displayViews: product.views.fake // ส่งยอดเข้าชมปลอมไปแสดงผล
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า:", err);
    res.redirect("/shop");
  }
};

// แสดงสินค้าทั้งหมด (ไม่แยกหมวดหมู่)
exports.showAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('category');
    res.render("shop/all-products", { 
      products,
      title: "สินค้าทั้งหมด"
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า:", err);
    res.redirect("/shop");
  }
};