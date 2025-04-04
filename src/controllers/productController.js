const mongoose = require('mongoose');
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

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
    cb(null, uploadDir); // ใช้ uploadDir ที่กำหนดไว้
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // ตั้งชื่อไฟล์เป็น timestamp + นามสกุลไฟล์
  },
});

// สร้างตัวแปร upload สำหรับ multer
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // จำกัดขนาดไฟล์ 5MB
  fileFilter: (req, file, cb) => {
    // ตรวจสอบนามสกุลไฟล์
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

exports.listProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('category');
    res.render("products/list", { products });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า:", err);
    res.redirect("/");
  }
};

// แสดงรายละเอียดสินค้า (สำหรับผู้ดูแลระบบ)
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


// บันทึกสินค้าใหม่ (อัพเดทให้รองรับรูปภาพหลายรูป)
exports.saveProduct = [
  // รับอัพโหลดไฟล์สูงสุด 5 ไฟล์
  upload.array('images', 5),
  
  async (req, res) => {
    try {
      const { name, code, price, stock, description, fakeViews } = req.body;
      let categoryId = req.params.categoryId || req.body.category;
      
      // ตรวจสอบว่า categoryId ถูกต้องหรือไม่ (ถ้ามี)
      if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
        console.error("รูปแบบของ categoryId ไม่ถูกต้อง:", categoryId);
        return res.redirect("/products");
      }

      // สร้าง sku ที่ไม่ซ้ำกันโดยใช้รหัสสินค้า (code) รวมกับ timestamp
      const timestamp = Date.now();
      const sku = code ? `${code}-${timestamp.toString().slice(-6)}` : timestamp.toString();
      
      // จัดการรูปภาพ
      const images = [];
      if (req.files && req.files.length > 0) {
        req.files.forEach((file, index) => {
          images.push({
            url: `/uploads/products/${file.filename}`,
            isFeatured: index === 0, // รูปแรกเป็นรูปหลัก
            order: index,
            caption: ""
          });
        });
      }
      
      // กำหนดยอดเข้าชมปลอมเริ่มต้น (ถ้ามี)
      const initialFakeViews = fakeViews ? parseInt(fakeViews) : Math.floor(Math.random() * 100);
      
      // สร้างสินค้าใหม่
      const newProduct = await Product.create({
        name,
        code,
        sku,
        category: categoryId ? categoryId : null,
        price,
        stock: parseInt(stock),
        description,
        images,
        views: {
          real: 0,
          fake: initialFakeViews
        }
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
  }
];

// แสดงฟอร์มแก้ไขรูปภาพสินค้า
exports.showEditProductImagesForm = async (req, res) => {
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
    
    res.render("products/edit-images", { product });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า:", err);
    res.redirect("/products");
  }
};

// อัพเดทรูปภาพสินค้า
exports.updateProductImages = [
  // รับอัพโหลดไฟล์สูงสุด 5 ไฟล์
  upload.array('newImages', 5),
  
  async (req, res) => {
    try {
      const productId = req.params.id;
      const { deleteImages, featured, captions } = req.body;
      
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
      
      // ลบรูปภาพที่เลือก (ถ้ามี)
      let updatedImages = [...product.images];
      if (deleteImages && Array.isArray(deleteImages)) {
        // ดึงข้อมูลรูปภาพที่จะลบ
        const imagesToDelete = updatedImages.filter((img, idx) => deleteImages.includes(idx.toString()));
        
        // ลบไฟล์รูปภาพจากระบบไฟล์
        imagesToDelete.forEach(img => {
          const imagePath = path.join(__dirname, '../../public', img.url);
          if (fs.existsSync(imagePath)) {
            try {
              fs.unlinkSync(imagePath);
              console.log('Deleted image:', imagePath);
            } catch (err) {
              console.error('Error deleting image:', err);
            }
          } else {
            console.log('Image file not found:', imagePath);
          }
        });
        
        // อัพเดทอาร์เรย์รูปภาพ
        updatedImages = updatedImages.filter((img, idx) => !deleteImages.includes(idx.toString()));
      }
      
      // อัพเดทรูปภาพหลัก (ถ้ามี)
      if (featured && updatedImages.length > 0) {
        updatedImages = updatedImages.map((img, idx) => ({
          ...img,
          isFeatured: idx.toString() === featured
        }));
      }
      
      // อัพเดทคำอธิบายภาพ (ถ้ามี)
      if (captions && typeof captions === 'object') {
        Object.keys(captions).forEach(idx => {
          if (updatedImages[idx]) {
            updatedImages[idx].caption = captions[idx];
          }
        });
      }
      
      // เพิ่มรูปภาพใหม่ (ถ้ามี)
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map((file, index) => ({
          url: `/uploads/products/${file.filename}`,
          isFeatured: updatedImages.length === 0 && index === 0, // ถ้าไม่มีรูปเก่าเลย ให้รูปแรกเป็นรูปหลัก
          order: updatedImages.length + index,
          caption: ""
        }));
        
        updatedImages = [...updatedImages, ...newImages];
      }
      
      // อัพเดทข้อมูลสินค้า
      await Product.findByIdAndUpdate(productId, { 
        images: updatedImages,
        updatedAt: Date.now()
      });
      
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
    
    // ตรวจสอบว่า productId ถูกต้องหรือไม่
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.error("รูปแบบของ productId ไม่ถูกต้อง:", productId);
      return res.redirect("/products");
    }
    
    // อัพเดทยอดเข้าชม
    await Product.findByIdAndUpdate(productId, { 
      'views.fake': parseInt(fakeViews),
      updatedAt: Date.now()
    });
    
    res.redirect(`/products/details/${productId}`);
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการอัพเดทยอดเข้าชม:", err);
    res.redirect("/products");
  }
};

// ฟังก์ชันเพิ่มยอดเข้าชมจริงเมื่อมีการเข้าชมสินค้า (เรียกใช้จาก shopController)
exports.incrementProductViews = async (productId) => {
  try {
    // เพิ่มเฉพาะยอดเข้าชมจริง
    await Product.findByIdAndUpdate(productId, { 
      $inc: { 'views.real': 1 }
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการอัพเดทยอดเข้าชม:", err);
  }
};

exports.incrementFakeViews = async (productId) => {
  try {
    // สุ่มตัวเลขระหว่าง 5-11
    const randomIncrement = Math.floor(Math.random() * 7) + 5;
    
    await Product.findByIdAndUpdate(productId, { 
      $inc: { 'views.fake': randomIncrement }
    });
    
    return randomIncrement; // ส่งค่าจำนวนที่เพิ่มกลับไป
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

// แสดงรายการสินค้าตามหมวดหมู่
exports.listProductsByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    
    // ตรวจสอบว่า categoryId ถูกต้องหรือไม่
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
    const { name, code, category, price, stock, description } = req.body;
    
    // ตรวจสอบว่า productId ถูกต้องหรือไม่
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.error("รูปแบบของ productId ไม่ถูกต้อง:", productId);
      return res.redirect("/products");
    }
    
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

