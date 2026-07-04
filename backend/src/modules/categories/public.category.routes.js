const express = require("express");
const categoryController = require("./category.controller.js");

const router = express.Router();

router.get("/:slug/categories", categoryController.listPublicCategories);

module.exports = router;
