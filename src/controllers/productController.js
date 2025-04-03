const mongoose = require('mongoose');
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");

// แสดงรายการสินค้าทั้งหมด
exports.listProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('category');
    res.render("products/list", { products });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า:", err);
    res.redirect("/");
  }
};

// แสดงรายการสินค้าตามหมวดหมู่
exports.listProductsByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    
    // เพิ่มการตรวจสอบเพื่อป้องกันความผิดพลาด
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      console.error("รูปแบบของ categoryId ไม่ถูกต้อง:", categoryId);
      return res.redirect("/categories");
    }
    
    const category = await Category.findById(categoryId);
    
    if (!category) {
      console.error("ไม่พบหมวดหมู่ที่ระบุ");
      return res.redirect("/categories");
    }
    
    const products = await Product.find({ category: categoryId });
    
    res.render("products/categoryProducts", { 
      category, 
      products,
      categoryId
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้าตามหมวดหมู่:", err);
    res.redirect("/categories");
  }
};

// แสดงฟอร์มเพิ่มสินค้า
exports.showNewProductForm = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    let selectedCategory = null;
    
    // ถ้ามี categoryId ให้ดึงข้อมูลหมวดหมู่นั้นมา
    if (categoryId) {
      // ตรวจสอบว่า categoryId ถูกต้องหรือไม่
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        console.error("รูปแบบของ categoryId ไม่ถูกต้อง:", categoryId);
        return res.redirect("/categories");
      }
      
      selectedCategory = await Category.findById(categoryId);
      
      if (!selectedCategory) {
        console.error("ไม่พบหมวดหมู่ที่ระบุ");
        return res.redirect("/categories");
      }
      
      // ถ้ามีหมวดหมู่ ให้แสดงฟอร์มที่มีหมวดหมู่นั้นเลือกไว้แล้ว
      return res.render("products/new", { 
        selectedCategory,
        categoryId
      });
    }
    
    // กรณีไม่ได้ระบุหมวดหมู่ ให้ดึงรายการหมวดหมู่ทั้งหมดมาให้เลือก
    const categories = await Category.find();
    res.render("products/new", { 
      categories, 
      selectedCategory: null,
      categoryId: null
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่:", err);
    res.redirect("/products");
  }
};


// บันทึกสินค้าใหม่
exports.saveProduct = async (req, res) => {
  try {
    const { name, code, price, stock, description } = req.body;
    let categoryId = req.params.categoryId || req.body.category;
    
    // ตรวจสอบว่า categoryId ถูกต้องหรือไม่ (ถ้ามี)
    if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
      console.error("รูปแบบของ categoryId ไม่ถูกต้อง:", categoryId);
      return res.redirect("/products");
    }

    // สร้าง sku จาก code เพื่อป้องกันปัญหา sku: null
    const sku = code || Date.now().toString();
    
    // สร้างสินค้าใหม่
    const newProduct = await Product.create({
      name,
      code,
      sku, // เพิ่มฟิลด์ sku
      category: categoryId ? categoryId : null,
      price,
      stock: parseInt(stock),
      description
    });

    // อัพเดทหมวดหมู่ โดยเพิ่ม reference ไปยังสินค้า
    if (categoryId) {
      await Category.findByIdAndUpdate(
        categoryId,
        { $push: { products: newProduct._id } }
      );
    }

    if (req.params.categoryId) {
      res.redirect(`/products/category/${req.params.categoryId}`);
    } else {
      res.redirect("/products");
    }
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการบันทึกสินค้า:", err);
    res.redirect("/products");
  }
};

// แสดงฟอร์มแก้ไขสินค้า
exports.showEditProductForm = async (req, res) => {
  try {
    const productId = req.params.id;
    
    // ตรวจสอบว่า productId ถูกต้องหรือไม่
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.error("รูปแบบของ productId ไม่ถูกต้อง:", productId);
      return res.redirect("/products");
    }
    
    const product = await Product.findById(productId);
    
    if (!product) {
      console.error("ไม่พบสินค้าที่ระบุ");
      return res.redirect("/products");
    }
    
    const categories = await Category.find();
    res.render("products/edit", { product, categories });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า:", err);
    res.redirect("/products");
  }
};

