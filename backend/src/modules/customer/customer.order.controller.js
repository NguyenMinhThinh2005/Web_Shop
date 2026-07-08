const { z } = require("zod");
const asyncHandler = require("../../utils/asyncHandler.js");
const { successResponse } = require("../../utils/apiResponse.js");
const customerOrderService = require("./customer.order.service.js");

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

const listOrders = asyncHandler(async (req, res) => {
  const query = validate(
    z.object({
      page: z.string().trim().optional(),
      limit: z.string().trim().optional(),
    }),
    req.query,
    "Invalid order query",
  );
  const { orders, pagination } = await customerOrderService.listCustomerOrders(
    req.user,
    query,
  );

  return successResponse(res, {
    message: "Customer order list",
    data: { orders, pagination },
  });
});

const claimOrder = asyncHandler(async (req, res) => {
  const payload = validate(
    z.object({
      orderCode: z.string().trim().min(1, "Order code is required"),
      phone: z.string().trim().min(1, "Phone is required"),
    }),
    req.body,
    "Invalid claim order data",
  );
  const order = await customerOrderService.claimCustomerOrder(
    req.user,
    payload,
  );

  return successResponse(res, {
    message: "Customer order claimed",
    data: { order },
  });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await customerOrderService.getCustomerOrderById(
    req.user,
    req.params.orderId,
  );

  return successResponse(res, {
    message: "Customer order detail",
    data: { order },
  });
});

module.exports = {
  listOrders,
  claimOrder,
  getOrderById,
};
