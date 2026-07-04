const { z } = require("zod");
const asyncHandler = require("../../utils/asyncHandler.js");
const { successResponse } = require("../../utils/apiResponse.js");
const productService = require("./product.service.js");

const statusSchema = z.enum(["active", "inactive", "draft"]);
const priceModeSchema = z.enum(["fixed", "contact", "hidden"]);
const booleanQuerySchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const inventorySchema = z
  .object({
    trackStock: z.boolean().optional(),
    stockQuantity: z.number().min(0).nullable().optional(),
  })
  .optional();

const productBodySchema = z.object({
  sku: z.string().trim().min(1, "Product SKU is required"),
  name: z.string().trim().min(1, "Product name is required"),
  slug: z.string().trim().optional(),
  categoryIds: z.array(z.string().trim()).optional(),
  tags: z.array(z.string().trim().toLowerCase()).optional(),
  shortDescription: z.string().trim().optional(),
  description: z.string().trim().optional(),
  price: z.number().min(0).optional(),
  salePrice: z.number().min(0).nullable().optional(),
  priceMode: priceModeSchema.optional(),
  thumbnailUrl: z.string().trim().optional(),
  images: z.array(z.string().trim()).optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  inventory: inventorySchema,
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().optional(),
  status: statusSchema.optional(),
});

const updateProductSchema = productBodySchema.partial();

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

function validateUpdateBody(data) {
  if (!data || Object.keys(data).length === 0) {
    const error = new Error("Product update data is required");
    error.statusCode = 400;
    throw error;
  }

  return validate(updateProductSchema, data, "Invalid product data");
}

const createProduct = asyncHandler(async (req, res) => {
  const payload = validate(productBodySchema, req.body, "Invalid product data");
  const product = await productService.createProduct(req.params.shopId, payload);

  return successResponse(res, {
    statusCode: 201,
    message: "Product created",
    data: { product },
  });
});

const listAdminProducts = asyncHandler(async (req, res) => {
  const querySchema = z.object({
    status: statusSchema.optional(),
    categoryId: z.string().trim().optional(),
    q: z.string().trim().optional(),
    isFeatured: booleanQuerySchema.optional(),
    page: z.string().trim().optional(),
    limit: z.string().trim().optional(),
    sortBy: z.string().trim().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  });
  const query = validate(querySchema, req.query, "Invalid product query");
  const { products, pagination } = await productService.listAdminProducts(
    req.params.shopId,
    query,
  );

  return successResponse(res, {
    message: "Product list",
    data: { products, pagination },
  });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.productId);

  return successResponse(res, {
    message: "Product detail",
    data: { product },
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const payload = validateUpdateBody(req.body);
  const product = await productService.updateProduct(
    req.params.productId,
    payload,
  );

  return successResponse(res, {
    message: "Product updated",
    data: { product },
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await productService.softDeleteProduct(req.params.productId);

  return successResponse(res, {
    message: "Product deleted",
    data: { product },
  });
});

const listPublicProducts = asyncHandler(async (req, res) => {
  const querySchema = z.object({
    categoryId: z.string().trim().optional(),
    tag: z.string().trim().optional(),
    q: z.string().trim().optional(),
    featured: booleanQuerySchema.optional(),
  });
  const query = validate(querySchema, req.query, "Invalid product query");
  const products = await productService.listPublicProducts(
    req.params.slug,
    query,
  );

  return successResponse(res, {
    message: "Public product list",
    data: { products },
  });
});

const getPublicProductBySlug = asyncHandler(async (req, res) => {
  const product = await productService.getPublicProductBySlug(
    req.params.slug,
    req.params.productSlug,
  );

  return successResponse(res, {
    message: "Public product detail",
    data: { product },
  });
});

module.exports = {
  createProduct,
  listAdminProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  listPublicProducts,
  getPublicProductBySlug,
};
