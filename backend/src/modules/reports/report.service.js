const mongoose = require("mongoose");
const { Order } = require("../../models/index.js");

const COMPLETED_STATUSES = ["completed", "commission_paid", "delivered"];
const CANCELLED_STATUSES = ["cancelled", "returned"];

function assertValidObjectId(id, message) {
  if (
    !mongoose.Types.ObjectId.isValid(id) ||
    new mongoose.Types.ObjectId(id).toString() !== id
  ) {
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }
}

function parseDate(value, message, endOfDay = false) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }

  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

function getMoney(order, path, fallback = 0) {
  return Number(
    path.split(".").reduce((value, key) => (value ? value[key] : undefined), order) ||
      fallback,
  );
}

function makeEmptySummary() {
  return {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    newOrders: 0,
    confirmedOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    commissionExpected: 0,
    commissionPaid: 0,
    commissionPending: 0,
  };
}

function buildQuery(filters = {}) {
  const query = {};

  if (filters.shopId) {
    assertValidObjectId(filters.shopId, "Invalid shop id");
    query.shopId = filters.shopId;
  }

  const dateFrom = parseDate(filters.dateFrom, "Invalid dateFrom");
  const dateTo = parseDate(filters.dateTo, "Invalid dateTo", true);

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = dateFrom;
    if (dateTo) query.createdAt.$lte = dateTo;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.commissionStatus) {
    query["commission.status"] = filters.commissionStatus;
  }

  return query;
}

async function getOverview(filters = {}) {
  const query = buildQuery(filters);
  const orders = await Order.find(query)
    .populate("shopId", "name slug")
    .sort({ createdAt: -1 });
  const summary = makeEmptySummary();
  const byShopMap = new Map();
  const byStatusMap = new Map();

  orders.forEach((order) => {
    const grandTotal = getMoney(order, "money.grandTotal");
    const commissionExpected = getMoney(order, "commission.expectedAmount");
    const commissionActual = getMoney(order, "commission.actualAmount");
    const commissionPaid =
      order.commission && order.commission.status === "paid"
        ? commissionActual
        : 0;
    const status = order.status || "new";
    const shop = order.shopId || {};
    const shopId = String(shop._id || order.shopId || "");

    summary.totalOrders += 1;
    summary.totalRevenue += grandTotal;
    summary.commissionExpected += commissionExpected;
    summary.commissionPaid += commissionPaid;
    if (status === "new") summary.newOrders += 1;
    if (status === "confirmed") summary.confirmedOrders += 1;
    if (COMPLETED_STATUSES.includes(status)) summary.completedOrders += 1;
    if (CANCELLED_STATUSES.includes(status)) summary.cancelledOrders += 1;

    if (!byShopMap.has(shopId)) {
      byShopMap.set(shopId, {
        shopId,
        shopName: shop.name || "",
        shopSlug: shop.slug || "",
        totalOrders: 0,
        totalRevenue: 0,
        commissionExpected: 0,
        commissionPaid: 0,
        commissionPending: 0,
      });
    }

    const shopRow = byShopMap.get(shopId);
    shopRow.totalOrders += 1;
    shopRow.totalRevenue += grandTotal;
    shopRow.commissionExpected += commissionExpected;
    shopRow.commissionPaid += commissionPaid;

    if (!byStatusMap.has(status)) {
      byStatusMap.set(status, {
        status,
        count: 0,
        revenue: 0,
      });
    }

    const statusRow = byStatusMap.get(status);
    statusRow.count += 1;
    statusRow.revenue += grandTotal;
  });

  summary.averageOrderValue =
    summary.totalOrders > 0
      ? Math.round(summary.totalRevenue / summary.totalOrders)
      : 0;
  summary.commissionPending = Math.max(
    summary.commissionExpected - summary.commissionPaid,
    0,
  );

  const byShop = Array.from(byShopMap.values()).map((shopRow) => ({
    ...shopRow,
    commissionPending: Math.max(
      shopRow.commissionExpected - shopRow.commissionPaid,
      0,
    ),
  }));

  const recentOrders = orders.slice(0, 10).map((order) => {
    const shop = order.shopId || {};

    return {
      _id: order._id,
      orderCode: order.orderCode,
      shopId: String(shop._id || order.shopId || ""),
      shopName: shop.name || "",
      customerName: order.customer ? order.customer.name || "" : "",
      customerPhone: order.customer ? order.customer.phone || "" : "",
      grandTotal: getMoney(order, "money.grandTotal"),
      status: order.status,
      commissionStatus: order.commission
        ? order.commission.status || "pending"
        : "pending",
      commissionExpected: getMoney(order, "commission.expectedAmount"),
      commissionActual: getMoney(order, "commission.actualAmount"),
      createdAt: order.createdAt,
    };
  });

  return {
    summary,
    byShop,
    byStatus: Array.from(byStatusMap.values()),
    recentOrders,
  };
}

module.exports = {
  getOverview,
};
