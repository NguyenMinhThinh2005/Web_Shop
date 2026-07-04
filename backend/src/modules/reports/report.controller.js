const { z } = require("zod");
const asyncHandler = require("../../utils/asyncHandler.js");
const { successResponse } = require("../../utils/apiResponse.js");
const reportService = require("./report.service.js");

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

const commissionStatusSchema = z.enum([
  "pending",
  "approved",
  "paid",
  "cancelled",
]);

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

const getOverview = asyncHandler(async (req, res) => {
  const querySchema = z.object({
    shopId: z.string().trim().optional(),
    dateFrom: z.string().trim().optional(),
    dateTo: z.string().trim().optional(),
    status: orderStatusSchema.optional(),
    commissionStatus: commissionStatusSchema.optional(),
  });
  const query = validate(querySchema, req.query, "Invalid report query");
  const report = await reportService.getOverview(query);

  return successResponse(res, {
    message: "Report overview",
    data: report,
  });
});

module.exports = {
  getOverview,
};
