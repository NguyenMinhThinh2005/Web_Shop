const express = require("express");
const productController = require("./product.controller.js");

const router = express.Router();

router.get("/:slug/products", productController.listPublicProducts);
router.get("/:slug/products/:productSlug", productController.getPublicProductBySlug);

module.exports = router;
