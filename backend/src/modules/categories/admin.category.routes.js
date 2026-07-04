const express = require("express");
const categoryController = require("./category.controller.js");
const {
  authMiddleware,
  requireAdmin,
} = require("../../middlewares/auth.middleware.js");

const router = express.Router();

router.use(authMiddleware, requireAdmin);

router.get("/shops/:shopId/categories", categoryController.listAdminCategories);
router.post("/shops/:shopId/categories", categoryController.createCategory);
router.get("/categories/:categoryId", categoryController.getCategoryById);
router.patch("/categories/:categoryId", categoryController.updateCategory);
router.delete("/categories/:categoryId", categoryController.deleteCategory);

module.exports = router;
