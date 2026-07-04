const mongoose = require("mongoose");
const request = require("supertest");

const app = require("../../app.js");
const env = require("../../config/env.js");
const { signAccessToken } = require("../../utils/jwt.js");
const { Order, Product, Shop, User } = require("../../models/index.js");

describe("Report integration", () => {
  let admin;
  let adminToken;
  let shopA;
  let shopB;

  beforeAll(async () => {
    expect(env.mongodbUri).toContain("test");
    await mongoose.connect(env.mongodbUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Promise.all([
      Order.deleteMany({}),
      Product.deleteMany({}),
      Shop.deleteMany({}),
      User.deleteMany({}),
    ]);

    admin = await User.create({
      role: "admin",
      fullName: "Admin Report Test",
      email: "admin.report.test@example.com",
      status: "active",
    });
    adminToken = signAccessToken(admin);

    shopA = await Shop.create({
      name: "Shop A",
      slug: "shop-a",
      status: "active",
    });

    shopB = await Shop.create({
      name: "Shop B",
      slug: "shop-b",
      status: "active",
    });
  });

  function buildOrderPayload(shop, overrides = {}) {
    const grandTotal = overrides.grandTotal || 400000;

    return {
      orderCode: `NLAI-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      shopId: shop._id,
      customer: {
        name: overrides.customerName || "Khach report",
        phone: overrides.customerPhone || "0912345678",
        address: "Dia chi test",
      },
      items: [
        {
          sku: "SKU-REPORT",
          name: "San pham report",
          unitPrice: grandTotal,
          quantity: 1,
          lineTotal: grandTotal,
        },
      ],
      money: {
        cartSubtotal: grandTotal,
        shippingFee: 0,
        discountAmount: 0,
        grandTotal,
      },
      status: overrides.status || "new",
      commission: {
        type: overrides.commissionType || "percent",
        baseAmount: overrides.baseAmount || 0,
        rate: overrides.rate || 0,
        fixedAmount: overrides.fixedAmount || 0,
        expectedAmount: overrides.expectedAmount || 0,
        actualAmount: overrides.actualAmount || 0,
        status: overrides.commissionStatus || "pending",
      },
      createdAt: overrides.createdAt || new Date(),
      updatedAt: overrides.updatedAt || new Date(),
    };
  }

  async function createOrder(shop, overrides = {}) {
    return Order.create(buildOrderPayload(shop, overrides));
  }

  test("update commission percent autoCalculate true calculates expectedAmount from grandTotal", async () => {
    const order = await createOrder(shopA, { grandTotal: 400000 });

    const response = await request(app)
      .patch(`/api/admin/orders/${order._id}/commission`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        type: "percent",
        rate: 10,
        autoCalculate: true,
      })
      .expect(200);

    expect(response.body.data.order.commission.expectedAmount).toBe(40000);
    expect(response.body.data.order.commission.baseAmount).toBe(400000);
  });

  test("update commission percent with baseAmount calculates expectedAmount from baseAmount", async () => {
    const order = await createOrder(shopA, { grandTotal: 400000 });

    const response = await request(app)
      .patch(`/api/admin/orders/${order._id}/commission`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        type: "percent",
        rate: 10,
        baseAmount: 850000,
        autoCalculate: true,
      })
      .expect(200);

    expect(response.body.data.order.commission.expectedAmount).toBe(85000);
    expect(response.body.data.order.commission.baseAmount).toBe(850000);
  });

  test("update commission fixed autoCalculate true sets expectedAmount to fixedAmount", async () => {
    const order = await createOrder(shopA, { grandTotal: 400000 });

    const response = await request(app)
      .patch(`/api/admin/orders/${order._id}/commission`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        type: "fixed",
        fixedAmount: 123000,
        autoCalculate: true,
      })
      .expect(200);

    expect(response.body.data.order.commission.expectedAmount).toBe(123000);
  });

  test("manual expectedAmount is preserved when autoCalculate is not true", async () => {
    const order = await createOrder(shopA, { grandTotal: 400000 });

    const response = await request(app)
      .patch(`/api/admin/orders/${order._id}/commission`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        type: "percent",
        rate: 10,
        expectedAmount: 90000,
        actualAmount: 90000,
      })
      .expect(200);

    expect(response.body.data.order.commission.expectedAmount).toBe(90000);
    expect(response.body.data.order.commission.actualAmount).toBe(90000);
  });

  test("GET /api/admin/reports/overview without token returns 401", async () => {
    const response = await request(app)
      .get("/api/admin/reports/overview")
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  test("GET /api/admin/reports/overview with admin token returns summary", async () => {
    await seedReportOrders();

    const response = await request(app)
      .get("/api/admin/reports/overview")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.data.summary).toMatchObject({
      totalOrders: 3,
      totalRevenue: 1200000,
      averageOrderValue: 400000,
      newOrders: 1,
      completedOrders: 2,
      commissionExpected: 120000,
      commissionPaid: 30000,
      commissionPending: 90000,
    });
    expect(response.body.data.recentOrders).toHaveLength(3);
  });

  test("report byShop groups orders by shop", async () => {
    await seedReportOrders();

    const response = await request(app)
      .get("/api/admin/reports/overview")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const byShop = response.body.data.byShop;
    const shopARow = byShop.find((row) => row.shopId === shopA._id.toString());
    const shopBRow = byShop.find((row) => row.shopId === shopB._id.toString());

    expect(byShop).toHaveLength(2);
    expect(shopARow).toMatchObject({
      shopName: "Shop A",
      shopSlug: "shop-a",
      totalOrders: 2,
      totalRevenue: 700000,
      commissionExpected: 70000,
      commissionPaid: 30000,
      commissionPending: 40000,
    });
    expect(shopBRow).toMatchObject({
      shopName: "Shop B",
      shopSlug: "shop-b",
      totalOrders: 1,
      totalRevenue: 500000,
      commissionExpected: 50000,
      commissionPaid: 0,
      commissionPending: 50000,
    });
  });

  test("report shopId filter returns only that shop", async () => {
    await seedReportOrders();

    const response = await request(app)
      .get(`/api/admin/reports/overview?shopId=${shopB._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.data.summary.totalOrders).toBe(1);
    expect(response.body.data.summary.totalRevenue).toBe(500000);
    expect(response.body.data.byShop).toHaveLength(1);
    expect(response.body.data.byShop[0].shopId).toBe(shopB._id.toString());
  });

  test("report commission totals are calculated correctly", async () => {
    await seedReportOrders();

    const response = await request(app)
      .get("/api/admin/reports/overview")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.data.summary.commissionExpected).toBe(120000);
    expect(response.body.data.summary.commissionPaid).toBe(30000);
    expect(response.body.data.summary.commissionPending).toBe(90000);
  });

  async function seedReportOrders() {
    await createOrder(shopA, {
      grandTotal: 400000,
      status: "new",
      expectedAmount: 40000,
      actualAmount: 0,
      commissionStatus: "pending",
      customerName: "Khach A1",
    });
    await createOrder(shopA, {
      grandTotal: 300000,
      status: "commission_paid",
      expectedAmount: 30000,
      actualAmount: 30000,
      commissionStatus: "paid",
      customerName: "Khach A2",
    });
    await createOrder(shopB, {
      grandTotal: 500000,
      status: "delivered",
      expectedAmount: 50000,
      actualAmount: 0,
      commissionStatus: "pending",
      customerName: "Khach B1",
    });
  }
});
