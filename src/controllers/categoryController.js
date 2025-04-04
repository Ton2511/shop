//controllers/categoryController.js
const mongoose = require('mongoose'); // เพิ่มการอิมพอร์ต mongoose
const Category = require("../models/categoryModel");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// ตรวจสอบและสร้างโฟลเดอร์ uploads ถ้ายังไม่มี
const uploadsDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

// ตั้งค่า storage สำหรับ multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/"); // ตั้งค่าให้เก็บไฟล์ในโฟลเดอร์ uploads
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

// แสดงรายการหมวดหมู่
exports.listCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.render("categories/list", { categories });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่:", err);
    res.redirect("/");
  }
};

exports.getCategoriesForIndex = async (req, res) => {
  try {
    const categories = await Category.find(); // ดึงข้อมูลหมวดหมู่จากฐานข้อมูล
    res.render("index", { categories }); // ส่งข้อมูล categories ไปยัง view (index.ejs)
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่:", err);
    res.redirect("/");  // ถ้าเกิดข้อผิดพลาดให้ redirect ไปหน้าแรก
  }
};

// แสดงฟอร์มเพิ่มหมวดหมู่
exports.showNewCategoryForm = (req, res) => {
  res.render("categories/new");
};

// บันทึกหมวดหมู่พร้อมอัปโหลดภาพ
exports.saveCategory = [
  upload.single("image"), // Middleware สำหรับอัปโหลดไฟล์
  async (req, res) => {
    try {
      const { name } = req.body;
      const image = req.file ? `/uploads/${req.file.filename}` : ""; // เก็บ path ของไฟล์ภาพ
      await Category.create({ name, image });
      res.redirect("/categories");
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการบันทึกหมวดหมู่:", err);
      res.redirect("/categories");
    }
  },
];

// แสดงฟอร์มแก้ไขหมวดหมู่
exports.showEditCategoryForm = async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    // ตรวจสอบความถูกต้องของ ID
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      console.error("รูปแบบของ categoryId ไม่ถูกต้อง:", categoryId);
      return res.redirect("/categories");
    }
    
    const category = await Category.findById(categoryId);
    
    // ตรวจสอบว่าพบหมวดหมู่หรือไม่
    if (!category) {
      console.error("ไม่พบหมวดหมู่ที่ระบุ");
      return res.redirect("/categories");
    }
    
    res.render("categories/edit", { category });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่:", err);
    res.redirect("/categories");
  }
};

// อัปเดตหมวดหมู่พร้อมอัปโหลดภาพ
exports.updateCategory = [
  upload.single("image"),
  async (req, res) => {
    try {
      const categoryId = req.params.id;
      
      // ตรวจสอบความถูกต้องของ ID
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        console.error("รูปแบบของ categoryId ไม่ถูกต้อง:", categoryId);
        return res.redirect("/categories");
      }
      
      const { name, removeImage } = req.body;
      const category = await Category.findById(categoryId);
      
      // ตรวจสอบว่าพบหมวดหมู่หรือไม่
      if (!category) {
        console.error("ไม่พบหมวดหมู่ที่ระบุ");
        return res.redirect("/categories");
      }
      
      const updateData = { name };
      
      // จัดการรูปภาพ
      const oldImage = category.image;
      
      // กรณีต้องการลบรูปภาพเดิม
      if (removeImage === 'yes') {
        updateData.image = '';
        
        // ลบไฟล์รูปภาพเดิม (ถ้ามี)
        if (oldImage) {
          const imagePath = path.join(__dirname, '../../public', oldImage);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log('Old image deleted:', imagePath);
          }
        }
      }
      // กรณีอัพโหลดรูปภาพใหม่
      else if (req.file) {
        updateData.image = `/uploads/${req.file.filename}`;
        
        // ลบไฟล์รูปภาพเดิม (ถ้ามี)
        if (oldImage) {
          const imagePath = path.join(__dirname, '../../public', oldImage);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log('Old image replaced:', imagePath);
          }
        }
      }
      
      // อัพเดทข้อมูลหมวดหมู่
      await Category.findByIdAndUpdate(categoryId, updateData);
      
      res.redirect("/categories");
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการอัพเดทหมวดหมู่:", err);
      res.redirect("/categories");
    }
  },
];

// ลบหมวดหมู่
exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    // ตรวจสอบความถูกต้องของ ID
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      console.error("รูปแบบของ categoryId ไม่ถูกต้อง:", categoryId);
      return res.redirect("/categories");
    }
    
    const category = await Category.findById(categoryId);
    
    // ตรวจสอบว่าพบหมวดหมู่หรือไม่
    if (!category) {
      console.error("ไม่พบหมวดหมู่ที่ระบุ");
      return res.redirect("/categories");
    }
    
    // ตรวจสอบว่า category มีภาพหรือไม่
    if (category.image) {
      // กำหนดเส้นทางที่เก็บไฟล์ภาพในโฟลเดอร์ public
      const imagePath = path.join(__dirname, '../../public', category.image);
      
      // ตรวจสอบว่าไฟล์มีอยู่จริงหรือไม่ก่อนลบ
      if (fs.existsSync(imagePath)) {
        // ลบไฟล์ภาพจากระบบไฟล์
        fs.unlinkSync(imagePath);
        console.log("ไฟล์ภาพถูกลบเรียบร้อยแล้ว:", imagePath);
      } else {
        console.log("ไม่พบไฟล์ภาพที่ต้องการลบ:", imagePath);
      }
    }
    
    // ลบหมวดหมู่จากฐานข้อมูล
    await Category.findByIdAndDelete(categoryId);
    res.redirect("/categories");
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการลบหมวดหมู่:", err);
    res.redirect("/categories");
  }
};