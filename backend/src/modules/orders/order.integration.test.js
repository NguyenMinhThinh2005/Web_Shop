const mongoose = require("mongoose");
const request = require("supertest");

jest.mock("axios");

const axios = require("axios");
const app = require("../../app.js");
const env = require("../../config/env.js");
const { signAccessToken } = require("../../utils/jwt.js");
const {
  Category,
  Order,
  Product,
  SheetSyncLog,
  Shop,
  User,
} = require("../../models/index.js");

describe("Order integration", () => {
  let admin;
  let adminToken;
  let shop;
  let product;

  beforeAll(async () => {
    expect(env.mongodbUri).toContain("test");
    await mongoose.connect(env.mongodbUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    axios.post.mockReset();

    await Promise.all([
      Order.deleteMany({}),
      SheetSyncLog.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
      Shop.deleteMany({}),
      User.deleteMany({}),
    ]);

    admin = await User.create({
      role: "admin",
      fullName: "Admin Test",
      email: "admin.order.test@example.com",
      status: "active",
    });
    adminToken = signAccessToken(admin);

    shop = await Shop.create({
      name: "Chu Tam Tan Xe Test",
      slug: "chu-tam-tan-xe-test",
      campaignId: "test_campaign",
      status: "active",
      staff: {
        staffId: "S001",
        staffName: "Staff Test",
        staffPhone: "0900000000",
      },
      sheetConfig: {
        enabled: true,
        webhookUrl: "",
        syncMode: "direct",
      },
    });

    await Category.create({
      shopId: shop._id,
      name: "Sen den",
      slug: "sen-den",
      status: "active",
    });

    product = await Product.create({
      shopId: shop._id,
      sku: "NSD-001",
      name: "Dia den Sen den 428 9 ly",
      slug: "dia-den-sen-den-428-9-ly",
      price: 250000,
      salePrice: 200000,
      priceMode: "fixed",
      thumbnailUrl: "https://example.com/image.jpg",
      status: "active",
    });
  });

  function buildOrderBody(overrides = {}) {
    return {
      shopSlug: shop.slug,
      pageUrl: `http://localhost:5173/shop/${shop.slug}`,
      customer: {
        name: "Khach test",
        phone: "0912345678",
        address: "Dia chi test",
        note: "Giao buoi sang",
        preferredContactTime: "Buoi sang",
      },
      items: [
        {
          productId: product._id.toString(),
          quantity: 2,
          unitPrice: 1,
          lineTotal: 2,
        },
      ],
      paymentMethod: "cod",
      source: {
        utmSource: "test",
        utmCampaign: "test_order_core",
        userAgent: "Jest supertest",
      },
      ...overrides,
    };
  }

  async function createOrder(overrides = {}) {
    const response = await request(app)
      .post("/api/public/orders")
      .send(buildOrderBody(overrides))
      .expect(201);

    return response.body.data.order;
  }

  async function updateShopSheetConfig(sheetConfig) {
    shop = await Shop.findByIdAndUpdate(
      shop._id,
      { sheetConfig },
      { new: true, runValidators: true },
    );
  }

  test("POST /api/public/orders creates order successfully", async () => {
    const response = await request(app)
      .post("/api/public/orders")
      .send(buildOrderBody())
      .expect(201);

    const order = response.body.data.order;

    expect(response.body.success).toBe(true);
    expect(order.status).toBe("new");
    expect(order.customer.phone).toBe("0912345678");
    expect(order.items).toHaveLength(1);
    expect(order.payment.method).toBe("cod");
    expect(order.payment.status).toBe("pending");
  });

  test("created orderCode starts with NLAI", async () => {
    const order = await createOrder();

    expect(order.orderCode).toMatch(/^NLAI-\d{14}-\d{4}$/);
  });

  test("backend calculates cartSubtotal and grandTotal from product in DB", async () => {
    const order = await createOrder();

    expect(order.items[0].unitPrice).toBe(200000);
    expect(order.items[0].lineTotal).toBe(400000);
    expect(order.money.cartSubtotal).toBe(400000);
    expect(order.money.grandTotal).toBe(400000);

    const orderInDb = await Order.findById(order._id);
    expect(orderInDb.money.cartSubtotal).toBe(400000);
    expect(orderInDb.money.grandTotal).toBe(400000);
  });

  test("fake unitPrice from frontend does not affect order totals", async () => {
    const order = await createOrder({
      items: [
        {
          productId: product._id.toString(),
          quantity: 2,
          unitPrice: 1,
          lineTotal: 2,
        },
      ],
    });

    expect(order.items[0].unitPrice).toBe(200000);
    expect(order.items[0].lineTotal).toBe(400000);
    expect(order.money.grandTotal).toBe(400000);
  });

  test("public create order rejects repeated invalid Vietnam phone", async () => {
    const response = await request(app)
      .post("/api/public/orders")
      .send(
        buildOrderBody({
          customer: {
            name: "Khach test",
            phone: "11111111111",
            address: "Dia chi test",
          },
        }),
      )
      .expect(400);

    expect(response.body.message).toBe("Số điện thoại chưa hợp lệ.");
  });

  test("public create order accepts valid Vietnam phone", async () => {
    const response = await request(app)
      .post("/api/public/orders")
      .send(
        buildOrderBody({
          customer: {
            name: "Khach test",
            phone: "0912345678",
            address: "Dia chi test",
          },
        }),
      )
      .expect(201);

    expect(response.body.data.order.customer.phone).toBe("0912345678");
    expect(response.body.data.order.activityLogs).toBeUndefined();
  });

  test("admin create shop rejects invalid logo URL", async () => {
    const response = await request(app)
      .post("/api/admin/shops")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Shop URL Invalid",
        slug: "shop-url-invalid",
        logoUrl: "123",
      })
      .expect(400);

    expect(response.body.message).toBe("Logo URL không hợp lệ.");
  });

  test("admin create shop duplicate slug returns clear conflict message", async () => {
    const response = await request(app)
      .post("/api/admin/shops")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Duplicate Shop",
        slug: shop.slug,
      })
      .expect(409);

    expect(response.body.message).toBe(
      "Slug shop đã tồn tại, vui lòng chọn slug khác.",
    );
  });

  test("admin create product rejects salePrice greater than price", async () => {
    const response = await request(app)
      .post(`/api/admin/shops/${shop._id}/products`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        sku: "NSD-PRICE-001",
        name: "San pham sai gia",
        slug: "san-pham-sai-gia",
        price: 100000,
        salePrice: 120000,
        priceMode: "fixed",
        status: "active",
      })
      .expect(400);

    expect(response.body.message).toBe(
      "Giá khuyến mãi không được lớn hơn giá gốc.",
    );
  });

  test("admin create product duplicate SKU returns clear conflict message", async () => {
    const response = await request(app)
      .post(`/api/admin/shops/${shop._id}/products`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        sku: "nsd-001",
        name: "San pham trung sku",
        slug: "san-pham-trung-sku",
        price: 100000,
        priceMode: "fixed",
        status: "active",
      })
      .expect(409);

    expect(response.body.message).toBe("SKU này đã tồn tại trong shop.");
  });

  test("admin create product removes duplicate images and uses first image as thumbnail", async () => {
    const response = await request(app)
      .post(`/api/admin/shops/${shop._id}/products`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        sku: "NSD-IMG-001",
        name: "San pham co anh",
        slug: "san-pham-co-anh",
        price: 100000,
        priceMode: "fixed",
        images: [
          "https://example.com/a.jpg",
          "https://example.com/a.jpg",
          "",
          "https://example.com/b.jpg",
        ],
        status: "active",
      })
      .expect(201);

    expect(response.body.data.product.images).toEqual([
      "https://example.com/a.jpg",
      "https://example.com/b.jpg",
    ]);
    expect(response.body.data.product.thumbnailUrl).toBe(
      "https://example.com/a.jpg",
    );
  });

  test("POST /api/public/orders with empty items returns 400", async () => {
    const response = await request(app)
      .post("/api/public/orders")
      .send(buildOrderBody({ items: [] }))
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  test("POST /api/public/orders with quantity lower than 1 returns 400", async () => {
    const response = await request(app)
      .post("/api/public/orders")
      .send(
        buildOrderBody({
          items: [{ productId: product._id.toString(), quantity: 0 }],
        }),
      )
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  test("GET /api/admin/orders without token returns 401", async () => {
    const response = await request(app).get("/api/admin/orders").expect(401);

    expect(response.body.success).toBe(false);
  });

  test("admin can list, view detail, and update order status", async () => {
    const order = await createOrder();

    const listResponse = await request(app)
      .get("/api/admin/orders?page=1&limit=10&sortBy=createdAt&sortOrder=desc")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(listResponse.body.success).toBe(true);
    expect(listResponse.body.data.orders).toHaveLength(1);
    expect(listResponse.body.data.orders[0]._id).toBe(order._id);
    expect(listResponse.body.data.orders[0].shopId).toBe(String(shop._id));
    expect(listResponse.body.data.orders[0].shop).toMatchObject({
      _id: String(shop._id),
      name: shop.name,
      slug: shop.slug,
      status: shop.status,
    });
    expect(listResponse.body.data.pagination).toMatchObject({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
  });

  test("GET /api/admin/orders/:orderId returns detail for admin", async () => {
    const order = await createOrder();

    const detailResponse = await request(app)
      .get(`/api/admin/orders/${order._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(detailResponse.body.data.order._id).toBe(order._id);
    expect(detailResponse.body.data.order.money.grandTotal).toBe(400000);
    expect(detailResponse.body.data.order.shopId).toBe(String(shop._id));
    expect(detailResponse.body.data.order.shop).toMatchObject({
      _id: String(shop._id),
      name: shop.name,
      slug: shop.slug,
      status: shop.status,
    });
  });

  test("PATCH /api/admin/orders/:orderId/status updates status to confirmed", async () => {
    const order = await createOrder();

    const updateResponse = await request(app)
      .patch(`/api/admin/orders/${order._id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "confirmed" })
      .expect(200);

    expect(updateResponse.body.data.order.status).toBe("confirmed");

    const orderInDb = await Order.findById(order._id);
    expect(orderInDb.status).toBe("confirmed");
  });

  test("admin status update appends activity log and detail returns logs", async () => {
    const order = await createOrder();

    const updateResponse = await request(app)
      .patch(`/api/admin/orders/${order._id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "confirmed" })
      .expect(200);

    expect(updateResponse.body.data.order.activityLogs).toHaveLength(1);
    expect(updateResponse.body.data.order.activityLogs[0].type).toBe(
      "status_updated",
    );

    const detailResponse = await request(app)
      .get(`/api/admin/orders/${order._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(detailResponse.body.data.order.activityLogs).toHaveLength(1);
    expect(detailResponse.body.data.order.activityLogs[0].actorName).toBe(
      "Admin Test",
    );
  });

  test("PATCH /api/admin/orders/:orderId/status with invalid enum returns 400", async () => {
    const order = await createOrder();

    const response = await request(app)
      .patch(`/api/admin/orders/${order._id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "wrong_status" })
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  test("create order with direct sheet sync calls axios and marks success", async () => {
    await updateShopSheetConfig({
      enabled: true,
      syncMode: "direct",
      webhookUrl: "https://sheet.example.test/webhook",
      formatType: "team_order_v1",
    });
    axios.post.mockResolvedValue({
      data: { success: true, row: 2 },
    });

    const order = await createOrder();

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(order.sheetSync.status).toBe("success");
    expect(order.sheetSync.lastError).toBe("");

    const orderInDb = await Order.findById(order._id);
    expect(orderInDb.sheetSync.status).toBe("success");
    expect(orderInDb.sheetSync.syncedAt).toBeTruthy();

    const log = await SheetSyncLog.findOne({ orderId: order._id });
    expect(log.status).toBe("success");
    expect(log.response).toEqual({ success: true, row: 2 });
  });

  test("sheet sync payload has order and items in team_order_v1 format", async () => {
    await updateShopSheetConfig({
      enabled: true,
      syncMode: "direct",
      webhookUrl: "https://sheet.example.test/webhook",
      formatType: "team_order_v1",
    });
    axios.post.mockResolvedValue({ data: { success: true } });

    const order = await createOrder();
    const [webhookUrl, payload, config] = axios.post.mock.calls[0];

    expect(webhookUrl).toBe("https://sheet.example.test/webhook");
    expect(config).toEqual({ timeout: 15000 });
    expect(payload.formatType).toBe("team_order_v1");
    expect(payload.order).toMatchObject({
      order_id: order.orderCode,
      page_url: `http://localhost:5173/shop/${shop.slug}`,
      campaign_id: "test_campaign",
      staff_id: "S001",
      staff_name: "Staff Test",
      staff_phone: "0900000000",
      customer_name: "Khach test",
      customer_phone: "0912345678",
      customer_address: "Dia chi test",
      customer_note: "Giao buoi sang",
      preferred_contact_time: "Buoi sang",
      utm_source: "test",
      utm_campaign: "test_order_core",
      user_agent: "Jest supertest",
      cart_subtotal: 400000,
      shipping_fee: 0,
      discount_amount: 0,
      grand_total: 400000,
      payment_method: "cod",
      status: "new",
    });
    expect(payload.order.created_at).toEqual(expect.any(String));
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0]).toMatchObject({
      order_id: order.orderCode,
      product_id: product._id.toString(),
      product_sku: "NSD-001",
      product_name: "Dia den Sen den 428 9 ly",
      product_category: "",
      unit_price: 200000,
      quantity: 2,
      line_total: 400000,
      selected_options_json: "{}",
    });
    expect(JSON.parse(payload.items[0].product_snapshot_json)).toMatchObject({
      slug: "dia-den-sen-den-428-9-ly",
      price: 250000,
      salePrice: 200000,
      priceMode: "fixed",
    });
  });

  test("legacy_html_flat_v1 sends flat payload with text/plain content type", async () => {
    await updateShopSheetConfig({
      enabled: true,
      syncMode: "direct",
      webhookUrl: "https://sheet.example.test/legacy-webhook",
      formatType: "legacy_html_flat_v1",
    });
    axios.post.mockResolvedValue({ data: { success: true } });

    const order = await createOrder();
    const [webhookUrl, payload, config] = axios.post.mock.calls[0];

    expect(webhookUrl).toBe("https://sheet.example.test/legacy-webhook");
    expect(payload.formatType).toBeUndefined();
    expect(payload.order).toBeUndefined();
    expect(payload.order_id).toBe(order.orderCode);
    expect(payload.customer_name).toBe("Khach test");
    expect(payload.customer_phone).toBe("0912345678");
    expect(payload.cart_subtotal).toBe(400000);
    expect(payload.grand_total).toBe(400000);
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0].order_id).toBe(order.orderCode);
    expect(payload.items[0].product_sku).toBe("NSD-001");
    expect(payload.items[0].product_id).toBe(product._id.toString());
    expect(config).toMatchObject({
      timeout: 15000,
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
    });
  });

  test("create order keeps order and marks sheet sync failed when axios throws", async () => {
    await updateShopSheetConfig({
      enabled: true,
      syncMode: "direct",
      webhookUrl: "https://sheet.example.test/webhook",
      formatType: "team_order_v1",
    });
    axios.post.mockRejectedValue(new Error("sheet is down"));

    const order = await createOrder();

    expect(order._id).toBeTruthy();
    expect(order.sheetSync.status).toBe("failed");
    expect(order.sheetSync.lastError).toBe("sheet is down");
    expect(order.sheetSync.retryCount).toBe(1);

    const orderInDb = await Order.findById(order._id);
    expect(orderInDb).toBeTruthy();
    expect(orderInDb.sheetSync.status).toBe("failed");

    const log = await SheetSyncLog.findOne({ orderId: order._id });
    expect(log.status).toBe("failed");
    expect(log.errorMessage).toBe("sheet is down");
  });

  test("create order with sheetConfig enabled false skips sync and does not call axios", async () => {
    await updateShopSheetConfig({
      enabled: false,
      syncMode: "direct",
      webhookUrl: "https://sheet.example.test/webhook",
      formatType: "team_order_v1",
    });

    const order = await createOrder();

    expect(order.sheetSync.status).toBe("skipped");
    expect(axios.post).not.toHaveBeenCalled();
    expect(await SheetSyncLog.countDocuments({ orderId: order._id })).toBe(0);
  });

  test("admin retry sync can turn failed order into success", async () => {
    await updateShopSheetConfig({
      enabled: true,
      syncMode: "direct",
      webhookUrl: "https://sheet.example.test/webhook",
      formatType: "team_order_v1",
    });
    axios.post.mockRejectedValueOnce(new Error("first sync failed"));
    const order = await createOrder();
    expect(order.sheetSync.status).toBe("failed");

    axios.post.mockResolvedValueOnce({ data: { success: true } });

    const retryResponse = await request(app)
      .post(`/api/admin/orders/${order._id}/sync-sheet`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(retryResponse.body.data.order.sheetSync.status).toBe("success");

    const orderInDb = await Order.findById(order._id);
    expect(orderInDb.sheetSync.status).toBe("success");
    expect(await SheetSyncLog.countDocuments({ orderId: order._id })).toBe(2);
  });

  test("POST /api/admin/orders/:orderId/sync-sheet without token returns 401", async () => {
    const order = await createOrder();

    const response = await request(app)
      .post(`/api/admin/orders/${order._id}/sync-sheet`)
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  test("admin updates shipping and sets createdAt plus shipping_created status", async () => {
    const order = await createOrder();

    const response = await request(app)
      .patch(`/api/admin/orders/${order._id}/shipping`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        carrier: "viettel_post",
        trackingCode: "VTP123456789",
        shippingFee: 30000,
        status: "created",
        note: "Tao van don thu cong tren Viettel Post",
      })
      .expect(200);

    expect(response.body.data.order.shipping.carrier).toBe("viettel_post");
    expect(response.body.data.order.shipping.trackingCode).toBe("VTP123456789");
    expect(response.body.data.order.shipping.shippingFee).toBe(30000);
    expect(response.body.data.order.shipping.status).toBe("created");
    expect(response.body.data.order.shipping.createdAt).toBeTruthy();
    expect(response.body.data.order.shipping.updatedAt).toBeTruthy();
    expect(response.body.data.order.status).toBe("shipping_created");
  });

  test("admin updates handoff sent and sets sentAt plus handoff_sent status", async () => {
    const order = await createOrder();
    await Order.findByIdAndUpdate(order._id, { status: "shipping_created" });

    const response = await request(app)
      .patch(`/api/admin/orders/${order._id}/handoff`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        status: "sent",
        note: "Da gui ma van don cho ben xu ly hang",
      })
      .expect(200);

    expect(response.body.data.order.handoff.status).toBe("sent");
    expect(response.body.data.order.handoff.sentAt).toBeTruthy();
    expect(response.body.data.order.status).toBe("handoff_sent");
  });

  test("admin updates commission pending successfully", async () => {
    const order = await createOrder();

    const response = await request(app)
      .patch(`/api/admin/orders/${order._id}/commission`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        type: "percent",
        rate: 10,
        fixedAmount: 0,
        expectedAmount: 85000,
        actualAmount: 0,
        status: "pending",
        note: "Cho thanh toan hoa hong",
      })
      .expect(200);

    expect(response.body.data.order.commission.type).toBe("percent");
    expect(response.body.data.order.commission.rate).toBe(10);
    expect(response.body.data.order.commission.expectedAmount).toBe(85000);
    expect(response.body.data.order.commission.status).toBe("pending");
  });

  test("admin commission update appends activity log", async () => {
    const order = await createOrder();

    const response = await request(app)
      .patch(`/api/admin/orders/${order._id}/commission`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        type: "percent",
        rate: 10,
        status: "pending",
      })
      .expect(200);

    expect(response.body.data.order.activityLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "commission_updated" }),
      ]),
    );
  });

  test("commission paid sets paidAt and order status commission_paid", async () => {
    const order = await createOrder();

    const response = await request(app)
      .patch(`/api/admin/orders/${order._id}/commission`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        actualAmount: 85000,
        status: "paid",
      })
      .expect(200);

    expect(response.body.data.order.commission.status).toBe("paid");
    expect(response.body.data.order.commission.paidAt).toBeTruthy();
    expect(response.body.data.order.status).toBe("commission_paid");
  });

  test("admin updates internal note successfully", async () => {
    const order = await createOrder();

    const response = await request(app)
      .patch(`/api/admin/orders/${order._id}/internal-note`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        internalNote: "Khach can goi lai sau 18h",
      })
      .expect(200);

    expect(response.body.data.order.internalNote).toBe(
      "Khach can goi lai sau 18h",
    );
  });

  test("admin list filters orders by shippingStatus", async () => {
    const order = await createOrder();
    await Order.findByIdAndUpdate(order._id, {
      "shipping.status": "created",
      "shipping.carrier": "viettel_post",
      "shipping.trackingCode": "VTP123456789",
    });

    const response = await request(app)
      .get("/api/admin/orders?shippingStatus=created")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.data.orders).toHaveLength(1);
    expect(response.body.data.orders[0]._id).toBe(order._id);
  });

  test("admin list filters orders by trackingCode partial", async () => {
    const order = await createOrder();
    await Order.findByIdAndUpdate(order._id, {
      "shipping.trackingCode": "VTP123456789",
    });

    const response = await request(app)
      .get("/api/admin/orders?trackingCode=123456")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.data.orders).toHaveLength(1);
    expect(response.body.data.orders[0]._id).toBe(order._id);
  });

  test("PATCH /api/admin/orders/:orderId/shipping without token returns 401", async () => {
    const order = await createOrder();

    const response = await request(app)
      .patch(`/api/admin/orders/${order._id}/shipping`)
      .send({ carrier: "viettel_post" })
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  test("PATCH /api/admin/orders/:orderId/shipping invalid enum returns 400", async () => {
    const order = await createOrder();

    const response = await request(app)
      .patch(`/api/admin/orders/${order._id}/shipping`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        carrier: "viettel_post_api",
        status: "created_by_api",
      })
      .expect(400);

    expect(response.body.success).toBe(false);
  });
});
