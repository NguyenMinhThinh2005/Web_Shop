const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["admin", "customer"],
      default: "customer",
      index: true,
    },

    fullName: {
      type: String,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    passwordHash: {
      type: String,
      select: false,
    },

    defaultAddressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerAddress",
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("User", userSchema);
