// controllers/productController.js
const { Product, Category, ProductImage } = require('../models');
const { Op } = require('sequelize');
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const uploadDir = path.join(__dirname, '../../public/uploads/products');
if (!fs.existsSync(path.join(__dirname, '../../public/uploads'))) {
  fs.mkdirSync(path.join(__dirname, '../../public/uploads'));
  console.log('Created uploads directory');
}
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log('Created products directory');
}

// ตั้งค่า storage สำหรับ multer (รูปภาพสินค้า)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// สร้างตัวแปร upload สำหรับ multer
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif|webp/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("รองรับเฉพาะไฟล์รูปภาพเท่านั้น"), false);
    }
  }
});

// แสดงรายการสินค้าทั้งหมด
exports.listProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        { model: Category, as: 'category' },
        { model: ProductImage, as: 'images' }
      ]
    });
    res.render("products/list", { products });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า:", err);
    res.redirect("/");
  }
};

// แสดงรายละเอียดสินค้า
exports.showProductDetails = async (req, res) => {
  try {
    const productId = req.params.id;
    
    const product = await Product.findByPk(productId, {
      include: [
        { model: Category, as: 'category' },
        { model: ProductImage, as: 'images' }
      ]
    });
    
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

// บันทึกสินค้าใหม่
exports.saveProduct = [
  upload.array('images', 5),
  
  async (req, res) => {
    try {
      const { name, code, price, stock, description, fakeViews } = req.body;
      let categoryId = req.params.categoryId || req.body.category;
      
      // สร้าง sku ที่ไม่ซ้ำกัน
      const timestamp = Date.now();
      const sku = code ? `${code}-${timestamp.toString().slice(-6)}` : timestamp.toString();
      
      // กำหนดยอดเข้าชมปลอมเริ่มต้น (ถ้ามี)
      const initialFakeViews = fakeViews ? parseInt(fakeViews) : Math.floor(Math.random() * 100);
      
      // สร้างสินค้าใหม่
      const newProduct = await Product.create({
        name,
        code,
        sku,
        categoryId: categoryId || null,
        price,
        stock: parseInt(stock) || 0,
        description,
        fakeViews: initialFakeViews,
        realViews: 0
      });

      // บันทึกรูปภาพ (ถ้ามี)
      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          await ProductImage.create({
            productId: newProduct.id,
            url: `/uploads/products/${req.files[i].filename}`,
            isFeatured: i === 0, // รูปแรกเป็นรูปหลัก
            order: i,
            caption: ""
          });
        }
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
  }
];

// แสดงฟอร์มแก้ไขรูปภาพสินค้า
exports.showEditProductImagesForm = async (req, res) => {
  try {
    const productId = req.params.id;
    
    const product = await Product.findByPk(productId, {
      include: [{ model: ProductImage, as: 'images' }]
    });
    
    if (!product) {
      console.error("ไม่พบสินค้าที่ระบุ");
      return res.redirect("/products");
    }
    
    res.render("products/edit-images", { product });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า:", err);
    res.redirect("/products");
  }
};

// อัพเดทรูปภาพสินค้า
exports.updateProductImages = [
  upload.array('newImages', 5),
  
  async (req, res) => {
    try {
      const productId = req.params.id;
      const { deleteImages, featured, captions } = req.body;
      
      const product = await Product.findByPk(productId, {
        include: [{ model: ProductImage, as: 'images' }]
      });
      
      if (!product) {
        console.error("ไม่พบสินค้าที่ระบุ");
        return res.redirect("/products");
      }
      
      // ลบรูปภาพที่เลือก (ถ้ามี)
      if (deleteImages && Array.isArray(deleteImages)) {
        for (const imageId of deleteImages) {
          const image = await ProductImage.findByPk(imageId);
          if (image) {
            // ลบไฟล์จากระบบไฟล์
            const imagePath = path.join(__dirname, '../../public', image.url);
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
              console.log('Deleted image:', imagePath);
            }
            // ลบจากฐานข้อมูล
            await image.destroy();
          }
        }
      }
      
      // อัพเดทรูปภาพหลัก (ถ้ามี)
      if (featured) {
        // เคลียร์ isFeatured ของรูปภาพทั้งหมด
        await ProductImage.update(
          { isFeatured: false },
          { where: { productId } }
        );
        
        // กำหนดรูปหลักใหม่
        await ProductImage.update(
          { isFeatured: true },
          { where: { id: featured } }
        );
      }
      
      // อัพเดทคำอธิบายภาพ (ถ้ามี)
      if (captions && typeof captions === 'object') {
        for (const [imageId, caption] of Object.entries(captions)) {
          await ProductImage.update(
            { caption },
            { where: { id: imageId } }
          );
        }
      }
      
      // เพิ่มรูปภาพใหม่ (ถ้ามี)
      const currentImagesCount = await ProductImage.count({ where: { productId } });
      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          await ProductImage.create({
            productId,
            url: `/uploads/products/${req.files[i].filename}`,
            isFeatured: currentImagesCount === 0 && i === 0, // ถ้าไม่มีรูปเก่าเลย ให้รูปแรกเป็นรูปหลัก
            order: currentImagesCount + i,
            caption: ""
          });
        }
      }
      
      res.redirect(`/products/details/${productId}`);
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการอัพเดทรูปภาพสินค้า:", err);
      res.redirect("/products");
    }
  }
];

