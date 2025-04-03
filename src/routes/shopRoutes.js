const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shopController");


// หน้าแสดงหมวดหมู่ทั้งหมด
router.get("/", shopController.showCategories);

// หน้าแสดงสินค้าทั้งหมด
router.get("/products", shopController.showAllProducts);

// หน้าแสดงสินค้าในหมวดหมู่ที่เลือก
router.get("/category/:categoryId", shopController.showProductsByCategory);

// หน้าแสดงรายละเอียดสินค้า
router.get("/product/:productId", shopController.showProductDetails);

module.exports = router;