const { z } = require("zod");
const asyncHandler = require("../../utils/asyncHandler.js");
const { successResponse } = require("../../utils/apiResponse.js");
const orderService = require("./order.service.js");

const orderStatusSchema = z.enum([
  "new",
  "confirmed",
  "shipping_created",
  "handoff_sent",
  "processing",
  "shipping",
  "delivered",
  "commission_pending",
  "commission_paid",
  "completed",
  "cancelled",
  "returned",
]);

const shippingCarrierSchema = z.enum([
  "none",
  "viettel_post",
  "ghn",
  "ghtk",
  "jtexpress",
  "other",
]);

const shippingStatusSchema = z.enum([
  "not_created",
  "created",
  "shipping",
  "delivered",
  "failed",
  "returned",
  "cancelled",
]);

const handoffStatusSchema = z.enum(["not_sent", "sent"]);
const commissionTypeSchema = z.enum(["none", "percent", "fixed"]);
const commissionStatusSchema = z.enum([
  "pending",
  "approved",
  "paid",
  "cancelled",
]);

const sheetSyncStatusSchema = z.enum([
  "pending",
  "success",
  "failed",
  "skipped",
]);

const paymentMethodSchema = z.enum([
  "consult_later",
  "cod",
  "bank_transfer",
  "cash",
  "online",
]);

const createOrderSchema = z.object({
  shopSlug: z.string().trim().min(1, "Shop slug is required"),
  pageUrl: z.string().trim().optional(),
  customer: z.object({
    name: z.string().trim().min(1, "Customer name is required"),
    phone: z.string().trim().min(1, "Customer phone is required"),
    address: z.string().trim().optional(),
    note: z.string().trim().optional(),
    preferredContactTime: z.string().trim().optional(),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1, "Product id is required"),
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
      }),
    )
    .min(1, "Order items are required"),
  paymentMethod: paymentMethodSchema.optional(),
  source: z
    .object({
      utmSource: z.string().trim().optional(),
      utmCampaign: z.string().trim().optional(),
      userAgent: z.string().trim().optional(),
      device: z.string().trim().optional(),
      referrer: z.string().trim().optional(),
    })
    .optional(),
});

function validate(schema, data, message) {
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    const error = new Error(message);
    error.statusCode = 400;
    error.errors = parsed.error.flatten();
    throw error;
  }

  return parsed.data;
}

const createOrder = asyncHandler(async (req, res) => {
  const payload = validate(createOrderSchema, req.body, "Invalid order data");
  const order = await orderService.createOrder(payload, req);
  const publicOrder =
    order && typeof order.toObject === "function" ? order.toObject() : order;

  if (publicOrder) {
    delete publicOrder.activityLogs;
  }

  return successResponse(res, {
    statusCode: 201,
    message: "Order created",
    data: { order: publicOrder },
  });
});

const listOrders = asyncHandler(async (req, res) => {
  const querySchema = z.object({
    shopId: z.string().trim().optional(),
    status: orderStatusSchema.optional(),
    sheetSyncStatus: sheetSyncStatusSchema.optional(),
    phone: z.string().trim().optional(),
    orderCode: z.string().trim().optional(),
    shippingStatus: shippingStatusSchema.optional(),
    carrier: shippingCarrierSchema.optional(),
    handoffStatus: handoffStatusSchema.optional(),
    commissionStatus: commissionStatusSchema.optional(),
    trackingCode: z.string().trim().optional(),
    page: z.string().trim().optional(),
    limit: z.string().trim().optional(),
    sortBy: z.string().trim().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  });
  const query = validate(querySchema, req.query, "Invalid order query");
  const { orders, pagination } = await orderService.listOrders(query);

  return successResponse(res, {
    message: "Order list",
    data: { orders, pagination },
  });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.orderId, {
    includeActivityLogs: true,
    includeShop: true,
  });

  return successResponse(res, {
    message: "Order detail",
    data: { order },
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const bodySchema = z.object({
    status: orderStatusSchema,
  });
  const payload = validate(bodySchema, req.body, "Invalid order status");
  const order = await orderService.updateOrderStatus(
    req.params.orderId,
    payload.status,
    req.user,
  );

  return successResponse(res, {
    message: "Order status updated",
    data: { order },
  });
});

const syncOrderToSheet = asyncHandler(async (req, res) => {
  const order = await orderService.syncOrderToSheet(req.params.orderId);

  return successResponse(res, {
    message: "Order synced to sheet",
    data: { order },
  });
});

const updateOrderShipping = asyncHandler(async (req, res) => {
  const bodySchema = z
    .object({
      carrier: shippingCarrierSchema.optional(),
      trackingCode: z.string().trim().optional(),
      shippingFee: z.number().min(0).optional(),
      status: shippingStatusSchema.optional(),
      note: z.string().trim().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Shipping update data is required",
    });
  const payload = validate(bodySchema, req.body, "Invalid shipping data");
  const order = await orderService.updateOrderShipping(
    req.params.orderId,
    payload,
    req.user,
  );

  return successResponse(res, {
    message: "Order shipping updated",
    data: { order },
  });
});

const updateOrderHandoff = asyncHandler(async (req, res) => {
  const bodySchema = z
    .object({
      status: handoffStatusSchema.optional(),
      note: z.string().trim().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Handoff update data is required",
    });
  const payload = validate(bodySchema, req.body, "Invalid handoff data");
  const order = await orderService.updateOrderHandoff(
    req.params.orderId,
    payload,
    req.user,
  );

  return successResponse(res, {
    message: "Order handoff updated",
    data: { order },
  });
});

const updateOrderCommission = asyncHandler(async (req, res) => {
  const bodySchema = z
    .object({
      type: commissionTypeSchema.optional(),
      baseAmount: z.number().min(0).optional(),
      rate: z.number().min(0).optional(),
      fixedAmount: z.number().min(0).optional(),
      expectedAmount: z.number().min(0).optional(),
      actualAmount: z.number().min(0).optional(),
      status: commissionStatusSchema.optional(),
      note: z.string().trim().optional(),
      autoCalculate: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Commission update data is required",
    });
  const payload = validate(bodySchema, req.body, "Invalid commission data");
  const order = await orderService.updateOrderCommission(
    req.params.orderId,
    payload,
    req.user,
  );

  return successResponse(res, {
    message: "Order commission updated",
    data: { order },
  });
});

const updateOrderInternalNote = asyncHandler(async (req, res) => {
  const bodySchema = z.object({
    internalNote: z.string().trim().max(2000),
  });
  const payload = validate(bodySchema, req.body, "Invalid internal note data");
  const order = await orderService.updateOrderInternalNote(
    req.params.orderId,
    payload.internalNote,
    req.user,
  );

  return successResponse(res, {
    message: "Order internal note updated",
    data: { order },
  });
});

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
