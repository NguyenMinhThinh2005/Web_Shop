const mongoose = require("mongoose");
const { Shop } = require("../../models/index.js");
const {
  isHttpUrl,
  isValidVietnamPhone,
  normalizePhone,
  normalizeSlug,
} = require("../../utils/validators.js");

function assertValidObjectId(shopId) {
  if (
    !mongoose.Types.ObjectId.isValid(shopId) ||
    new mongoose.Types.ObjectId(shopId).toString() !== shopId
  ) {
    const error = new Error("Invalid shop id");
    error.statusCode = 400;
    throw error;
  }
}

function buildSlug({ slug, name }) {
  const normalizedSlug = normalizeSlug(slug || name);

  if (!normalizedSlug) {
    const error = new Error("Shop slug is required");
    error.statusCode = 400;
    throw error;
  }

  return normalizedSlug;
}

async function ensureSlugAvailable(slug, exceptShopId = null) {
  const query = { slug };

  if (exceptShopId) {
    query._id = { $ne: exceptShopId };
  }

  const existingShop = await Shop.findOne(query).select("_id");

  if (existingShop) {
    const error = new Error("Slug shop đã tồn tại, vui lòng chọn slug khác.");
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

function normalizeOptionalUrl(value) {
  return String(value || "").trim();
}

function normalizeShopPayload(payload) {
  const data = { ...payload };

  if (Object.prototype.hasOwnProperty.call(data, "logoUrl")) {
    assertHttpUrl(data.logoUrl, "Logo URL không hợp lệ.");
    data.logoUrl = normalizeOptionalUrl(data.logoUrl);
  }

  if (Object.prototype.hasOwnProperty.call(data, "bannerUrl")) {
    assertHttpUrl(data.bannerUrl, "Banner URL không hợp lệ.");
    data.bannerUrl = normalizeOptionalUrl(data.bannerUrl);
  }

  if (data.contact) {
    data.contact = { ...data.contact };

    if (Object.prototype.hasOwnProperty.call(data.contact, "zaloUrl")) {
      assertHttpUrl(data.contact.zaloUrl, "Zalo URL không hợp lệ.");
      data.contact.zaloUrl = normalizeOptionalUrl(data.contact.zaloUrl);
    }

    if (Object.prototype.hasOwnProperty.call(data.contact, "messengerUrl")) {
      assertHttpUrl(data.contact.messengerUrl, "Messenger URL không hợp lệ.");
      data.contact.messengerUrl = normalizeOptionalUrl(
        data.contact.messengerUrl,
      );
    }

    if (
      data.contact.hotline &&
      !isValidVietnamPhone(data.contact.hotline)
    ) {
      const error = new Error("Số điện thoại chưa hợp lệ.");
      error.statusCode = 400;
      throw error;
    }

    if (data.contact.hotline) {
      data.contact.hotline = normalizePhone(data.contact.hotline);
    }
  }

  if (data.staff) {
    data.staff = { ...data.staff };

    if (Object.prototype.hasOwnProperty.call(data.staff, "staffZalo")) {
      assertHttpUrl(data.staff.staffZalo, "Zalo URL không hợp lệ.");
      data.staff.staffZalo = normalizeOptionalUrl(data.staff.staffZalo);
    }

    if (Object.prototype.hasOwnProperty.call(data.staff, "staffMessenger")) {
      assertHttpUrl(data.staff.staffMessenger, "Messenger URL không hợp lệ.");
      data.staff.staffMessenger = normalizeOptionalUrl(
        data.staff.staffMessenger,
      );
    }

    if (
      data.staff.staffPhone &&
      !isValidVietnamPhone(data.staff.staffPhone)
    ) {
      const error = new Error("Số điện thoại chưa hợp lệ.");
      error.statusCode = 400;
      throw error;
    }

    if (data.staff.staffPhone) {
      data.staff.staffPhone = normalizePhone(data.staff.staffPhone);
    }
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
  const allowedFields = new Set(["createdAt", "updatedAt", "name", "slug", "status"]);
  const sortBy = allowedFields.has(filters.sortBy) ? filters.sortBy : "createdAt";
  const sortOrder = filters.sortOrder === "asc" ? 1 : -1;

  return { [sortBy]: sortOrder };
}

async function createShop(payload, adminUser) {
  const normalizedPayload = normalizeShopPayload(payload);
  const slug = buildSlug({ slug: payload.slug, name: payload.name });

  await ensureSlugAvailable(slug);

  try {
    return await Shop.create({
      ...normalizedPayload,
      slug,
      createdBy: adminUser ? adminUser._id : null,
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
      error.message = "Slug shop đã tồn tại, vui lòng chọn slug khác.";
      error.statusCode = 409;
    }

    throw error;
  }
}

async function listShops(filters = {}) {
  const filter = {};
  const { page, limit, skip } = buildPagination(filters);

  if (filters.status) {
    filter.status = filters.status;
  }

  const [shops, total] = await Promise.all([
    Shop.find(filter).sort(buildSort(filters)).skip(skip).limit(limit),
    Shop.countDocuments(filter),
  ]);

  return {
    shops,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getShopById(shopId) {
  assertValidObjectId(shopId);

  const shop = await Shop.findById(shopId);

  if (!shop) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  return shop;
}

async function updateShop(shopId, payload) {
  assertValidObjectId(shopId);

  const updateData = normalizeShopPayload(payload);

  if (Object.prototype.hasOwnProperty.call(updateData, "slug")) {
    updateData.slug = buildSlug({
      slug: updateData.slug,
      name: updateData.name,
    });
    await ensureSlugAvailable(updateData.slug, shopId);
  }

  try {
    const shop = await Shop.findByIdAndUpdate(shopId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!shop) {
      const error = new Error("Shop not found");
      error.statusCode = 404;
      throw error;
    }

    return shop;
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
      error.message = "Slug shop đã tồn tại, vui lòng chọn slug khác.";
      error.statusCode = 409;
    }

    throw error;
  }
}

async function softDeleteShop(shopId) {
  assertValidObjectId(shopId);

  const shop = await Shop.findByIdAndUpdate(
    shopId,
    { status: "inactive" },
    { new: true, runValidators: true },
  );

  if (!shop) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  return shop;
}

async function getPublicShopBySlug(slug) {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  const shop = await Shop.findOne({
    slug: normalizedSlug,
    status: "active",
  });

  if (!shop) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  const publicShop = shop.toObject();

  if (publicShop.sheetConfig) {
    delete publicShop.sheetConfig.webhookUrl;
  }

  return publicShop;
}

module.exports = {
  createShop,
  listShops,
  getShopById,
  updateShop,
  softDeleteShop,
  getPublicShopBySlug,
};