// แสดงฟอร์มปรับแต่งยอดเข้าชม
exports.showManageViewsForm = async (req, res) => {
  try {
    const productId = req.params.id;
    
    const product = await Product.findByPk(productId);
    
    if (!product) {
      console.error("ไม่พบสินค้าที่ระบุ");
      return res.redirect("/products");
    }
    
    res.render("products/manage-views", { product });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า:", err);
    res.redirect("/products");
  }
};

// อัพเดทยอดเข้าชม
exports.updateProductViews = async (req, res) => {
  try {
    const productId = req.params.id;
    const { fakeViews } = req.body;
    
    await Product.update(
      { fakeViews: parseInt(fakeViews) },
      { where: { id: productId } }
    );
    
    res.redirect(`/products/details/${productId}`);
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการอัพเดทยอดเข้าชม:", err);
    res.redirect("/products");
  }
};

// ฟังก์ชันเพิ่มยอดเข้าชมจริง
exports.incrementProductViews = async (productId) => {
  try {
    await Product.increment('realViews', { by: 1, where: { id: productId } });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการอัพเดทยอดเข้าชม:", err);
  }
};

// ฟังก์ชันเพิ่มยอดเข้าชมปลอม
exports.incrementFakeViews = async (productId) => {
  try {
    const randomIncrement = Math.floor(Math.random() * 7) + 5;
    
    await Product.increment('fakeViews', { 
      by: randomIncrement, 
      where: { id: productId } 
    });
    
    return randomIncrement;
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการอัพเดทยอดเข้าชมปลอม:", err);
    return 0;
  }
};

// แสดงฟอร์มเพิ่มสินค้า
exports.showNewProductForm = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    let selectedCategory = null;
    
    // ถ้ามี categoryId ให้ดึงข้อมูลหมวดหมู่นั้นมา
    if (categoryId) {
      selectedCategory = await Category.findByPk(categoryId);
      
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
    const categories = await Category.findAll();
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

// แสดงรายการสินค้าตามหมวดหมู่
exports.listProductsByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    
    const category = await Category.findByPk(categoryId);
    
    if (!category) {
      console.error("ไม่พบหมวดหมู่ที่ระบุ");
      return res.redirect("/categories");
    }
    
    const products = await Product.findAll({
      where: { categoryId },
      include: [{ model: ProductImage, as: 'images' }]
    });
    
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

// แสดงฟอร์มแก้ไขสินค้า
exports.showEditProductForm = async (req, res) => {
  try {
    const productId = req.params.id;
    
    const product = await Product.findByPk(productId);
    
    if (!product) {
      console.error("ไม่พบสินค้าที่ระบุ");
      return res.redirect("/products");
    }
    
    const categories = await Category.findAll();
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
    const { name, code, category, price, stock, description } = req.body;
    
    const product = await Product.findByPk(productId);
    
    if (!product) {
      console.error("ไม่พบสินค้าที่ระบุ");
      return res.redirect("/products");
    }
    
    // อัพเดทข้อมูลสินค้า
    await product.update({
      name,
      code,
      categoryId: category,
      price,
      stock: parseInt(stock) || 0,
      description
    });

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
    
    const product = await Product.findByPk(productId, {
      include: [{ model: ProductImage, as: 'images' }]
    });
    
    if (!product) {
      console.error("ไม่พบสินค้าที่ระบุ");
      return res.redirect("/products");
    }
    
    // ลบรูปภาพของสินค้า
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        // ลบไฟล์จากระบบไฟล์
        const imagePath = path.join(__dirname, '../../public', image.url);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log('Deleted image:', imagePath);
        }
      }
    }
    
    // ลบสินค้า (รูปภาพจะถูกลบอัตโนมัติด้วย cascade)
    await product.destroy();
    
    // ถ้ามาจากหน้าหมวดหมู่ ให้กลับไปที่หน้าแสดงสินค้าในหมวดหมู่นั้น
    if (req.query.categoryId) {
      res.redirect(`/products/category/${req.query.categoryId}`);
    } else {
      res.redirect("/products");
    }
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการลบสินค้า:", err);
    res.redirect("/products");
  }
};