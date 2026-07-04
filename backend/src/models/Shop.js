const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },

    slug: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      unique: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    logoUrl: {
      type: String,
      trim: true,
      default: "",
    },

    bannerUrl: {
      type: String,
      trim: true,
      default: "",
    },

    domains: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    campaignId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    contact: {
      hotline: { type: String, trim: true, default: "" },
      zaloUrl: { type: String, trim: true, default: "" },
      messengerUrl: { type: String, trim: true, default: "" },
    },

    staff: {
      staffId: { type: String, trim: true, default: "" },
      staffName: { type: String, trim: true, default: "" },
      staffPhone: { type: String, trim: true, default: "" },
      staffZalo: { type: String, trim: true, default: "" },
      staffMessenger: { type: String, trim: true, default: "" },
    },

    sheetConfig: {
      enabled: { type: Boolean, default: true },
      webhookUrl: { type: String, trim: true, default: "" },
      formatType: {
        type: String,
        trim: true,
        default: "team_order_v1",
      },
      syncMode: {
        type: String,
        enum: ["direct", "manual"],
        default: "direct",
      },
    },

    checkoutConfig: {
      allowGuestCheckout: { type: Boolean, default: true },
      suggestLoginAfterOrder: { type: Boolean, default: true },
      requireAddress: { type: Boolean, default: true },
      requireProvince: { type: Boolean, default: false },
      paymentMethods: {
        type: [String],
        default: ["consult_later", "cod", "bank_transfer", "cash"],
      },
    },

    theme: {
      primaryColor: { type: String, trim: true, default: "#facc15" },
      accentColor: { type: String, trim: true, default: "#22c55e" },
      layoutType: {
        type: String,
        enum: ["default", "compact", "landing"],
        default: "default",
      },
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

shopSchema.index({ domains: 1 });
shopSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Shop", shopSchema);
