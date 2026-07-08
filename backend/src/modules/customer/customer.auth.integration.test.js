const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const request = require("supertest");

const app = require("../../app.js");
const env = require("../../config/env.js");
const { signAccessToken } = require("../../utils/jwt.js");
const {
  CustomerAddress,
  Order,
  Product,
  Shop,
  User,
} = require("../../models/index.js");

describe("Customer integration", () => {
  let shop;
  let customer;
  let customerToken;

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
      CustomerAddress.deleteMany({}),
      Shop.deleteMany({}),
      User.deleteMany({}),
    ]);

    shop = await Shop.create({
      name: "Customer Test Shop",
      slug: "customer-test-shop",
      status: "active",
    });

    customer = await User.create({
      role: "customer",
      fullName: "Customer Test",
      phone: "0912345678",
      email: "customer.test@example.com",
      passwordHash: await bcrypt.hash("Password@123", 10),
      status: "active",
    });
    customerToken = signAccessToken(customer);
  });

  function registerCustomer(overrides = {}) {
    return request(app)
      .post("/api/customer/auth/register")
      .send({
        fullName: "Nguyen Van A",
        phone: "0987654321",
        email: "new.customer@example.com",
        password: "Password@123",
        ...overrides,
      });
  }

  async function createOrder(overrides = {}) {
    return Order.create({
      orderCode: `NLAI-20260708000000-${Math.floor(
        Math.random() * 9000 + 1000,
      )}`,
      shopId: shop._id,
      customerId: overrides.customerId || null,
      customer: {
        name: "Customer Test",
        phone: overrides.phone || "0912345678",
        address: "123 Test Street",
        note: "Customer note",
      },
      items: [
        {
          sku: "CUS-001",
          name: "Customer product",
          unitPrice: 100000,
          quantity: 1,
          lineTotal: 100000,
        },
      ],
      money: {
        cartSubtotal: 100000,
        shippingFee: 0,
        discountAmount: 0,
        grandTotal: 100000,
      },
      status: "new",
      internalNote: "Internal only",
      commission: {
        type: "percent",
        rate: 10,
        expectedAmount: 10000,
        status: "pending",
      },
      activityLogs: [
        {
          type: "status_updated",
          message: "Internal log",
        },
      ],
      sheetSync: {
        status: "pending",
        webhookUrl: "https://sheet.example.test/webhook",
      },
    });
  }

  test("register customer success", async () => {
    const response = await registerCustomer().expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeTruthy();
    expect(response.body.data.refreshToken).toBeTruthy();
    expect(response.body.data.user).toMatchObject({
      role: "customer",
      fullName: "Nguyen Van A",
      phone: "0987654321",
      email: "new.customer@example.com",
      status: "active",
    });
    expect(response.body.data.user.passwordHash).toBeUndefined();

    const userInDb = await User.findOne({ phone: "0987654321" }).select(
      "+passwordHash",
    );
    expect(userInDb.role).toBe("customer");
    expect(userInDb.passwordHash).toBeTruthy();
  });

  test("register duplicate phone returns 409", async () => {
    const response = await registerCustomer({
      phone: customer.phone,
      email: "other.customer@example.com",
    }).expect(409);

    expect(response.body.message).toBe("Phone already exists");
  });

  test("login customer by phone success", async () => {
    const response = await request(app)
      .post("/api/customer/auth/login")
      .send({
        phoneOrEmail: "0912345678",
        password: "Password@123",
      })
      .expect(200);

    expect(response.body.data.accessToken).toBeTruthy();
    expect(response.body.data.user).toMatchObject({
      role: "customer",
      phone: "0912345678",
    });
    expect(response.body.data.user.passwordHash).toBeUndefined();
  });

  test("login wrong password returns 401", async () => {
    const response = await request(app)
      .post("/api/customer/auth/login")
      .send({
        phoneOrEmail: "0912345678",
        password: "WrongPassword",
      })
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  test("GET /api/customer/auth/me without token returns 401", async () => {
    const response = await request(app)
      .get("/api/customer/auth/me")
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  test("GET /api/customer/auth/me with customer token success", async () => {
    const response = await request(app)
      .get("/api/customer/auth/me")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);

    expect(response.body.data.user).toMatchObject({
      role: "customer",
      phone: "0912345678",
      email: "customer.test@example.com",
      status: "active",
    });
    expect(response.body.data.user.passwordHash).toBeUndefined();
  });

  test("admin user cannot login via customer endpoint", async () => {
    await User.create({
      role: "admin",
      fullName: "Admin Test",
      phone: "0900000000",
      email: "admin.customer.auth@example.com",
      passwordHash: await bcrypt.hash("Password@123", 10),
      status: "active",
    });

    const response = await request(app)
      .post("/api/customer/auth/login")
      .send({
        phoneOrEmail: "admin.customer.auth@example.com",
        password: "Password@123",
      })
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  test("customer token cannot access admin orders", async () => {
    const response = await request(app)
      .get("/api/admin/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(403);

    expect(response.body.success).toBe(false);
  });

  test("create address success", async () => {
    const response = await request(app)
      .post("/api/customer/addresses")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        receiverName: "Customer Test",
        phone: "0912345678",
        province: "TP.HCM",
        addressLine: "123 Test Street",
        note: "Call first",
        isDefault: true,
      })
      .expect(201);

    expect(response.body.data.address).toMatchObject({
      receiverName: "Customer Test",
      phone: "0912345678",
      province: "TP.HCM",
      addressLine: "123 Test Street",
      note: "Call first",
      isDefault: true,
    });

    const userInDb = await User.findById(customer._id);
    expect(String(userInDb.defaultAddressId)).toBe(
      response.body.data.address._id,
    );
  });

  test("address list only returns addresses owned by user", async () => {
    const otherUser = await User.create({
      role: "customer",
      fullName: "Other Customer",
      phone: "0901111111",
      email: "other.customer@example.com",
      status: "active",
    });

    await CustomerAddress.create([
      {
        userId: customer._id,
        receiverName: "Customer Test",
        phone: "0912345678",
        addressLine: "Owned address",
      },
      {
        userId: otherUser._id,
        receiverName: "Other Customer",
        phone: "0901111111",
        addressLine: "Other address",
      },
    ]);

    const response = await request(app)
      .get("/api/customer/addresses")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);

    expect(response.body.data.addresses).toHaveLength(1);
    expect(response.body.data.addresses[0].addressLine).toBe("Owned address");
  });

  test("update default address works", async () => {
    const firstAddress = await CustomerAddress.create({
      userId: customer._id,
      receiverName: "Customer Test",
      phone: "0912345678",
      addressLine: "First address",
      isDefault: true,
    });
    const secondAddress = await CustomerAddress.create({
      userId: customer._id,
      receiverName: "Customer Test",
      phone: "0912345678",
      addressLine: "Second address",
      isDefault: false,
    });
    await User.findByIdAndUpdate(customer._id, {
      defaultAddressId: firstAddress._id,
    });

    const response = await request(app)
      .patch(`/api/customer/addresses/${secondAddress._id}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ isDefault: true })
      .expect(200);

    expect(response.body.data.address.isDefault).toBe(true);

    const firstInDb = await CustomerAddress.findById(firstAddress._id);
    const userInDb = await User.findById(customer._id);

    expect(firstInDb.isDefault).toBe(false);
    expect(String(userInDb.defaultAddressId)).toBe(String(secondAddress._id));
  });

  test("customer orders returns orders by matching phone", async () => {
    const matchingOrder = await createOrder({ phone: customer.phone });
    await createOrder({ phone: "0987654321" });

    const response = await request(app)
      .get("/api/customer/orders?page=1&limit=10")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);

    expect(response.body.data.orders).toHaveLength(1);
    expect(response.body.data.orders[0]._id).toBe(String(matchingOrder._id));
    expect(response.body.data.orders[0].shop).toMatchObject({
      _id: String(shop._id),
      name: shop.name,
      slug: shop.slug,
      status: shop.status,
    });
    expect(response.body.data.pagination).toMatchObject({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
  });

  test("customer orders matches Vietnam phone variants", async () => {
    const matchingOrder = await createOrder({ phone: "+84 912 345 678" });

    const response = await request(app)
      .get("/api/customer/orders?page=1&limit=10")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);

    expect(response.body.data.orders).toHaveLength(1);
    expect(response.body.data.orders[0]._id).toBe(String(matchingOrder._id));
  });

  test("customer order detail does not return internal fields", async () => {
    const order = await createOrder({ phone: customer.phone });

    const response = await request(app)
      .get(`/api/customer/orders/${order._id}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);

    const publicOrder = response.body.data.order;

    expect(publicOrder._id).toBe(String(order._id));
    expect(publicOrder.internalNote).toBeUndefined();
    expect(publicOrder.activityLogs).toBeUndefined();
    expect(publicOrder.commission).toBeUndefined();
    expect(publicOrder.sheetSync).toBeUndefined();
    expect(publicOrder.shop).toMatchObject({
      _id: String(shop._id),
      name: shop.name,
      slug: shop.slug,
      status: shop.status,
    });
  });

  test("claim guest order links order to customer", async () => {
    const order = await createOrder({ phone: customer.phone });
    expect(order.customerId).toBeNull();

    const response = await request(app)
      .post("/api/customer/orders/claim")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        orderCode: order.orderCode,
        phone: customer.phone,
      })
      .expect(200);

    expect(response.body.data.order.customerId).toBe(String(customer._id));
    expect(response.body.data.order.internalNote).toBeUndefined();
    expect(response.body.data.order.activityLogs).toBeUndefined();
    expect(response.body.data.order.commission).toBeUndefined();
    expect(response.body.data.order.sheetSync).toBeUndefined();

    const orderInDb = await Order.findById(order._id);
    expect(String(orderInDb.customerId)).toBe(String(customer._id));
  });

  test("customer orders shows order after claim", async () => {
    const order = await createOrder({ phone: customer.phone });

    await request(app)
      .post("/api/customer/orders/claim")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        orderCode: order.orderCode,
        phone: customer.phone,
      })
      .expect(200);

    const response = await request(app)
      .get("/api/customer/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);

    expect(response.body.data.orders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ _id: String(order._id) }),
      ]),
    );
  });

  test("claim wrong phone returns 400", async () => {
    const order = await createOrder({ phone: customer.phone });

    const response = await request(app)
      .post("/api/customer/orders/claim")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        orderCode: order.orderCode,
        phone: "0909999999",
      })
      .expect(400);

    expect(response.body.message).toBe(
      "Số điện thoại tài khoản không khớp với số điện thoại đặt đơn.",
    );
  });

  test("claim order linked to another user returns 403", async () => {
    const otherUser = await User.create({
      role: "customer",
      fullName: "Other Customer",
      phone: "0903333333",
      email: "other.claim@example.com",
      status: "active",
    });
    const order = await createOrder({
      phone: customer.phone,
      customerId: otherUser._id,
    });

    const response = await request(app)
      .post("/api/customer/orders/claim")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        orderCode: order.orderCode,
        phone: customer.phone,
      })
      .expect(403);

    expect(response.body.message).toBe(
      "Đơn hàng này đã được liên kết với tài khoản khác.",
    );
  });

  test("public checkout still works without token", async () => {
    const product = await Product.create({
      shopId: shop._id,
      sku: "PUBLIC-001",
      name: "Public checkout product",
      slug: "public-checkout-product",
      price: 120000,
      salePrice: 100000,
      priceMode: "fixed",
      status: "active",
    });

    const response = await request(app)
      .post("/api/public/orders")
      .send({
        shopSlug: shop.slug,
        customer: {
          name: "Guest Customer",
          phone: "0902222222",
          address: "Guest address",
        },
        items: [{ productId: product._id.toString(), quantity: 1 }],
      })
      .expect(201);

    expect(response.body.data.order.customerId).toBeNull();
    expect(response.body.data.order.money.grandTotal).toBe(100000);
  });

  test("public checkout links customerId when valid customer token exists", async () => {
    const product = await Product.create({
      shopId: shop._id,
      sku: "PUBLIC-002",
      name: "Public checkout linked product",
      slug: "public-checkout-linked-product",
      price: 50000,
      priceMode: "fixed",
      status: "active",
    });

    const response = await request(app)
      .post("/api/public/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        shopSlug: shop.slug,
        customer: {
          name: "Customer Test",
          phone: customer.phone,
          address: "Linked address",
        },
        items: [{ productId: product._id.toString(), quantity: 1 }],
      })
      .expect(201);

    expect(response.body.data.order.customerId).toBe(String(customer._id));
  });
});
