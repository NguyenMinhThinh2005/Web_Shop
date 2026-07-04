const express = require("express");
const orderController = require("./order.controller.js");

const router = express.Router();

router.post("/", orderController.createOrder);

module.exports = router;
