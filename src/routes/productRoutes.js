const express = require("express");
const router = express.Router();


const productController = require("../controllers/productController");
  
router.get("/", productController.listProducts);
router.get("/new", productController.showProductForm);
router.post("/new", productController.saveProduct);
router.get("/edit/:id", productController.editProductForm);
router.post("/edit/:id", productController.updateProduct);
router.post("/delete/:id", productController.deleteProduct);

module.exports = router;
