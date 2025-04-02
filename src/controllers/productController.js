const Product = require("../models/productModel");
const Category = require("../models/categoryModel");


// แสดงรายการสินค้า
exports.listProducts = async (req, res) => {
  const products = await Product.find().populate("category");
  res.render("products/list", { products });
};

// แสดงฟอร์มเพิ่มสินค้า
exports.showProductForm = async (req, res) => {
  const categories = await Category.find();
  res.render("products/form", { product: {}, categories });
};

// บันทึกสินค้า
exports.saveProduct = async (req, res) => {
  const { name, code, category, price, stock, description } = req.body;
  await Product.create({ name, code, category, price, stock, description });
  res.redirect("/products");
};

// แสดงฟอร์มแก้ไขสินค้า
exports.editProductForm = async (req, res) => {
  const product = await Product.findById(req.params.id);
  const categories = await Category.find();
  res.render("products/form", { product, categories });
};

// อัปเดตสินค้า
exports.updateProduct = async (req, res) => {
  const { name, code, category, price, stock, description } = req.body;
  await Product.findByIdAndUpdate(req.params.id, { name, code, category, price, stock, description });
  res.redirect("/products");
};

// ลบสินค้า
exports.deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.redirect("/products");
};
