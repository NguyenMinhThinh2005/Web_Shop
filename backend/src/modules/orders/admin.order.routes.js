const express = require("express");
const orderController = require("./order.controller.js");
const {
  authMiddleware,
  requireAdmin,
} = require("../../middlewares/auth.middleware.js");

const router = express.Router();

router.use(authMiddleware, requireAdmin);

router.get("/", orderController.listOrders);
router.post("/:orderId/sync-sheet", orderController.syncOrderToSheet);
router.get("/:orderId", orderController.getOrderById);
router.patch("/:orderId/status", orderController.updateOrderStatus);
router.patch("/:orderId/shipping", orderController.updateOrderShipping);
router.patch("/:orderId/handoff", orderController.updateOrderHandoff);
router.patch("/:orderId/commission", orderController.updateOrderCommission);
router.patch("/:orderId/internal-note", orderController.updateOrderInternalNote);

module.exports = router;
