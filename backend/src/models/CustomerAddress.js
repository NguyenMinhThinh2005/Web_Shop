const mongoose = require("mongoose");

const customerAddressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    receiverName: {
      type: String,
      trim: true,
      required: true,
    },

    phone: {
      type: String,
      trim: true,
      required: true,
    },

    province: {
      type: String,
      trim: true,
      default: "",
    },

    district: {
      type: String,
      trim: true,
      default: "",
    },

    ward: {
      type: String,
      trim: true,
      default: "",
    },

    addressLine: {
      type: String,
      trim: true,
      required: true,
    },

    note: {
      type: String,
      trim: true,
      default: "",
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

customerAddressSchema.index({ userId: 1, isDefault: 1 });

module.exports = mongoose.model("CustomerAddress", customerAddressSchema);
