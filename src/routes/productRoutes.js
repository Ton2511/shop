const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// แสดงรายการสินค้าทั้งหมด
router.get("/", productController.listProducts);

// แสดงฟอร์มเพิ่มสินค้า - ย้ายมาไว้ก่อน route ที่มี parameter
router.get("/new", productController.showNewProductForm);

// บันทึกสินค้าใหม่ - ย้ายมาไว้ก่อน route ที่มี parameter
router.post("/new", productController.saveProduct);

// แสดงรายการสินค้าตามหมวดหมู่
router.get("/category/:categoryId", productController.listProductsByCategory);

// แสดงฟอร์มเพิ่มสินค้าในหมวดหมู่ที่กำหนด - เปลี่ยน pattern เป็น /category/:categoryId/new
router.get("/category/:categoryId/new", productController.showNewProductForm);

// บันทึกสินค้าใหม่ในหมวดหมู่ที่กำหนด - เปลี่ยน pattern เป็น /category/:categoryId/new
router.post("/category/:categoryId/new", productController.saveProduct);

// แสดงฟอร์มแก้ไขสินค้า
router.get("/edit/:id", productController.showEditProductForm);

// อัพเดทสินค้า
router.post("/edit/:id", productController.updateProduct);

// ลบสินค้า
router.post("/delete/:id", productController.deleteProduct);

// แสดงรายละเอียดสินค้า
router.get("/details/:id", productController.showProductDetails);

module.exports = router;