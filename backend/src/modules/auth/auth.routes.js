const express = require("express");
const authController = require("./auth.controller");
const {
  authMiddleware,
  requireAdmin,
} = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post("/login", authController.loginAdmin);

router.get("/me", authMiddleware, requireAdmin, authController.me);

module.exports = router;
