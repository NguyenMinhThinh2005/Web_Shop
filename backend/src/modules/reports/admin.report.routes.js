const express = require("express");
const reportController = require("./report.controller.js");
const {
  authMiddleware,
  requireAdmin,
} = require("../../middlewares/auth.middleware.js");

const router = express.Router();

router.use(authMiddleware, requireAdmin);

router.get("/overview", reportController.getOverview);

module.exports = router;
