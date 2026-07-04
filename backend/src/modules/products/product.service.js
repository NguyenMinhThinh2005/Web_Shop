const mongoose = require("mongoose");
const { Category, Product, Shop } = require("../../models/index.js");
const {
  isHttpUrl,
  normalizeSlug,
} = require("../../utils/validators.js");

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
    const error = new Error("Product slug is required");
    error.statusCode = 400;
    throw error;
  }

  return normalizedSlug;
}

function normalizeSku(sku) {
  return String(sku || "").trim().toUpperCase();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyDuplicateKeyError(error) {
  if (error.code !== 11000) {
    return;
  }

  if (error.keyPattern && error.keyPattern.sku) {
    error.message = "SKU này đã tồn tại trong shop.";
    error.statusCode = 409;
    return;
  }

  if (error.keyPattern && error.keyPattern.slug) {
    error.message = "Slug sản phẩm đã tồn tại trong shop.";
    error.statusCode = 409;
    return;
  }

  error.message = "Product already exists";
  error.statusCode = 409;
}

async function ensureShopExists(shopId, { activeOnly = false } = {}) {
  assertValidObjectId(shopId, "Invalid shop id");

  const filter = { _id: shopId };

  if (activeOnly) {
    filter.status = "active";
  }

  const shop = await Shop.findOne(filter).select("_id slug status");

  if (!shop) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  return shop;
}

async function getActiveShopBySlug(slug) {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  const shop = await Shop.findOne({
    slug: normalizedSlug,
    status: "active",
  }).select("_id slug status");

  if (!shop) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  return shop;
}

async function ensureSkuAvailable(shopId, sku, exceptProductId = null) {
  const query = { shopId, sku };

  if (exceptProductId) {
    query._id = { $ne: exceptProductId };
  }

  const existingProduct = await Product.findOne(query).select("_id");

  if (existingProduct) {
    const error = new Error("SKU này đã tồn tại trong shop.");
    error.statusCode = 409;
    throw error;
  }
}

async function ensureSlugAvailable(shopId, slug, exceptProductId = null) {
  const query = { shopId, slug };

  if (exceptProductId) {
    query._id = { $ne: exceptProductId };
  }

  const existingProduct = await Product.findOne(query).select("_id");

  if (existingProduct) {
    const error = new Error("Slug sản phẩm đã tồn tại trong shop.");
    error.statusCode = 409;
    throw error;
  }
}

function assertHttpUrl(value, message) {
  if (!isHttpUrl(value)) {
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }
}

function normalizeImages(images) {
  if (images === undefined) {
    return undefined;
  }

  const uniqueImages = [];
  const seen = new Set();

  images.forEach((image) => {
    const imageUrl = String(image || "").trim();

    if (!imageUrl) {
      return;
    }

    assertHttpUrl(imageUrl, "Image URL không hợp lệ.");

    if (!seen.has(imageUrl)) {
      seen.add(imageUrl);
      uniqueImages.push(imageUrl);
    }
  });

  return uniqueImages;
}

function normalizeAttributes(attributes) {
  if (attributes === undefined) {
    return undefined;
  }

  if (
    attributes === null ||
    Array.isArray(attributes) ||
    typeof attributes !== "object"
  ) {
    const error = new Error("Product attributes must be an object");
    error.statusCode = 400;
    throw error;
  }

  return attributes;
}

function normalizeProductPayload(payload, existingProduct = null) {
  const data = { ...payload };

  if (Object.prototype.hasOwnProperty.call(data, "sku")) {
    data.sku = normalizeSku(data.sku);
  }

  if (Object.prototype.hasOwnProperty.call(data, "slug")) {
    data.slug = normalizeSlug(data.slug);
  }

  if (Object.prototype.hasOwnProperty.call(data, "thumbnailUrl")) {
    assertHttpUrl(data.thumbnailUrl, "Thumbnail URL không hợp lệ.");
    data.thumbnailUrl = String(data.thumbnailUrl || "").trim();
  }

  if (Object.prototype.hasOwnProperty.call(data, "images")) {
    data.images = normalizeImages(data.images);
  }

  if (Object.prototype.hasOwnProperty.call(data, "attributes")) {
    data.attributes = normalizeAttributes(data.attributes);
  } else if (!existingProduct) {
    data.attributes = {};
  }

  const effectivePriceMode =
    data.priceMode || (existingProduct ? existingProduct.priceMode : "fixed");

  if (effectivePriceMode === "fixed") {
    const effectivePrice = Object.prototype.hasOwnProperty.call(data, "price")
      ? data.price
      : existingProduct
        ? existingProduct.price
        : undefined;

    if (effectivePrice === undefined || effectivePrice === null) {
      const error = new Error("Product price is required");
      error.statusCode = 400;
      throw error;
    }

    const effectiveSalePrice = Object.prototype.hasOwnProperty.call(
      data,
      "salePrice",
    )
      ? data.salePrice
      : existingProduct
        ? existingProduct.salePrice
        : null;

    if (
      typeof effectiveSalePrice === "number" &&
      effectiveSalePrice > effectivePrice
    ) {
      const error = new Error("Giá khuyến mãi không được lớn hơn giá gốc.");
      error.statusCode = 400;
      throw error;
    }
  }

  if (effectivePriceMode === "contact" || effectivePriceMode === "hidden") {
    if (!existingProduct && !Object.prototype.hasOwnProperty.call(data, "price")) {
      data.price = 0;
    }

    if (!Object.prototype.hasOwnProperty.call(data, "salePrice")) {
      data.salePrice = null;
    }
  }

  if (
    (!data.thumbnailUrl || data.thumbnailUrl === "") &&
    Array.isArray(data.images) &&
    data.images.length > 0
  ) {
    data.thumbnailUrl = data.images[0];
  }

  return data;
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
    "sku",
    "price",
    "status",
  ]);
  const sortBy = allowedFields.has(filters.sortBy) ? filters.sortBy : null;
  const sortOrder = filters.sortOrder === "desc" ? -1 : 1;

  if (sortBy) {
    return { [sortBy]: sortOrder };
  }

  return { sortOrder: 1, createdAt: -1 };
}

