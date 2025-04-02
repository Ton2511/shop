const express = require("express");
const router = express.Router();


// เส้นทางแสดงรายการสินค้า
router.get("/categorylist", (req, res) => {
    res.render("manage/categorylist");
  });

  router.get("/categorynew", (req, res) => {
    res.render("manage/categorynew");
  });


module.exports = router;