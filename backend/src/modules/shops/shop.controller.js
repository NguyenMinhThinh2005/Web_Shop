const { z } = require("zod");
const asyncHandler = require("../../utils/asyncHandler.js");
const { successResponse } = require("../../utils/apiResponse.js");
const shopService = require("./shop.service.js");

const statusSchema = z.enum(["active", "inactive"]);

const contactSchema = z
  .object({
    hotline: z.string().trim().optional(),
    zaloUrl: z.string().trim().optional(),
    messengerUrl: z.string().trim().optional(),
  })
  .optional();

const staffSchema = z
  .object({
    staffId: z.string().trim().optional(),
    staffName: z.string().trim().optional(),
    staffPhone: z.string().trim().optional(),
    staffZalo: z.string().trim().optional(),
    staffMessenger: z.string().trim().optional(),
  })
  .optional();

const sheetConfigSchema = z
  .object({
    enabled: z.boolean().optional(),
    webhookUrl: z.string().trim().optional(),
    formatType: z.string().trim().optional(),
    syncMode: z.enum(["direct", "manual"]).optional(),
  })
  .optional();

const checkoutConfigSchema = z
  .object({
    allowGuestCheckout: z.boolean().optional(),
    suggestLoginAfterOrder: z.boolean().optional(),
    requireAddress: z.boolean().optional(),
    requireProvince: z.boolean().optional(),
    paymentMethods: z.array(z.string().trim()).optional(),
  })
  .optional();

const themeSchema = z
  .object({
    primaryColor: z.string().trim().optional(),
    accentColor: z.string().trim().optional(),
    layoutType: z.enum(["default", "compact", "landing"]).optional(),
  })
  .optional();

const createShopSchema = z.object({
  name: z.string().trim().min(1, "Shop name is required"),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  logoUrl: z.string().trim().optional(),
  bannerUrl: z.string().trim().optional(),
  domains: z.array(z.string().trim().toLowerCase()).optional(),
  campaignId: z.string().trim().optional(),
  contact: contactSchema,
  staff: staffSchema,
  sheetConfig: sheetConfigSchema,
  checkoutConfig: checkoutConfigSchema,
  theme: themeSchema,
  status: statusSchema.optional(),
});

const updateShopSchema = createShopSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Update data is required",
  });

function validate(schema, data, message = "Invalid data") {
  const parsed = schema.safeParse(data ?? {});

  if (!parsed.success) {
    const error = new Error(message);
    error.statusCode = 400;
    error.errors = parsed.error.flatten();
    throw error;
  }

  return parsed.data;
}

function assertNotEmptyPayload(payload, message = "Update data is required") {
  if (!payload || Object.keys(payload).length === 0) {
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }
}

const createShop = asyncHandler(async (req, res) => {
  const payload = validate(createShopSchema, req.body, "Invalid shop data");
  const shop = await shopService.createShop(payload, req.user);

  return successResponse(res, {
    statusCode: 201,
    message: "Shop created",
    data: { shop },
  });
});

const listShops = asyncHandler(async (req, res) => {
  const querySchema = z.object({
    status: statusSchema.optional(),
    page: z.string().trim().optional(),
    limit: z.string().trim().optional(),
    sortBy: z.string().trim().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  });
  const query = validate(querySchema, req.query, "Invalid shop query");
  const { shops, pagination } = await shopService.listShops(query);

  return successResponse(res, {
    message: "Shop list",
    data: { shops, pagination },
  });
});

const getShopById = asyncHandler(async (req, res) => {
  const shop = await shopService.getShopById(req.params.shopId);

  return successResponse(res, {
    message: "Shop detail",
    data: { shop },
  });
});

const updateShop = asyncHandler(async (req, res) => {
  const payload = validate(updateShopSchema, req.body);
  assertNotEmptyPayload(payload, "Shop update data is required");

  const shop = await shopService.updateShop(req.params.shopId, payload);

  return successResponse(res, {
    message: "Shop updated",
    data: {
      shop,
    },
  });
});

const deleteShop = asyncHandler(async (req, res) => {
  const shop = await shopService.softDeleteShop(req.params.shopId);

  return successResponse(res, {
    message: "Shop deleted",
    data: { shop },
  });
});

const getPublicShopBySlug = asyncHandler(async (req, res) => {
  const shop = await shopService.getPublicShopBySlug(req.params.slug);

  return successResponse(res, {
    message: "Public shop detail",
    data: { shop },
  });
});

module.exports = {
  createShop,
  listShops,
  getShopById,
  updateShop,
  deleteShop,
  getPublicShopBySlug,
};
