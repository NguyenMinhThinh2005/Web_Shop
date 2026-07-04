const mongoose = require("mongoose");

const sheetSyncLogSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    webhookUrl: {
      type: String,
      trim: true,
      default: "",
    },

    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    response: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    status: {
      type: String,
      enum: ["success", "failed"],
      required: true,
      index: true,
    },

    errorMessage: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

sheetSyncLogSchema.index({ orderId: 1, createdAt: -1 });
sheetSyncLogSchema.index({ shopId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("SheetSyncLog", sheetSyncLogSchema);
