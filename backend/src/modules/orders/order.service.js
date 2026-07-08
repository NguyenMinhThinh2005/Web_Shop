const mongoose = require("mongoose");
const env = require("../../config/env.js");
const { Order, Product, Shop, User } = require("../../models/index.js");
const {
  isValidVietnamPhone,
  normalizePhone,
  normalizeSlug,
} = require("../../utils/validators.js");
const generateOrderCode = require("../../utils/orderCode.js");
const { verifyAccessToken } = require("../../utils/jwt.js");
const sheetService = require("../sheet/sheet.service.js");

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

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    req.ip ||
    ""
  )
    .toString()
    .split(",")[0]
    .trim();
}

function getUnitPrice(product) {
  if (product.priceMode !== "fixed") {
    return 0;
  }

  if (typeof product.salePrice === "number" && product.salePrice >= 0) {
    return product.salePrice;
  }

  return product.price || 0;
}

function mapOrderItem(product, quantity) {
  const unitPrice = getUnitPrice(product);
  const lineTotal = unitPrice * quantity;

  return {
    productId: product._id,
    sku: product.sku,
    name: product.name,
    image: product.thumbnailUrl || "",
    categoryName: "",
    unitPrice,
    quantity,
    lineTotal,
    selectedOptions: {},
    productSnapshot: {
      slug: product.slug,
      price: product.price,
      salePrice: product.salePrice,
      priceMode: product.priceMode,
      thumbnailUrl: product.thumbnailUrl,
      images: product.images || [],
      attributes: product.attributes || {},
    },
  };
}

async function getActiveShopBySlug(shopSlug) {
  const normalizedSlug = normalizeSlug(shopSlug);

  if (!normalizedSlug) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  const shop = await Shop.findOne({
    slug: normalizedSlug,
    status: "active",
  });

  if (!shop) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  return shop;
}

