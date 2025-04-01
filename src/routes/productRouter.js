const express = require("express");
const router = express.Router();


// เส้นทางแสดงรายการสินค้า
router.get("/productList", (req, res) => {
    res.render("products/productList");  // ใช้ไฟล์ productList.ejs
  });


module.exports = router;
