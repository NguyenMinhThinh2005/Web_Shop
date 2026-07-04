const env = require("../config/env.js");
const { errorResponse } = require("../utils/apiResponse.js");

function getDuplicateKeyMessage(error) {
  const keyPattern = error.keyPattern || {};
  const keyValue = error.keyValue || {};
  const keyNames = [
    ...Object.keys(keyPattern),
    ...Object.keys(keyValue),
  ].join(" ");

  if (keyNames.includes("sku")) {
    return "SKU này đã tồn tại trong shop.";
  }

  if (keyNames.includes("slug")) {
    return "Slug đã tồn tại, vui lòng chọn slug khác.";
  }

  if (keyNames.includes("email")) {
    return "Email đã tồn tại.";
  }

  if (keyNames.includes("phone")) {
    return "Số điện thoại đã tồn tại.";
  }

  return "Dữ liệu đã tồn tại.";
}

function errorMiddleware(error, req, res, next) {
  const isDuplicateKey = error.code === 11000;
  const statusCode = isDuplicateKey ? 409 : error.statusCode || 500;
  const message = isDuplicateKey
    ? getDuplicateKeyMessage(error)
    : error.message || "Internal server error";

  console.error("API Error:", {
    message: error.message,
    errors: error.errors,
    stack: env.nodeEnv === "development" ? error.stack : undefined,
    path: req.originalUrl,
    method: req.method,
    body: req.body,
  });

  return errorResponse(res, {
    statusCode,
    message,
    errors: {
      validation: error.errors || null,
      stack: env.nodeEnv === "production" ? undefined : error.stack,
    },
  });
}

module.exports = errorMiddleware;
