const mongoose = require("mongoose");
const { Category, Product, Shop } = require("../../models/index.js");
const { isHttpUrl, normalizeSlug } = require("../../utils/validators.js");

const DEFAULT_CATEGORY_NAME = "Sản phẩm cần tư vấn";
const MAX_IMPORT_PRODUCTS = 500;
const VALID_PRICE_MODES = new Set(["fixed", "contact", "hidden"]);
const VALID_STATUSES = new Set(["active", "draft", "inactive"]);

function createHttpError(message, statusCode = 400, extra = {}) {
  const error = new Error(message);
  error.statusCode = statusCode;
  Object.assign(error, extra);
  return error;
}

function assertValidObjectId(id, message) {
  if (
    !mongoose.Types.ObjectId.isValid(id) ||
    new mongoose.Types.ObjectId(id).toString() !== String(id)
  ) {
    throw createHttpError(message, 400);
  }
}

async function ensureShopExists(shopId) {
  assertValidObjectId(shopId, "Invalid shop id");

  const shop = await Shop.findById(shopId).select("_id slug status");

  if (!shop) {
    throw createHttpError("Shop not found", 404);
  }

  return shop;
}

function assertShopSlugMatches(shop, jsonShopSlug) {
  const normalizedJsonSlug = normalizeSlug(jsonShopSlug);

  if (!normalizedJsonSlug || normalizedJsonSlug === shop.slug) {
    return;
  }

  throw createHttpError("JSON shopSlug không khớp với shop hiện tại.", 400, {
    code: "SHOP_SLUG_MISMATCH",
    currentShopSlug: shop.slug,
    jsonShopSlug: normalizedJsonSlug,
    hint: "Đổi shopSlug trong JSON hoặc mở đúng shop để import.",
  });
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeSku(value, fallback) {
  const normalized = normalizeText(value).toUpperCase();
  return normalized || normalizeText(fallback).toUpperCase();
}

function normalizeImportKey(value) {
  return normalizeText(value);
}

function normalizeStatus(value) {
  const status = normalizeText(value || "draft").toLowerCase();
  return VALID_STATUSES.has(status) ? status : "draft";
}

function normalizePrice(value) {
  const price = Number(value || 0);
  return Number.isFinite(price) && price > 0 ? price : 0;
}

function normalizePriceMode(value, price) {
  if (price <= 0) {
    return "contact";
  }

  const priceMode = normalizeText(value || "fixed").toLowerCase();
  return VALID_PRICE_MODES.has(priceMode) ? priceMode : "fixed";
}

function getPriceModeWarning(value, price) {
  const raw = normalizeText(value);

  if (price <= 0 || !raw || VALID_PRICE_MODES.has(raw.toLowerCase())) {
    return "";
  }

  return "priceMode không hợp lệ";
}

function normalizeSalePrice(value, priceMode, price) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const salePrice = Number(value);

  if (!Number.isFinite(salePrice) || salePrice < 0) {
    return null;
  }

  if (priceMode === "fixed" && salePrice > price) {
    return null;
  }

  return salePrice;
}

function imageToUrl(image) {
  if (typeof image === "string") return image;
  if (image && typeof image === "object") return image.url;
  return "";
}

function normalizeImages(product, warnings, rowNumber) {
  const seen = new Set();
  const images = [];
  const rawImages = Array.isArray(product.images) ? product.images : [];

  rawImages.forEach((image) => {
    const url = normalizeText(imageToUrl(image));

    if (!url) return;

    if (!isHttpUrl(url)) {
      warnings.push({
        row: rowNumber,
        importKey: normalizeImportKey(product.importKey),
        message: `Image URL ignored because it is invalid: ${url}`,
      });
      return;
    }

    if (!seen.has(url)) {
      seen.add(url);
      images.push(url);
    }
  });

  const thumbnailUrl = normalizeText(product.thumbnailUrl);

  if (thumbnailUrl && isHttpUrl(thumbnailUrl) && !seen.has(thumbnailUrl)) {
    images.unshift(thumbnailUrl);
    seen.add(thumbnailUrl);
  }

  if (thumbnailUrl && !isHttpUrl(thumbnailUrl)) {
    warnings.push({
      row: rowNumber,
      importKey: normalizeImportKey(product.importKey),
      message: `Thumbnail URL ignored because it is invalid: ${thumbnailUrl}`,
    });
  }

  return {
    images,
    thumbnailUrl: isHttpUrl(thumbnailUrl) && thumbnailUrl
      ? thumbnailUrl
      : images[0] || "",
  };
}

