const express = require("express");
const customerOrderController = require("./customer.order.controller.js");
const {
  authMiddleware,
  requireCustomer,
} = require("../../middlewares/auth.middleware.js");

const router = express.Router();

router.use(authMiddleware, requireCustomer);

router.get("/", customerOrderController.listOrders);
router.post("/claim", customerOrderController.claimOrder);
router.get("/:orderId", customerOrderController.getOrderById);

module.exports = router;
