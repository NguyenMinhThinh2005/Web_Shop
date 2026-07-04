const axios = require("axios");
const env = require("../../config/env.js");
const { Order, SheetSyncLog, Shop } = require("../../models/index.js");
const {
  mapOrderToLegacyHtmlFlatPayload,
  mapOrderToSheetPayload,
} = require("./sheet.mapper.js");

async function markSkipped(order, message) {
  order.sheetSync.status = "skipped";
  order.sheetSync.lastError = message || "";
  await order.save();
  return order;
}

async function resolveSyncContext(order) {
  const shop = await Shop.findById(order.shopId);

  if (!shop) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  const sheetConfig = shop.sheetConfig || {};
  const webhookUrl =
    order.sheetSync.webhookUrl ||
    sheetConfig.webhookUrl ||
    env.defaultSheetWebhookUrl ||
    "";
  const formatType =
    (order.sheetSync && order.sheetSync.formatType) ||
    sheetConfig.formatType ||
    "team_order_v1";

  return {
    shop,
    sheetConfig,
    webhookUrl,
    formatType,
  };
}

async function syncOrderToSheet(orderId) {
  const order = await Order.findById(orderId);

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  const { sheetConfig, webhookUrl, formatType } = await resolveSyncContext(
    order,
  );

  if (sheetConfig.enabled === false) {
    return markSkipped(order, "");
  }

  if (!webhookUrl) {
    return markSkipped(order, "Sheet webhook URL is not configured");
  }

  const isLegacyHtmlFlat = formatType === "legacy_html_flat_v1";
  const payload = isLegacyHtmlFlat
    ? mapOrderToLegacyHtmlFlatPayload(order)
    : mapOrderToSheetPayload(order, formatType || "team_order_v1");
  const axiosConfig = {
    timeout: 15000,
  };

  if (isLegacyHtmlFlat) {
    axiosConfig.headers = {
      "Content-Type": "text/plain;charset=utf-8",
    };
  }

  try {
    const response = await axios.post(webhookUrl, payload, axiosConfig);

    if (response.data && response.data.success === false) {
      const error = new Error(response.data.message || "Sheet sync failed");
      error.response = response;
      throw error;
    }

    order.sheetSync.status = "success";
    order.sheetSync.webhookUrl = webhookUrl;
    order.sheetSync.syncedAt = new Date();
    order.sheetSync.lastError = "";
    await order.save();

    await SheetSyncLog.create({
      orderId: order._id,
      shopId: order.shopId,
      webhookUrl,
      payload,
      response: response.data || null,
      status: "success",
      errorMessage: "",
    });

    return order;
  } catch (error) {
    const responseData = error.response ? error.response.data || null : null;
    const errorMessage = error.message || "Sheet sync failed";

    order.sheetSync.status = "failed";
    order.sheetSync.webhookUrl = webhookUrl;
    order.sheetSync.lastError = errorMessage;
    order.sheetSync.retryCount = (order.sheetSync.retryCount || 0) + 1;
    await order.save();

    await SheetSyncLog.create({
      orderId: order._id,
      shopId: order.shopId,
      webhookUrl,
      payload,
      response: responseData,
      status: "failed",
      errorMessage,
    });

    const syncError = new Error(errorMessage);
    syncError.statusCode = 500;
    syncError.order = order;
    throw syncError;
  }
}

module.exports = {
  syncOrderToSheet,
};