function normalizeAttributes(attributes) {
  if (!attributes || Array.isArray(attributes) || typeof attributes !== "object") {
    return {};
  }

  return attributes;
}

function buildSlug(product) {
  return (
    normalizeSlug(product.slug || product.name || product.importKey) ||
    normalizeSlug(product.importKey) ||
    "san-pham"
  );
}

function buildNormalizedProduct(product, sourceSystem, warnings, rowNumber) {
  const importKey = normalizeImportKey(product.importKey);
  const name = normalizeText(product.name);
  const sku = normalizeSku(product.sku, importKey);
  const price = normalizePrice(product.price);
  const priceModeWarning = getPriceModeWarning(product.priceMode, price);
  const priceMode = normalizePriceMode(product.priceMode, price);
  const salePrice = normalizeSalePrice(product.salePrice, priceMode, price);
  const categoryName = normalizeText(product.categoryName) || DEFAULT_CATEGORY_NAME;
  const { images, thumbnailUrl } = normalizeImages(product, warnings, rowNumber);

  if (priceModeWarning) {
    warnings.push({ row: rowNumber, importKey, message: priceModeWarning });
  }

  return {
    importKey,
    sku,
    sourceProductId: normalizeText(product.sourceProductId),
    sourceSystem: normalizeText(product.sourceSystem || sourceSystem),
    name,
    slug: buildSlug(product),
    categoryName,
    price,
    salePrice,
    priceMode,
    thumbnailUrl,
    images,
    shortDescription: normalizeText(product.shortDescription),
    description: normalizeText(product.description),
    status: normalizeStatus(product.status),
    attributes: normalizeAttributes(product.attributes),
  };
}

function createEmptySummary(total) {
  return {
    total,
    valid: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    warnings: [],
    categoriesToCreate: [],
    categoriesCreated: [],
    preview: [],
  };
}

function getExistingProduct(normalizedProduct, byImportKey, bySku) {
  return (
    byImportKey.get(normalizedProduct.importKey) ||
    bySku.get(normalizedProduct.sku) ||
    null
  );
}