// อัพเดทสินค้า
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    
    // ตรวจสอบว่า productId ถูกต้องหรือไม่
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.error("รูปแบบของ productId ไม่ถูกต้อง:", productId);
      return res.redirect("/products");
    }
    
    const { name, code, category, price, stock, description } = req.body;
    
    // ดึงข้อมูลสินค้าเดิมเพื่อตรวจสอบการเปลี่ยนแปลงหมวดหมู่
    const oldProduct = await Product.findById(productId);
    
    if (!oldProduct) {
      console.error("ไม่พบสินค้าที่ระบุ");
      return res.redirect("/products");
    }
    
    const oldCategoryId = oldProduct.category;
    
    // อัพเดทข้อมูลสินค้า
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        name,
        code,
        category,
        price,
        stock: parseInt(stock),
        description,
        updatedAt: Date.now()
      },
      { new: true }
    );

    // ถ้ามีการเปลี่ยนหมวดหมู่
    if (oldCategoryId && category && oldCategoryId.toString() !== category) {
      // ลบ reference จากหมวดหมู่เดิม
      await Category.findByIdAndUpdate(
        oldCategoryId,
        { $pull: { products: productId } }
      );
      
      // เพิ่ม reference ไปยังหมวดหมู่ใหม่
      await Category.findByIdAndUpdate(
        category,
        { $push: { products: productId } }
      );
    } else if (!oldCategoryId && category) {
      // ถ้าสินค้าไม่เคยมีหมวดหมู่แต่ตอนนี้มี
      await Category.findByIdAndUpdate(
        category,
        { $push: { products: productId } }
      );
    }

    res.redirect("/products");
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการอัพเดทสินค้า:", err);
    res.redirect("/products");
  }
};

// ลบสินค้า
exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    
    // ตรวจสอบว่า productId ถูกต้องหรือไม่
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.error("รูปแบบของ productId ไม่ถูกต้อง:", productId);
      return res.redirect("/products");
    }
    
    const product = await Product.findById(productId);
    
    if (!product) {
      console.error("ไม่พบสินค้าที่ระบุ");
      return res.redirect("/products");
    }
    
    // ถ้าสินค้ามีหมวดหมู่ ให้ลบ reference ออกจากหมวดหมู่ด้วย
    if (product.category) {
      await Category.findByIdAndUpdate(
        product.category,
        { $pull: { products: productId } }
      );
    }
    
    // ลบสินค้าจากฐานข้อมูล
    await Product.findByIdAndDelete(productId);
    
    // ถ้ามาจากหน้าหมวดหมู่ ให้กลับไปที่หน้าแสดงสินค้าในหมวดหมู่นั้น
    if (req.query.categoryId) {
      // ตรวจสอบว่า categoryId ถูกต้องหรือไม่
      if (!mongoose.Types.ObjectId.isValid(req.query.categoryId)) {
        console.error("รูปแบบของ categoryId ไม่ถูกต้อง:", req.query.categoryId);
        return res.redirect("/products");
      }
      res.redirect(`/products/category/${req.query.categoryId}`);
    } else {
      res.redirect("/products");
    }
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการลบสินค้า:", err);
    res.redirect("/products");
  }
};

// แสดงรายละเอียดสินค้า
exports.showProductDetails = async (req, res) => {
  try {
    const productId = req.params.id;
    
    // ตรวจสอบว่า productId ถูกต้องหรือไม่
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.error("รูปแบบของ productId ไม่ถูกต้อง:", productId);
      return res.redirect("/products");
    }
    
    const product = await Product.findById(productId).populate('category');
    
    if (!product) {
      console.error("ไม่พบสินค้าที่ระบุ");
      return res.redirect("/products");
    }
    
    res.render("products/details", { product });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า:", err);
    res.redirect("/products");
  }
};