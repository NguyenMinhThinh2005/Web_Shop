const express = require("express");
const shopController = require("./shop.controller.js");

const router = express.Router();

router.get("/:slug", shopController.getPublicShopBySlug);

module.exports = router;
