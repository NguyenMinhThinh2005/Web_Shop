const express = require("express");
const customerAuthController = require("./customer.auth.controller.js");
const {
  authMiddleware,
  requireCustomer,
} = require("../../middlewares/auth.middleware.js");

const router = express.Router();

router.post("/register", customerAuthController.register);
router.post("/login", customerAuthController.login);
router.post(
  "/logout",
  authMiddleware,
  requireCustomer,
  customerAuthController.logout,
);
router.get("/me", authMiddleware, requireCustomer, customerAuthController.me);

module.exports = router;
