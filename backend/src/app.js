const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");

const env = require("./config/env.js");
const asyncHandler = require("./utils/asyncHandler.js");
const { successResponse } = require("./utils/apiResponse.js");

const adminAuthRoutes = require("./modules/auth/auth.routes.js");
const adminShopRoutes = require("./modules/shops/admin.shop.routes.js");
const publicShopRoutes = require("./modules/shops/public.shop.routes.js");
const adminCategoryRoutes = require("./modules/categories/admin.category.routes.js");
const publicCategoryRoutes = require("./modules/categories/public.category.routes.js");
const adminProductRoutes = require("./modules/products/admin.product.routes.js");
const publicProductRoutes = require("./modules/products/public.product.routes.js");
const adminOrderRoutes = require("./modules/orders/admin.order.routes.js");
const publicOrderRoutes = require("./modules/orders/public.order.routes.js");
const adminReportRoutes = require("./modules/reports/admin.report.routes.js");
const customerAuthRoutes = require("./modules/customer/customer.auth.routes.js");
const customerAddressRoutes = require("./modules/customer/customer.address.routes.js");
const customerOrderRoutes = require("./modules/customer/customer.order.routes.js");

const notFoundMiddleware = require("./middlewares/notFound.middleware.js");
const errorMiddleware = require("./middlewares/error.middleware.js");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  }),
);

// Bắt buộc phải nằm trước routes, vì các routes cần body parser để parse request body
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv === "development") {
  app.use(morgan("dev"));
}

app.get(
  "/api/health",
  asyncHandler(async (req, res) => {
    const databaseState =
      mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    return successResponse(res, {
      message: "API is healthy",
      data: {
        service: "web-shop-backend",
        database: databaseState,
      },
    });
  }),
);

// Routes phải nằm sau body parser
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/reports", adminReportRoutes);
app.use("/api/admin", adminProductRoutes);
app.use("/api/admin", adminCategoryRoutes);
app.use("/api/admin/shops", adminShopRoutes);
app.use("/api/customer/auth", customerAuthRoutes);
app.use("/api/customer/addresses", customerAddressRoutes);
app.use("/api/customer/orders", customerOrderRoutes);
app.use("/api/public/orders", publicOrderRoutes);
app.use("/api/public/shops", publicProductRoutes);
app.use("/api/public/shops", publicCategoryRoutes);
app.use("/api/public/shops", publicShopRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
