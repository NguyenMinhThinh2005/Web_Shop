const mongoose = require("mongoose");
const { Order, Shop } = require("../../models/index.js");
const { normalizePhone } = require("../../utils/validators.js");

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

function buildPagination(filters = {}) {
  const page = Math.max(Number.parseInt(filters.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(Number.parseInt(filters.limit, 10) || 20, 1),
    100,
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

function normalizeVietnamPhoneForCompare(phone) {
  const digits = normalizePhone(phone);

  if (digits.startsWith("84") && digits.length === 11) {
    return `0${digits.slice(2)}`;
  }

  return digits;
}

function buildPhoneVariants(phone) {
  const canonical = normalizeVietnamPhoneForCompare(phone);

  if (!canonical) {
    return [];
  }

  const variants = new Set([canonical]);

  if (canonical.startsWith("0") && canonical.length === 10) {
    variants.add(`84${canonical.slice(1)}`);
    variants.add(`+84${canonical.slice(1)}`);
  }

  variants.add(normalizePhone(phone));

  return [...variants].filter(Boolean);
}

function buildPhoneRegex(phone) {
  const canonical = normalizeVietnamPhoneForCompare(phone);

  if (!canonical || canonical.length !== 10 || !canonical.startsWith("0")) {
    return null;
  }

  const localDigits = canonical.split("").join("\\D*");
  const countryDigits = `84${canonical.slice(1)}`.split("").join("\\D*");

  return new RegExp(`^(?:${localDigits}|\\+?${countryDigits})$`);
}

function buildCustomerOrderQuery(user) {
  const phoneVariants = buildPhoneVariants(user.phone);
  const phoneRegex = buildPhoneRegex(user.phone);

  return {
    $or: [
      { customerId: user._id },
      { "customer.phone": { $in: phoneVariants } },
      ...(phoneRegex ? [{ "customer.phone": phoneRegex }] : []),
    ],
  };
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
      orderList.map((order) => String(order.shopId || "")).filter(Boolean),
    ),
  ];
  const shops = shopIds.length
    ? await Shop.find({ _id: { $in: shopIds } }).select("name slug status")
    : [];
  const shopById = new Map(
    shops.map((shop) => [String(shop._id), mapShopSummary(shop)]),
  );

  const mappedOrders = orderList.map((order) => ({
    ...order,
    shop: shopById.get(String(order.shopId)) || null,
  }));

  return Array.isArray(orders) ? mappedOrders : mappedOrders[0];
}

function sanitizeOrder(order) {
  const plain =
    order && typeof order.toObject === "function" ? order.toObject() : order;

  return {
    _id: plain._id,
    orderCode: plain.orderCode,
    shopId: plain.shopId,
    customerId: plain.customerId || null,
    shop: plain.shop || null,
    customer: plain.customer,
    items: plain.items,
    money: plain.money,
    payment: {
      method: plain.payment ? plain.payment.method : undefined,
      status: plain.payment ? plain.payment.status : undefined,
    },
    status: plain.status,
    shipping: plain.shipping
      ? {
          carrier: plain.shipping.carrier,
          trackingCode: plain.shipping.trackingCode,
          shippingFee: plain.shipping.shippingFee,
          status: plain.shipping.status,
          note: plain.shipping.note,
          createdAt: plain.shipping.createdAt,
          updatedAt: plain.shipping.updatedAt,
        }
      : undefined,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

async function listCustomerOrders(user, filters = {}) {
  const { page, limit, skip } = buildPagination(filters);
  const query = buildCustomerOrderQuery(user);
  const [orders, total] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(query),
  ]);
  const mappedOrders = await attachShopSummary(orders.map(sanitizeOrder));

  return {
    orders: mappedOrders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getCustomerOrderById(user, orderId) {
  assertValidObjectId(orderId, "Invalid order id");

  const order = await Order.findOne({
    _id: orderId,
    ...buildCustomerOrderQuery(user),
  }).lean();

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  const [mappedOrder] = await attachShopSummary([sanitizeOrder(order)]);
  return mappedOrder;
}

async function claimCustomerOrder(user, payload) {
  const orderCode = String(payload.orderCode || "").trim();
  const bodyPhone = normalizeVietnamPhoneForCompare(payload.phone);
  const userPhone = normalizeVietnamPhoneForCompare(user.phone);

  const order = await Order.findOne({ orderCode });

  if (!order) {
    const error = new Error("Không tìm thấy đơn hàng.");
    error.statusCode = 404;
    throw error;
  }

  const orderPhone = normalizeVietnamPhoneForCompare(order.customer?.phone);
  const isPhoneMatched =
    bodyPhone &&
    bodyPhone === orderPhone &&
    bodyPhone === userPhone &&
    userPhone === orderPhone;

  if (!isPhoneMatched) {
    const error = new Error(
      "Số điện thoại tài khoản không khớp với số điện thoại đặt đơn.",
    );
    error.statusCode = 400;
    throw error;
  }

  if (order.customerId && String(order.customerId) !== String(user._id)) {
    const error = new Error(
      "Đơn hàng này đã được liên kết với tài khoản khác.",
    );
    error.statusCode = 403;
    throw error;
  }

  if (!order.customerId) {
    order.customerId = user._id;
    await order.save();
  }

  const [mappedOrder] = await attachShopSummary([sanitizeOrder(order)]);
  return mappedOrder;
}

module.exports = {
  listCustomerOrders,
  getCustomerOrderById,
  claimCustomerOrder,
  normalizeVietnamPhoneForCompare,
};
