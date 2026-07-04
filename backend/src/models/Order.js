const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },

    sku: {
      type: String,
      trim: true,
      required: true,
    },

    name: {
      type: String,
      trim: true,
      required: true,
    },

    image: {
      type: String,
      trim: true,
      default: "",
    },

    categoryName: {
      type: String,
      trim: true,
      default: "",
    },

    unitPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    selectedOptions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    productSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    _id: false,
  },
);

const orderActivityLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "status_updated",
        "shipping_updated",
        "handoff_updated",
        "commission_updated",
        "internal_note_updated",
      ],
      required: true,
    },
    message: {
      type: String,
      trim: true,
      required: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    actorName: {
      type: String,
      trim: true,
      default: "",
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    pageUrl: {
      type: String,
      trim: true,
      default: "",
    },

    campaign: {
      campaignId: { type: String, trim: true, default: "" },
      utmSource: { type: String, trim: true, default: "" },
      utmCampaign: { type: String, trim: true, default: "" },
    },

    staff: {
      staffId: { type: String, trim: true, default: "" },
      staffName: { type: String, trim: true, default: "" },
      staffPhone: { type: String, trim: true, default: "" },
      staffZalo: { type: String, trim: true, default: "" },
      staffMessenger: { type: String, trim: true, default: "" },
    },

    customer: {
      name: { type: String, trim: true, required: true },
      phone: { type: String, trim: true, required: true },
      address: { type: String, trim: true, default: "" },
      note: { type: String, trim: true, default: "" },
      preferredContactTime: { type: String, trim: true, default: "" },
    },

    items: {
      type: [orderItemSchema],
      validate: {
        validator: function validateItems(items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: "Order must have at least one item",
      },
    },

    money: {
      cartSubtotal: { type: Number, default: 0, min: 0 },
      shippingFee: { type: Number, default: 0, min: 0 },
      discountAmount: { type: Number, default: 0, min: 0 },
      grandTotal: { type: Number, default: 0, min: 0 },
    },

    promotion: {
      code: { type: String, trim: true, uppercase: true, default: "" },
      type: {
        type: String,
        enum: ["", "percent", "fixed_amount", "free_shipping"],
        default: "",
      },
      value: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 },
    },

    payment: {
      method: {
        type: String,
        enum: ["consult_later", "cod", "bank_transfer", "cash", "online"],
        default: "consult_later",
      },
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
      },
      provider: { type: String, trim: true, default: "" },
      transactionId: { type: String, trim: true, default: "" },
      paidAt: { type: Date, default: null },
      webhookPayload: { type: mongoose.Schema.Types.Mixed, default: null },
    },

    source: {
      userAgent: { type: String, trim: true, default: "" },
      ip: { type: String, trim: true, default: "" },
      device: { type: String, trim: true, default: "" },
      referrer: { type: String, trim: true, default: "" },
    },

    status: {
      type: String,
      enum: [
        "new",
        "confirmed",
        "shipping_created",
        "handoff_sent",
        "processing",
        "shipping",
        "delivered",
        "commission_pending",
        "commission_paid",
        "completed",
        "cancelled",
        "returned",
      ],
      default: "new",
      index: true,
    },

    shipping: {
      carrier: {
        type: String,
        enum: ["none", "viettel_post", "ghn", "ghtk", "jtexpress", "other"],
        default: "none",
      },
      trackingCode: {
        type: String,
        trim: true,
        default: "",
      },
      shippingFee: {
        type: Number,
        default: 0,
        min: 0,
      },
      status: {
        type: String,
        enum: [
          "not_created",
          "created",
          "shipping",
          "delivered",
          "failed",
          "returned",
          "cancelled",
        ],
        default: "not_created",
      },
      note: {
        type: String,
        trim: true,
        default: "",
      },
      createdAt: {
        type: Date,
        default: null,
      },
      updatedAt: {
        type: Date,
        default: null,
      },
    },

    handoff: {
      status: {
        type: String,
        enum: ["not_sent", "sent"],
        default: "not_sent",
      },
      sentAt: {
        type: Date,
        default: null,
      },
      note: {
        type: String,
        trim: true,
        default: "",
      },
    },

    commission: {
      type: {
        type: String,
        enum: ["none", "percent", "fixed"],
        default: "none",
      },
      baseAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      rate: {
        type: Number,
        default: 0,
        min: 0,
      },
      fixedAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      expectedAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      actualAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      status: {
        type: String,
        enum: ["pending", "approved", "paid", "cancelled"],
        default: "pending",
      },
      paidAt: {
        type: Date,
        default: null,
      },
      note: {
        type: String,
        trim: true,
        default: "",
      },
    },

    internalNote: {
      type: String,
      trim: true,
      default: "",
    },

    sheetSync: {
      status: {
        type: String,
        enum: ["pending", "success", "failed", "skipped"],
        default: "pending",
        index: true,
      },
      webhookUrl: { type: String, trim: true, default: "" },
      syncedAt: { type: Date, default: null },
      lastError: { type: String, trim: true, default: "" },
      retryCount: { type: Number, default: 0 },
    },

    activityLogs: {
      type: [orderActivityLogSchema],
      default: [],
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ shopId: 1, createdAt: -1 });
orderSchema.index({ shopId: 1, status: 1, createdAt: -1 });
orderSchema.index({ "customer.phone": 1 });
orderSchema.index({ "sheetSync.status": 1, createdAt: -1 });
orderSchema.index({ "shipping.status": 1, createdAt: -1 });
orderSchema.index({ "shipping.carrier": 1, createdAt: -1 });
orderSchema.index({ "shipping.trackingCode": 1 });
orderSchema.index({ "handoff.status": 1, createdAt: -1 });
orderSchema.index({ "commission.status": 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
