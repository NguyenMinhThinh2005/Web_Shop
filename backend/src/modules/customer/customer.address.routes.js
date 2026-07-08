const express = require("express");
const customerAddressController = require("./customer.address.controller.js");
const {
  authMiddleware,
  requireCustomer,
} = require("../../middlewares/auth.middleware.js");

const router = express.Router();

router.use(authMiddleware, requireCustomer);

router.get("/", customerAddressController.listAddresses);
router.post("/", customerAddressController.createAddress);
router.patch("/:addressId", customerAddressController.updateAddress);
router.delete("/:addressId", customerAddressController.deleteAddress);

module.exports = router;
