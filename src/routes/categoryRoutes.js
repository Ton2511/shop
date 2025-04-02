const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");

// เส้นทางการแสดงรายการหมวดหมู่
router.get("/", categoryController.listCategories);

// เส้นทางแสดงฟอร์มเพิ่มหมวดหมู่
router.get("/new", categoryController.showNewCategoryForm);

// เส้นทางบันทึกหมวดหมู่ใหม่
router.post("/new", categoryController.saveCategory);

// เส้นทางแสดงฟอร์มแก้ไขหมวดหมู่
router.get("/edit/:id", categoryController.showEditCategoryForm);

// เส้นทางอัปเดตหมวดหมู่
router.post("/edit/:id", categoryController.updateCategory);

// เส้นทางลบหมวดหมู่
router.post("/delete/:id", categoryController.deleteCategory);

router.get("/", categoryController.getCategoriesForIndex);


module.exports = router;
