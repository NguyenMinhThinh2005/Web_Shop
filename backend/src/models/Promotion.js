const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    code: {
      type: String,
      trim: true,
      uppercase: true,
      required: true,
    },

    name: {
      type: String,
      trim: true,
      default: "",
    },

    type: {
      type: String,
      enum: ["percent", "fixed_amount", "free_shipping"],
      required: true,
    },

    value: {
      type: Number,
      required: true,
      min: 0,
    },

    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxDiscountAmount: {
      type: Number,
      default: null,
      min: 0,
    },

    startAt: {
      type: Date,
      default: null,
    },

    endAt: {
      type: Date,
      default: null,
    },

    usageLimit: {
      type: Number,
      default: null,
      min: 0,
    },

    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

promotionSchema.index({ shopId: 1, code: 1 }, { unique: true });
promotionSchema.index({ shopId: 1, status: 1 });

module.exports = mongoose.model("Promotion", promotionSchema);
