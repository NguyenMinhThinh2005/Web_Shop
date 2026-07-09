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
router.post(
  "/shops/:shopId/products/import-json/validate",
  productController.validateProductImport,
);
router.post(
  "/shops/:shopId/products/import-json",
  productController.importProducts,
);
router.get("/products/:productId", productController.getProductById);
router.patch("/products/:productId", productController.updateProduct);
router.patch("/products/:productId/pin", productController.updateProductPin);
router.delete("/products/:productId", productController.deleteProduct);

module.exports = router;
