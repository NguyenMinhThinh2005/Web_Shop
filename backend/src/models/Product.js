const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    sku: {
      type: String,
      trim: true,
      required: true,
    },

    importKey: {
      type: String,
      trim: true,
      default: "",
    },

    sourceProductId: {
      type: String,
      trim: true,
      default: "",
    },

    sourceSystem: {
      type: String,
      trim: true,
      default: "",
    },

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
    },

    categoryIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    shortDescription: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    price: {
      type: Number,
      default: 0,
      min: 0,
    },

    salePrice: {
      type: Number,
      default: null,
      min: 0,
    },

    priceMode: {
      type: String,
      enum: ["fixed", "contact", "hidden"],
      default: "fixed",
    },

    thumbnailUrl: {
      type: String,
      trim: true,
      default: "",
    },

    images: [
      {
        type: String,
        trim: true,
      },
    ],

    attributes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    inventory: {
      trackStock: { type: Boolean, default: false },
      stockQuantity: { type: Number, default: null },
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },

    pinnedOrder: {
      type: Number,
      default: 0,
    },

    pinnedAt: {
      type: Date,
      default: null,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "draft"],
      default: "draft",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

productSchema.index({ shopId: 1, sku: 1 }, { unique: true });
productSchema.index({ shopId: 1, slug: 1 }, { unique: true });
productSchema.index(
  { shopId: 1, importKey: 1 },
  {
    unique: true,
    partialFilterExpression: { importKey: { $type: "string", $gt: "" } },
  },
);
productSchema.index({ shopId: 1, status: 1, sortOrder: 1 });
productSchema.index({ shopId: 1, status: 1, isPinned: -1, pinnedOrder: 1 });
productSchema.index({ name: "text", sku: "text", shortDescription: "text" });

module.exports = mongoose.model("Product", productSchema);
