const express = require("express");
const productController = require("./product.controller.js");
const {
  authMiddleware,
  requireAdmin,
} = require("../../middlewares/auth.middleware.js");

const router = express.Router();

router.use(authMiddleware, requireAdmin);

router.get("/shops/:shopId/products", productController.listAdminProducts);
router.post("/shops/:shopId/products", productController.createProduct);
router.get("/products/:productId", productController.getProductById);
router.patch("/products/:productId", productController.updateProduct);
router.delete("/products/:productId", productController.deleteProduct);

module.exports = router;