function getUniqueSlug(baseSlug, usedSlugs, currentProduct = null) {
  const currentSlug = currentProduct?.slug;

  if (currentSlug === baseSlug) {
    return baseSlug;
  }

  let slug = baseSlug;
  let index = 2;

  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${index}`;
    index += 1;
  }

  usedSlugs.add(slug);
  return slug;
}

function buildProductUpdateData(normalizedProduct, category) {
  return {
    importKey: normalizedProduct.importKey,
    sourceProductId: normalizedProduct.sourceProductId,
    sourceSystem: normalizedProduct.sourceSystem,
    sku: normalizedProduct.sku,
    name: normalizedProduct.name,
    slug: normalizedProduct.slug,
    categoryIds: category ? [category._id] : [],
    price: normalizedProduct.price,
    salePrice: normalizedProduct.salePrice,
    priceMode: normalizedProduct.priceMode,
    thumbnailUrl: normalizedProduct.thumbnailUrl,
    images: normalizedProduct.images,
    shortDescription: normalizedProduct.shortDescription,
    description: normalizedProduct.description,
    status: normalizedProduct.status,
    attributes: normalizedProduct.attributes,
  };
}

async function buildImportContext(shopId, normalizedRows, dryRun) {
  const categoryNames = [
    ...new Set(normalizedRows.map(({ normalizedProduct }) => normalizedProduct.categoryName)),
  ];
  const importKeys = normalizedRows.map(({ normalizedProduct }) => normalizedProduct.importKey);
  const skus = normalizedRows.map(({ normalizedProduct }) => normalizedProduct.sku);

  const [categories, products, slugProducts] = await Promise.all([
    Category.find({ shopId, name: { $in: categoryNames } }),
    Product.find({
      shopId,
      $or: [
        { importKey: { $in: importKeys } },
        { sku: { $in: skus } },
      ],
    }),
    Product.find({ shopId }).select("_id slug"),
  ]);

  const categoryByName = new Map(
    categories.map((category) => [category.name, category]),
  );
  const categoriesToCreate = categoryNames.filter((name) => !categoryByName.has(name));
  const categoriesCreated = [];

  if (!dryRun && categoriesToCreate.length) {
    const usedCategorySlugs = new Set(categories.map((category) => category.slug));
    const docs = categoriesToCreate.map((name) => {
      const baseSlug = normalizeSlug(name) || "san-pham-can-tu-van";
      const slug = getUniqueSlug(baseSlug, usedCategorySlugs);
      return { shopId, name, slug, status: "active" };
    });
    const createdCategories = await Category.insertMany(docs, { ordered: false });
    createdCategories.forEach((category) => {
      categoryByName.set(category.name, category);
      categoriesCreated.push(category.name);
    });
  }

  return {
    categoryByName,
    categoriesToCreate,
    categoriesCreated,
    productByImportKey: new Map(
      products
        .filter((product) => product.importKey)
        .map((product) => [product.importKey, product]),
    ),
    productBySku: new Map(products.map((product) => [product.sku, product])),
    usedProductSlugs: new Set(slugProducts.map((product) => product.slug)),
  };
}

async function importProducts({
  shopId,
  products,
  dryRun = true,
  source = "",
  shopSlug = "",
}) {
  const shop = await ensureShopExists(shopId);
  assertShopSlugMatches(shop, shopSlug);

  if (!Array.isArray(products)) {
    throw createHttpError("products must be an array", 400);
  }

  if (products.length > MAX_IMPORT_PRODUCTS) {
    throw createHttpError(
      `Import limit exceeded. Maximum ${MAX_IMPORT_PRODUCTS} products per request.`,
      400,
    );
  }

  const summary = createEmptySummary(products.length);
  const normalizedRows = [];

  products.forEach((product, index) => {
    const rowNumber = index + 1;
    const importKey = normalizeImportKey(product?.importKey);
    const name = normalizeText(product?.name);

    if (!importKey || !name) {
      const message = !importKey ? "Thiếu importKey" : "Thiếu name";
      summary.skipped += 1;
      summary.errors.push({ row: rowNumber, importKey, message });
      summary.preview.push({
        importKey,
        sku: normalizeText(product?.sku),
        name,
        categoryName: normalizeText(product?.categoryName),
        price: normalizePrice(product?.price),
        priceMode: "contact",
        status: normalizeStatus(product?.status),
        action: "error",
        message,
      });
      return;
    }

    const normalizedProduct = buildNormalizedProduct(
      product,
      source,
      summary.warnings,
      rowNumber,
    );
    normalizedRows.push({ rowNumber, normalizedProduct });
    summary.valid += 1;
  });

  const context = await buildImportContext(shopId, normalizedRows, dryRun);
  summary.categoriesToCreate = context.categoriesToCreate;
  summary.categoriesCreated = context.categoriesCreated;

  const bulkOps = [];

  normalizedRows.forEach(({ rowNumber, normalizedProduct }) => {
    try {
      const existingProduct = getExistingProduct(
        normalizedProduct,
        context.productByImportKey,
        context.productBySku,
      );
      const action = existingProduct ? "update" : "create";

      if (action === "create") summary.created += 1;
      if (action === "update") summary.updated += 1;

      const category = context.categoryByName.get(normalizedProduct.categoryName);
      const slug = getUniqueSlug(
        normalizedProduct.slug,
        context.usedProductSlugs,
        existingProduct,
      );
      const updateData = buildProductUpdateData(
        { ...normalizedProduct, slug },
        category,
      );

      if (!dryRun) {
        if (existingProduct) {
          bulkOps.push({
            updateOne: {
              filter: { _id: existingProduct._id },
              update: { $set: updateData },
              runValidators: true,
            },
          });
        } else {
          bulkOps.push({
            insertOne: {
              document: {
                ...updateData,
                shopId,
              },
            },
          });
        }
      }

      summary.preview.push({
        importKey: normalizedProduct.importKey,
        sku: normalizedProduct.sku,
        name: normalizedProduct.name,
        categoryName: normalizedProduct.categoryName,
        price: normalizedProduct.price,
        priceMode: normalizedProduct.priceMode,
        status: normalizedProduct.status,
        action,
        message: dryRun
          ? action === "create" ? "Ready to create" : "Ready to update"
          : action === "create" ? "Created" : "Updated",
      });
    } catch (error) {
      summary.skipped += 1;
      summary.errors.push({
        row: rowNumber,
        importKey: normalizedProduct.importKey,
        message: error.message,
      });
      summary.preview.push({
        importKey: normalizedProduct.importKey,
        sku: normalizedProduct.sku,
        name: normalizedProduct.name,
        categoryName: normalizedProduct.categoryName,
        price: normalizedProduct.price,
        priceMode: normalizedProduct.priceMode,
        status: normalizedProduct.status,
        action: "error",
        message: error.message,
      });
    }
  });

  if (!dryRun && bulkOps.length) {
    await Product.bulkWrite(bulkOps, { ordered: false });
  }

  return summary;
}

module.exports = {
  MAX_IMPORT_PRODUCTS,
  importProducts,
};
