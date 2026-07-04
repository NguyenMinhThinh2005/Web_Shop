const mongoose = require("mongoose");
const { Category, Shop } = require("../../models/index.js");
const { normalizeSlug } = require("../../utils/validators.js");

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

function buildSlug({ slug, name }) {
  const normalizedSlug = normalizeSlug(slug || name);

  if (!normalizedSlug) {
    const error = new Error("Category slug is required");
    error.statusCode = 400;
    throw error;
  }

  return normalizedSlug;
}

async function ensureShopExists(shopId) {
  assertValidObjectId(shopId, "Invalid shop id");

  const shop = await Shop.findById(shopId).select("_id slug status");

  if (!shop) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  return shop;
}

async function ensureSlugAvailable(shopId, slug, exceptCategoryId = null) {
  const query = { shopId, slug };

  if (exceptCategoryId) {
    query._id = { $ne: exceptCategoryId };
  }

  const existingCategory = await Category.findOne(query).select("_id");

  if (existingCategory) {
    const error = new Error("Slug danh mục đã tồn tại trong shop.");
    error.statusCode = 409;
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

function buildSort(filters = {}) {
  const allowedFields = new Set([
    "sortOrder",
    "createdAt",
    "updatedAt",
    "name",
    "slug",
    "status",
  ]);
  const sortBy = allowedFields.has(filters.sortBy) ? filters.sortBy : null;
  const sortOrder = filters.sortOrder === "desc" ? -1 : 1;

  if (sortBy) {
    return { [sortBy]: sortOrder };
  }

  return { sortOrder: 1, createdAt: -1 };
}

async function validateParent({ parentId, shopId, categoryId = null }) {
  if (parentId === null || parentId === undefined) {
    return null;
  }

  assertValidObjectId(parentId, "Invalid parent category id");

  if (categoryId && String(parentId) === String(categoryId)) {
    const error = new Error("Category parent cannot be itself");
    error.statusCode = 400;
    throw error;
  }

  const parentCategory = await Category.findById(parentId).select("_id shopId");

  if (!parentCategory || String(parentCategory.shopId) !== String(shopId)) {
    const error = new Error("Parent category not found in this shop");
    error.statusCode = 404;
    throw error;
  }

  return parentCategory;
}

async function createCategory(shopId, payload) {
  await ensureShopExists(shopId);

  const slug = buildSlug({ slug: payload.slug, name: payload.name });

  await ensureSlugAvailable(shopId, slug);
  await validateParent({ parentId: payload.parentId, shopId });

  try {
    return await Category.create({
      ...payload,
      shopId,
      slug,
      parentId: payload.parentId || null,
    });
  } catch (error) {
    if (error.code === 11000) {
      error.message = "Slug danh mục đã tồn tại trong shop.";
      error.statusCode = 409;
    }

    throw error;
  }
}

async function listAdminCategories(shopId, filters = {}) {
  await ensureShopExists(shopId);

  const filter = { shopId };
  const { page, limit, skip } = buildPagination(filters);

  if (filters.status) {
    filter.status = filters.status;
  }

  const [categories, total] = await Promise.all([
    Category.find(filter).sort(buildSort(filters)).skip(skip).limit(limit),
    Category.countDocuments(filter),
  ]);

  return {
    categories,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getCategoryById(categoryId) {
  assertValidObjectId(categoryId, "Invalid category id");

  const category = await Category.findById(categoryId);

  if (!category) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  return category;
}

async function updateCategory(categoryId, payload) {
  const category = await getCategoryById(categoryId);
  const updateData = { ...payload };
  const shopId = category.shopId;

  if (Object.prototype.hasOwnProperty.call(updateData, "slug")) {
    updateData.slug = buildSlug({
      slug: updateData.slug,
      name: updateData.name,
    });
    await ensureSlugAvailable(shopId, updateData.slug, categoryId);
  }

  if (Object.prototype.hasOwnProperty.call(updateData, "parentId")) {
    await validateParent({
      parentId: updateData.parentId,
      shopId,
      categoryId,
    });
  }

  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedCategory) {
      const error = new Error("Category not found");
      error.statusCode = 404;
      throw error;
    }

    return updatedCategory;
  } catch (error) {
    if (error.code === 11000) {
      error.message = "Slug danh mục đã tồn tại trong shop.";
      error.statusCode = 409;
    }

    throw error;
  }
}

async function softDeleteCategory(categoryId) {
  await getCategoryById(categoryId);

  return Category.findByIdAndUpdate(
    categoryId,
    { status: "inactive" },
    { new: true, runValidators: true },
  );
}

async function listPublicCategories(shopSlug) {
  const normalizedSlug = normalizeSlug(shopSlug);

  if (!normalizedSlug) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  const shop = await Shop.findOne({
    slug: normalizedSlug,
    status: "active",
  }).select("_id");

  if (!shop) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  return Category.find({
    shopId: shop._id,
    status: "active",
  }).sort({ sortOrder: 1, createdAt: -1 });
}

module.exports = {
  createCategory,
  listAdminCategories,
  getCategoryById,
  updateCategory,
  softDeleteCategory,
  listPublicCategories,
};
