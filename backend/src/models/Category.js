const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
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

    description: {
      type: String,
      trim: true,
      default: "",
    },

    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    sortOrder: {
      type: Number,
      default: 0,
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

categorySchema.index({ shopId: 1, slug: 1 }, { unique: true });
categorySchema.index({ shopId: 1, status: 1, sortOrder: 1 });

module.exports = mongoose.model("Category", categorySchema);