async function validateCategoryIds(categoryIds, shopId) {
  if (categoryIds === undefined) {
    return undefined;
  }

  if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
    return [];
  }

  const uniqueCategoryIds = [...new Set(categoryIds.map((id) => String(id)))];

  uniqueCategoryIds.forEach((categoryId) => {
    assertValidObjectId(categoryId, "Invalid category id");
  });

  const categoryCount = await Category.countDocuments({
    _id: { $in: uniqueCategoryIds },
    shopId,
  });

  if (categoryCount !== uniqueCategoryIds.length) {
    const error = new Error("Category not found or not in shop");
    error.statusCode = 404;
    throw error;
  }

  return uniqueCategoryIds;
}

function buildProductFilter(shopId, filters = {}) {
  const filter = { shopId };

  if (filters.status) {
    filter.status = filters.status;
  }

  if (filters.categoryId) {
    assertValidObjectId(filters.categoryId, "Invalid category id");
    filter.categoryIds = filters.categoryId;
  }

  if (filters.isFeatured !== undefined) {
    filter.isFeatured = filters.isFeatured;
  }

  if (filters.featured !== undefined) {
    filter.isFeatured = filters.featured;
  }

  if (filters.tag) {
    filter.tags = String(filters.tag).trim().toLowerCase();
  }

  if (filters.q) {
    const searchRegex = new RegExp(escapeRegex(filters.q.trim()), "i");
    filter.$or = [{ name: searchRegex }, { sku: searchRegex }];
  }

  return filter;
}

async function createProduct(shopId, payload) {
  await ensureShopExists(shopId);

  const normalizedPayload = normalizeProductPayload(payload);
  const sku = normalizedPayload.sku;
  const slug = buildSlug({ slug: normalizedPayload.slug, name: payload.name });
  const categoryIds = await validateCategoryIds(
    normalizedPayload.categoryIds,
    shopId,
  );

  await ensureSkuAvailable(shopId, sku);
  await ensureSlugAvailable(shopId, slug);

  try {
    return await Product.create({
      ...payload,
      ...normalizedPayload,
      shopId,
      sku,
      slug,
      categoryIds: categoryIds || [],
    });
  } catch (error) {
    applyDuplicateKeyError(error);
    throw error;
  }
}

async function listAdminProducts(shopId, filters = {}) {
  await ensureShopExists(shopId);

  const filter = buildProductFilter(shopId, filters);
  const { page, limit, skip } = buildPagination(filters);

  const [products, total] = await Promise.all([
    Product.find(filter).sort(buildSort(filters)).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getProductById(productId) {
  assertValidObjectId(productId, "Invalid product id");

  const product = await Product.findById(productId);

  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  return product;
}

async function updateProduct(productId, payload) {
  const product = await getProductById(productId);
  const updateData = normalizeProductPayload(payload, product);
  const shopId = product.shopId;

  if (Object.prototype.hasOwnProperty.call(updateData, "sku")) {
    await ensureSkuAvailable(shopId, updateData.sku, productId);
  }

  if (Object.prototype.hasOwnProperty.call(updateData, "slug")) {
    updateData.slug = buildSlug({
      slug: updateData.slug,
      name: updateData.name,
    });
    await ensureSlugAvailable(shopId, updateData.slug, productId);
  }

  if (Object.prototype.hasOwnProperty.call(updateData, "categoryIds")) {
    updateData.categoryIds = await validateCategoryIds(
      updateData.categoryIds,
      shopId,
    );
  }

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedProduct) {
      const error = new Error("Product not found");
      error.statusCode = 404;
      throw error;
    }

    return updatedProduct;
  } catch (error) {
    applyDuplicateKeyError(error);
    throw error;
  }
}

async function softDeleteProduct(productId) {
  await getProductById(productId);

  return Product.findByIdAndUpdate(
    productId,
    { status: "inactive" },
    { new: true, runValidators: true },
  );
}

async function listPublicProducts(shopSlug, filters = {}) {
  const shop = await getActiveShopBySlug(shopSlug);
  const filter = buildProductFilter(shop._id, {
    ...filters,
    status: "active",
  });

  return Product.find(filter).sort({ sortOrder: 1, createdAt: -1 });
}

async function getPublicProductBySlug(shopSlug, productSlug) {
  const shop = await getActiveShopBySlug(shopSlug);
  const normalizedProductSlug = normalizeSlug(productSlug);

  if (!normalizedProductSlug) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  const product = await Product.findOne({
    shopId: shop._id,
    slug: normalizedProductSlug,
    status: "active",
  });

  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  return product;
}

module.exports = {
  createProduct,
  listAdminProducts,
  getProductById,
  updateProduct,
  softDeleteProduct,
  listPublicProducts,
  getPublicProductBySlug,
};
