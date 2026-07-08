const { User } = require("../models/index.js");
const { verifyAccessToken } = require("../utils/jwt.js");

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      const error = new Error("Missing Bearer token");
      error.statusCode = 401;
      throw error;
    }

    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      const error = new Error("Invalid Bearer token");
      error.statusCode = 401;
      throw error;
    }

    const payload = verifyAccessToken(token);

    if (payload.type !== "access") {
      const error = new Error("Invalid token type");
      error.statusCode = 401;
      throw error;
    }

    const user = await User.findById(payload.sub);

    if (!user || user.status !== "active") {
      const error = new Error("User not found or blocked");
      error.statusCode = 401;
      throw error;
    }

    req.user = user;
    next();
  } catch (error) {
    error.statusCode = error.statusCode || 401;
    next(error);
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    const error = new Error("Admin permission required");
    error.statusCode = 403;
    return next(error);
  }

  return next();
}

function requireCustomer(req, res, next) {
  if (!req.user || req.user.role !== "customer") {
    const error = new Error("Customer permission required");
    error.statusCode = 403;
    return next(error);
  }

  return next();
}

module.exports = {
  authMiddleware,
  requireAdmin,
  requireCustomer,
};
