const Category = require("../models/categoryModel");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

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
const upload = multer({ storage: storage });

// แสดงรายการหมวดหมู่
exports.listCategories = async (req, res) => {
  const categories = await Category.find();
  res.render("categories/list", { categories });
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
    const { name } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : ""; // เก็บ path ของไฟล์ภาพ
    await Category.create({ name, image });
    res.redirect("/categories");
  },
];

// แสดงฟอร์มแก้ไขหมวดหมู่
exports.showEditCategoryForm = async (req, res) => {
  const category = await Category.findById(req.params.id);
  res.render("categories/edit", { category });
};

// อัปเดตหมวดหมู่พร้อมอัปโหลดภาพ
exports.updateCategory = [
  upload.single("image"),
  async (req, res) => {
    const { name } = req.body;
    const updateData = { name };

    // ถ้ามีไฟล์ใหม่ ให้บันทึก path ของไฟล์ใหม่
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    await Category.findByIdAndUpdate(req.params.id, updateData);
    res.redirect("/categories");
  },
];

// ลบหมวดหมู่
exports.deleteCategory = async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
  
      // ตรวจสอบว่า category มีภาพหรือไม่
      if (category.image) {
        // กำหนดเส้นทางที่เก็บไฟล์ภาพในโฟลเดอร์ public/uploads
        const imagePath = path.join(__dirname, "/uploads", category.image); // เส้นทางใหม่ที่ถูกต้อง
  
        // ตรวจสอบว่าไฟล์มีอยู่จริงหรือไม่ก่อนลบ
        if (fs.existsSync(imagePath)) {
          // ลบไฟล์ภาพจากระบบไฟล์
          fs.unlink(imagePath, (err) => {
            if (err) {
              console.error("ไม่สามารถลบไฟล์ภาพได้:", err);
            } else {
              console.log("ไฟล์ภาพถูกลบเรียบร้อยแล้ว");
            }
          });
        } else {
          console.log("ไม่พบไฟล์ภาพที่ต้องการลบ:", imagePath);
        }
      }
  
      // ลบหมวดหมู่จากฐานข้อมูล
      await Category.findByIdAndDelete(req.params.id);
      res.redirect("/categories");
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการลบหมวดหมู่:", err);
      res.redirect("/categories");
    }
  };
