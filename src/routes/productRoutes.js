const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// ให้ตั้งค่า routes ที่มี pattern ตายตัวก่อน routes ที่มี parameter
// 1. routes ทั่วไป
router.get("/", productController.listProducts);
router.get("/new", productController.showNewProductForm);
router.post("/new", productController.saveProduct);

// 2. routes สำหรับดูสินค้าตามหมวดหมู่
router.get("/category/:categoryId", productController.listProductsByCategory);

// 3. routes สำหรับเพิ่มสินค้าในหมวดหมู่
router.get("/addto/:categoryId", productController.showNewProductForm);
router.post("/addto/:categoryId", productController.saveProduct);

// 4. routes สำหรับจัดการสินค้ารายการเดียว (ต้องอยู่หลังพวกที่มี /something/:parameter เพื่อป้องกันการ match ผิด)
router.get("/details/:id", productController.showProductDetails);
router.get("/edit/:id", productController.showEditProductForm);
router.post("/edit/:id", productController.updateProduct);
router.post("/delete/:id", productController.deleteProduct);

module.exports = router;