function buildPagination(filters = {}) {
  const page = Math.max(Number.parseInt(filters.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(Number.parseInt(filters.limit, 10) || 20, 1),
    100,
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

function buildSort(filters = {}) {
  const allowedFields = new Set([
    "createdAt",
    "updatedAt",
    "orderCode",
    "status",
    "grandTotal",
  ]);
  const sortBy = allowedFields.has(filters.sortBy) ? filters.sortBy : "createdAt";
  const sortOrder = filters.sortOrder === "asc" ? 1 : -1;

  if (sortBy === "grandTotal") {
    return { "money.grandTotal": sortOrder };
  }

  return { [sortBy]: sortOrder };
}

function requireValidPhone(phone) {
  if (!isValidVietnamPhone(phone)) {
    const error = new Error("Số điện thoại chưa hợp lệ.");
    error.statusCode = 400;
    throw error;
  }
}

function requireCustomerAddress(shop, customer) {
  const checkoutConfig = shop.checkoutConfig || {};

  if (
    checkoutConfig.requireAddress !== false &&
    !String(customer.address || "").trim()
  ) {
    const error = new Error("Customer address is required");
    error.statusCode = 400;
    throw error;
  }
}

function getActor(actor) {
  if (!actor) {
    return { actorId: null, actorName: "" };
  }

  return {
    actorId: actor._id || null,
    actorName: actor.fullName || actor.email || actor.phone || "",
  };
}

function toPlain(value) {
  if (value && typeof value.toObject === "function") {
    return value.toObject();
  }

  return JSON.parse(JSON.stringify(value || {}));
}

function appendActivityLog(order, { type, message, actor, changes }) {
  order.activityLogs = order.activityLogs || [];
  order.activityLogs.push({
    type,
    message,
    ...getActor(actor),
    changes,
    createdAt: new Date(),
  });
}

async function getOptionalCustomerFromRequest(req) {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return null;
    }

    const payload = verifyAccessToken(token);

    if (payload.type !== "access" || payload.role !== "customer") {
      return null;
    }

    const user = await User.findById(payload.sub);

    if (!user || user.role !== "customer" || user.status !== "active") {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

function toOrderObject(order) {
  if (order && typeof order.toObject === "function") {
    return order.toObject();
  }

  return order;
}

function mapShopSummary(shop) {
  if (!shop) {
    return null;
  }

  return {
    _id: shop._id,
    name: shop.name,
    slug: shop.slug,
    status: shop.status,
  };
}

async function attachShopSummary(orders) {
  const orderList = Array.isArray(orders) ? orders : [orders];
  const shopIds = [
    ...new Set(
      orderList
        .map((order) => String(order.shopId || ""))
        .filter(Boolean),
    ),
  ];

  if (shopIds.length === 0) {
    return Array.isArray(orders) ? orderList.map(toOrderObject) : toOrderObject(orders);
  }

  const shops = await Shop.find({ _id: { $in: shopIds } }).select(
    "name slug status",
  );
  const shopById = new Map(
    shops.map((shop) => [String(shop._id), mapShopSummary(shop)]),
  );

  const mappedOrders = orderList.map((order) => {
    const orderObject = toOrderObject(order);
    return {
      ...orderObject,
      shop: shopById.get(String(orderObject.shopId)) || null,
    };
  });

  return Array.isArray(orders) ? mappedOrders : mappedOrders[0];
}

async function buildOrderItems(items, shopId) {
  const productIds = items.map((item) => item.productId);

  productIds.forEach((productId) => {
    assertValidObjectId(productId, "Invalid product id");
  });

  const products = await Product.find({
    _id: { $in: productIds },
  });
  const productById = new Map(
    products.map((product) => [String(product._id), product]),
  );

  return items.map((item) => {
    const product = productById.get(String(item.productId));

    if (!product) {
      const error = new Error("Product not found");
      error.statusCode = 404;
      throw error;
    }

    if (String(product.shopId) !== String(shopId)) {
      const error = new Error("Product not in shop");
      error.statusCode = 400;
      throw error;
    }

    if (product.status !== "active") {
      const error = new Error("Product not found");
      error.statusCode = 404;
      throw error;
    }

    return mapOrderItem(product, item.quantity);
  });
}

async function createOrder(payload, req) {
  const shop = await getActiveShopBySlug(payload.shopSlug);

  requireValidPhone(payload.customer.phone);
  requireCustomerAddress(shop, payload.customer);

  const normalizedPhone = normalizePhone(payload.customer.phone);

  const orderItems = await buildOrderItems(payload.items, shop._id);
  const cartSubtotal = orderItems.reduce(
    (sum, item) => sum + item.lineTotal,
    0,
  );
  const shippingFee = 0;
  const discountAmount = 0;
  const grandTotal = cartSubtotal + shippingFee - discountAmount;
  const source = payload.source || {};
  const sheetConfig = shop.sheetConfig || {};
  const customerUser = await getOptionalCustomerFromRequest(req);

  const orderPayload = {
    orderCode: generateOrderCode(),
    shopId: shop._id,
    customerId: customerUser ? customerUser._id : null,
    pageUrl: payload.pageUrl || "",
    campaign: {
      campaignId: shop.campaignId || "",
      utmSource: source.utmSource || "",
      utmCampaign: source.utmCampaign || shop.campaignId || "",
    },
    staff: {
      staffId: shop.staff ? shop.staff.staffId || "" : "",
      staffName: shop.staff ? shop.staff.staffName || "" : "",
      staffPhone: shop.staff ? shop.staff.staffPhone || "" : "",
      staffZalo: shop.staff ? shop.staff.staffZalo || "" : "",
      staffMessenger: shop.staff ? shop.staff.staffMessenger || "" : "",
    },
    customer: {
      name: payload.customer.name,
      phone: normalizedPhone,
      address: payload.customer.address || "",
      note: payload.customer.note || "",
      preferredContactTime: payload.customer.preferredContactTime || "",
    },
    items: orderItems,
    money: {
      cartSubtotal,
      shippingFee,
      discountAmount,
      grandTotal,
    },
    payment: {
      method: payload.paymentMethod || "consult_later",
      status: "pending",
    },
    source: {
      userAgent: source.userAgent || req.get("user-agent") || "",
      ip: getClientIp(req),
      device: source.device || "",
      referrer: source.referrer || req.get("referer") || "",
    },
    status: "new",
    sheetSync: {
      status: sheetConfig.enabled === false ? "skipped" : "pending",
      webhookUrl: sheetConfig.webhookUrl || env.defaultSheetWebhookUrl || "",
    },
  };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      if (attempt > 0) {
        orderPayload.orderCode = generateOrderCode();
      }

      const order = await Order.create(orderPayload);

      if (
        sheetConfig.enabled !== false &&
        sheetConfig.syncMode === "direct"
      ) {
        try {
          return await sheetService.syncOrderToSheet(order._id);
        } catch (error) {
          return Order.findById(order._id);
        }
      }

      return order;
    } catch (error) {
      if (error.code === 11000 && attempt < 2) {
        continue;
      }

      throw error;
    }
  }

  return null;
}

async function listOrders(filters = {}) {
  const query = {};
  const { page, limit, skip } = buildPagination(filters);

  if (filters.shopId) {
    assertValidObjectId(filters.shopId, "Invalid shop id");
    query.shopId = filters.shopId;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.sheetSyncStatus) {
    query["sheetSync.status"] = filters.sheetSyncStatus;
  }

  if (filters.phone) {
    query["customer.phone"] = normalizePhone(filters.phone);
  }

  if (filters.orderCode) {
    query.orderCode = filters.orderCode;
  }

  if (filters.shippingStatus) {
    query["shipping.status"] = filters.shippingStatus;
  }

  if (filters.carrier) {
    query["shipping.carrier"] = filters.carrier;
  }

  if (filters.handoffStatus) {
    query["handoff.status"] = filters.handoffStatus;
  }

  if (filters.commissionStatus) {
    query["commission.status"] = filters.commissionStatus;
  }

  if (filters.trackingCode) {
    query["shipping.trackingCode"] = new RegExp(
      String(filters.trackingCode).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
  }

  const [orders, total] = await Promise.all([
    Order.find(query).sort(buildSort(filters)).skip(skip).limit(limit),
    Order.countDocuments(query),
  ]);

  return {
    orders: await attachShopSummary(orders),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getOrderById(
  orderId,
  { includeActivityLogs = false, includeShop = false } = {},
) {
  assertValidObjectId(orderId, "Invalid order id");

  const query = Order.findById(orderId);

  if (includeActivityLogs) {
    query.select("+activityLogs");
  }

  const order = await query;

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  if (includeShop) {
    return attachShopSummary(order);
  }

  return order;
}

async function updateOrderStatus(orderId, status, actor) {
  const order = await getOrderById(orderId, { includeActivityLogs: true });
  const before = order.status;

  order.status = status;
  appendActivityLog(order, {
    type: "status_updated",
    message: "Order status updated",
    actor,
    changes: {
      status: { before, after: status },
    },
  });

  return order.save();
}

async function syncOrderToSheet(orderId) {
  await getOrderById(orderId);
  return sheetService.syncOrderToSheet(orderId);
}

async function updateOrderShipping(orderId, payload, actor) {
  const order = await getOrderById(orderId, { includeActivityLogs: true });
  const now = new Date();
  const before = toPlain(order.shipping);

  Object.entries(payload).forEach(([key, value]) => {
    order.shipping[key] = value;
  });

  order.shipping.updatedAt = now;

  if (payload.trackingCode && !order.shipping.createdAt) {
    order.shipping.createdAt = now;
  }

  if (
    payload.status === "created" &&
    ["new", "confirmed"].includes(order.status)
  ) {
    order.status = "shipping_created";
  }

  appendActivityLog(order, {
    type: "shipping_updated",
    message: "Order shipping updated",
    actor,
    changes: {
      shipping: { before, after: toPlain(order.shipping) },
      status: { before: before.status, after: order.shipping.status },
    },
  });

  return order.save();
}

async function updateOrderHandoff(orderId, payload, actor) {
  const order = await getOrderById(orderId, { includeActivityLogs: true });
  const before = toPlain(order.handoff);

  Object.entries(payload).forEach(([key, value]) => {
    order.handoff[key] = value;
  });

  if (payload.status === "sent") {
    if (!order.handoff.sentAt) {
      order.handoff.sentAt = new Date();
    }

    if (["shipping_created", "confirmed", "new"].includes(order.status)) {
      order.status = "handoff_sent";
    }
  }

  if (payload.status === "not_sent") {
    order.handoff.sentAt = null;
  }

  appendActivityLog(order, {
    type: "handoff_updated",
    message: "Order handoff updated",
    actor,
    changes: {
      handoff: { before, after: toPlain(order.handoff) },
    },
  });

  return order.save();
}

async function updateOrderCommission(orderId, payload, actor) {
  const order = await getOrderById(orderId, { includeActivityLogs: true });
  const before = toPlain(order.commission);
  const shouldAutoCalculate =
    payload.autoCalculate === true ||
    Object.prototype.hasOwnProperty.call(payload, "expectedAmount") === false;

  if (Object.prototype.hasOwnProperty.call(payload, "autoCalculate")) {
    delete payload.autoCalculate;
  }

  Object.entries(payload).forEach(([key, value]) => {
    order.commission[key] = value;
  });

  if (shouldAutoCalculate) {
    const type = order.commission.type || "none";
    const baseAmount =
      Number(order.commission.baseAmount || 0) > 0
        ? Number(order.commission.baseAmount || 0)
        : Number(order.money ? order.money.grandTotal || 0 : 0);

    if (type === "percent") {
      order.commission.baseAmount = baseAmount;
      order.commission.expectedAmount = Math.round(
        (baseAmount * Number(order.commission.rate || 0)) / 100,
      );
    }

    if (type === "fixed") {
      order.commission.expectedAmount = Number(
        order.commission.fixedAmount || 0,
      );
    }

    if (type === "none") {
      order.commission.expectedAmount = 0;
      order.commission.actualAmount = 0;
    }
  }

  if (payload.status === "paid") {
    if (!order.commission.paidAt) {
      order.commission.paidAt = new Date();
    }

    order.status = "commission_paid";
  }

  if (
    payload.status === "pending" &&
    ["delivered", "completed"].includes(order.status)
  ) {
    order.status = "commission_pending";
  }

  appendActivityLog(order, {
    type: "commission_updated",
    message: "Order commission updated",
    actor,
    changes: {
      commission: { before, after: toPlain(order.commission) },
    },
  });

  return order.save();
}

async function updateOrderInternalNote(orderId, internalNote, actor) {
  const order = await getOrderById(orderId, { includeActivityLogs: true });
  const before = order.internalNote;

  order.internalNote = internalNote;

  appendActivityLog(order, {
    type: "internal_note_updated",
    message: "Order internal note updated",
    actor,
    changes: {
      internalNote: { before, after: internalNote },
    },
  });

  return order.save();
}

module.exports = {
  createOrder,
  listOrders,
  getOrderById,
  updateOrderStatus,
  syncOrderToSheet,
  updateOrderShipping,
  updateOrderHandoff,
  updateOrderCommission,
  updateOrderInternalNote,
};
