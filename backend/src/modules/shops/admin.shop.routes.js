const express = require("express");
const shopController = require("./shop.controller");
const {
  authMiddleware,
  requireAdmin,
} = require("../../middlewares/auth.middleware.js");

const router = express.Router();

router.use(authMiddleware, requireAdmin);

router.get("/", shopController.listShops);
router.post("/", shopController.createShop);
router.get("/:shopId", shopController.getShopById);
router.patch("/:shopId", shopController.updateShop);
router.delete("/:shopId", shopController.deleteShop);

module.exports = router;
