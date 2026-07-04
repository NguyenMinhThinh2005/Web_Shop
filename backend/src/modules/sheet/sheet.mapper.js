function safeJsonStringify(value) {
  try {
    return JSON.stringify(value || {});
  } catch (error) {
    return "{}";
  }
}

function mapSheetOrder(order) {
  return {
    order_id: order.orderCode,
    created_at: order.createdAt ? order.createdAt.toISOString() : "",
    page_url: order.pageUrl || "",
    campaign_id: order.campaign ? order.campaign.campaignId || "" : "",
    staff_id: order.staff ? order.staff.staffId || "" : "",
    staff_name: order.staff ? order.staff.staffName || "" : "",
    staff_phone: order.staff ? order.staff.staffPhone || "" : "",
    staff_zalo: order.staff ? order.staff.staffZalo || "" : "",
    staff_messenger: order.staff ? order.staff.staffMessenger || "" : "",
    customer_name: order.customer ? order.customer.name || "" : "",
    customer_phone: order.customer ? order.customer.phone || "" : "",
    customer_address: order.customer ? order.customer.address || "" : "",
    customer_note: order.customer ? order.customer.note || "" : "",
    preferred_contact_time: order.customer
      ? order.customer.preferredContactTime || ""
      : "",
    utm_source: order.campaign ? order.campaign.utmSource || "" : "",
    utm_campaign: order.campaign ? order.campaign.utmCampaign || "" : "",
    user_agent: order.source ? order.source.userAgent || "" : "",
    cart_subtotal: order.money ? order.money.cartSubtotal || 0 : 0,
    shipping_fee: order.money ? order.money.shippingFee || 0 : 0,
    discount_amount: order.money ? order.money.discountAmount || 0 : 0,
    grand_total: order.money ? order.money.grandTotal || 0 : 0,
    payment_method: order.payment ? order.payment.method || "" : "",
    status: order.status || "",
  };
}

function mapSheetItems(order) {
  return (order.items || []).map((item) => ({
      order_id: order.orderCode,
      product_id: item.productId ? item.productId.toString() : "",
      product_sku: item.sku || "",
      product_name: item.name || "",
      product_category: item.categoryName || "",
      unit_price: item.unitPrice || 0,
      quantity: item.quantity || 0,
      line_total: item.lineTotal || 0,
      selected_options_json: safeJsonStringify(item.selectedOptions),
      product_snapshot_json: safeJsonStringify(item.productSnapshot),
  }));
}

function mapOrderToSheetPayload(order, formatType = "team_order_v1") {
  return {
    formatType,
    order: mapSheetOrder(order),
    items: mapSheetItems(order),
  };
}

function mapOrderToLegacyHtmlFlatPayload(order) {
  return {
    ...mapSheetOrder(order),
    items: mapSheetItems(order),
  };
}

module.exports = {
  mapOrderToSheetPayload,
  mapOrderToLegacyHtmlFlatPayload,
};
