const mongoose = require("mongoose");
const { CustomerAddress, User } = require("../../models/index.js");
const { normalizePhone } = require("../../utils/validators.js");

function assertValidObjectId(id, message) {
  if (
    !mongoose.Types.ObjectId.isValid(id) ||
    new mongoose.Types.ObjectId(id).toString() !== id
  ) {
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }
}

async function unsetOtherDefaults(userId, addressId = null) {
  const query = { userId, isDefault: true };

  if (addressId) {
    query._id = { $ne: addressId };
  }

  await CustomerAddress.updateMany(query, { isDefault: false });
}

async function listAddresses(user) {
  return CustomerAddress.find({ userId: user._id }).sort({
    isDefault: -1,
    createdAt: -1,
  });
}

async function createAddress(user, payload) {
  const isDefault =
    payload.isDefault === true ||
    (await CustomerAddress.countDocuments({ userId: user._id })) === 0;

  if (isDefault) {
    await unsetOtherDefaults(user._id);
  }

  const address = await CustomerAddress.create({
    userId: user._id,
    receiverName: payload.receiverName,
    phone: normalizePhone(payload.phone),
    province: payload.province || "",
    district: payload.district || "",
    ward: payload.ward || "",
    addressLine: payload.addressLine,
    note: payload.note || "",
    isDefault,
  });

  if (isDefault) {
    await User.findByIdAndUpdate(user._id, { defaultAddressId: address._id });
  }

  return address;
}

async function findOwnedAddress(user, addressId) {
  assertValidObjectId(addressId, "Invalid address id");

  const address = await CustomerAddress.findOne({
    _id: addressId,
    userId: user._id,
  });

  if (!address) {
    const error = new Error("Address not found");
    error.statusCode = 404;
    throw error;
  }

  return address;
}

async function updateAddress(user, addressId, payload) {
  const address = await findOwnedAddress(user, addressId);

  Object.entries(payload).forEach(([key, value]) => {
    if (key === "phone") {
      address.phone = normalizePhone(value);
      return;
    }

    address[key] = value;
  });

  if (payload.isDefault === true) {
    await unsetOtherDefaults(user._id, address._id);
    await User.findByIdAndUpdate(user._id, { defaultAddressId: address._id });
  }

  if (payload.isDefault === false) {
    const currentUser = await User.findById(user._id);

    if (String(currentUser.defaultAddressId || "") === String(address._id)) {
      await User.findByIdAndUpdate(user._id, { defaultAddressId: null });
    }
  }

  return address.save();
}

async function deleteAddress(user, addressId) {
  const address = await findOwnedAddress(user, addressId);
  const wasDefault = address.isDefault;

  await CustomerAddress.deleteOne({ _id: address._id });

  if (wasDefault) {
    await User.findByIdAndUpdate(user._id, { defaultAddressId: null });
  }

  return { deleted: true };
}

module.exports = {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
};
