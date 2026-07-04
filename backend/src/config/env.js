require("dotenv").config();

const requiredEnv = ["MONGODB_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",

  mongodbUri: process.env.MONGODB_URI,

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

  defaultSheetWebhookUrl: process.env.DEFAULT_SHEET_WEBHOOK_URL || "",
  defaultOrderPrefix: process.env.DEFAULT_ORDER_PREFIX || "NLAI",
};

module.exports = env;
