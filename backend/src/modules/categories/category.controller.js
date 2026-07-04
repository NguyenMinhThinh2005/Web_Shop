const { z } = require("zod");
const asyncHandler = require("../../utils/asyncHandler.js");
const { successResponse } = require("../../utils/apiResponse.js");
const categoryService = require("./category.service.js");

const statusSchema = z.enum(["active", "inactive"]);

const categoryBodySchema = z.object({
  name: z.string().trim().min(1, "Category name is required"),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  parentId: z.string().trim().nullable().optional(),
  sortOrder: z.number().optional(),
  status: statusSchema.optional(),
});

const updateCategorySchema = categoryBodySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Category update data is required",
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

const createCategory = asyncHandler(async (req, res) => {
  const payload = validate(
    categoryBodySchema,
    req.body,
    "Invalid category data",
  );
  const category = await categoryService.createCategory(
    req.params.shopId,
    payload,
  );

  return successResponse(res, {
    statusCode: 201,
    message: "Category created",
    data: { category },
  });
});

const listAdminCategories = asyncHandler(async (req, res) => {
  const querySchema = z.object({
    status: statusSchema.optional(),
    page: z.string().trim().optional(),
    limit: z.string().trim().optional(),
    sortBy: z.string().trim().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  });
  const query = validate(querySchema, req.query, "Invalid category query");
  const { categories, pagination } = await categoryService.listAdminCategories(
    req.params.shopId,
    query,
  );

  return successResponse(res, {
    message: "Category list",
    data: { categories, pagination },
  });
});

const getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.categoryId);

  return successResponse(res, {
    message: "Category detail",
    data: { category },
  });
});

const updateCategory = asyncHandler(async (req, res) => {
  const payload = validate(
    updateCategorySchema,
    req.body,
    "Category update data is required",
  );
  const category = await categoryService.updateCategory(
    req.params.categoryId,
    payload,
  );

  return successResponse(res, {
    message: "Category updated",
    data: { category },
  });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.softDeleteCategory(
    req.params.categoryId,
  );

  return successResponse(res, {
    message: "Category deleted",
    data: { category },
  });
});

const listPublicCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.listPublicCategories(
    req.params.slug,
  );

  return successResponse(res, {
    message: "Public category list",
    data: { categories },
  });
});

module.exports = {
  createCategory,
  listAdminCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  listPublicCategories,
};
