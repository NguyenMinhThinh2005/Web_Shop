const mongoose = require("mongoose");
const request = require("supertest");

const app = require("../../app.js");
const env = require("../../config/env.js");
const { Category, Product, Shop, User } = require("../../models/index.js");
const { signAccessToken } = require("../../utils/jwt.js");

describe("Product JSON import and pin integration", () => {
  let adminToken;
  let shop;

  beforeAll(async () => {
    expect(env.mongodbUri).toContain("test");
    await mongoose.connect(env.mongodbUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Promise.all([
      Product.deleteMany({}),
      Category.deleteMany({}),
      Shop.deleteMany({}),
      User.deleteMany({}),
    ]);

    const admin = await User.create({
      role: "admin",
      fullName: "Admin Import Test",
      email: "admin.import.test@example.com",
      status: "active",
    });
    adminToken = signAccessToken(admin);

    shop = await Shop.create({
      name: "Import Test Shop",
      slug: "import-test-shop",
      status: "active",
    });
  });

  function auth(requestBuilder) {
    return requestBuilder.set("Authorization", `Bearer ${adminToken}`);
  }

  function importBody(overrides = {}) {
    return {
      schemaVersion: "1.0",
      source: "jest",
      products: [
        {
          importKey: "IMP-001",
          sku: "IMP-001",
          name: "Imported product",
          slug: "imported-product",
          categoryName: "Imported category",
          price: 100000,
          priceMode: "fixed",
          thumbnailUrl: "https://example.com/imp-001.jpg",
          images: [
            "https://example.com/imp-001.jpg",
            "https://example.com/imp-001.jpg",
            { url: "https://example.com/imp-001-2.jpg" },
          ],
          status: "active",
          isPinned: true,
          pinnedOrder: 99,
          ...overrides,
        },
      ],
    };
  }

  async function commitImport(body = importBody()) {
    return auth(
      request(app).post(`/api/admin/shops/${shop._id}/products/import-json`),
    )
      .send(body)
      .expect(200);
  }

  test("validate import JSON does not write database", async () => {
    const response = await auth(
      request(app).post(
        `/api/admin/shops/${shop._id}/products/import-json/validate`,
      ),
    )
      .send(importBody())
      .expect(200);

    expect(response.body.data.summary).toMatchObject({
      total: 1,
      valid: 1,
      created: 1,
      updated: 0,
      skipped: 0,
    });
    expect(response.body.data.summary.categoriesToCreate).toEqual([
      "Imported category",
    ]);
    expect(await Product.countDocuments({})).toBe(0);
    expect(await Category.countDocuments({})).toBe(0);
  });

  test("admin create shop accepts slug with hyphen and underscore", async () => {
    const response = await auth(request(app).post("/api/admin/shops"))
      .send({
        name: "Shop Slug Test 01",
        slug: "shop-test_01",
        status: "active",
      })
      .expect(201);

    expect(response.body.data.shop.slug).toBe("shop-test_01");
  });

  test("admin create shop rejects slug starting or ending with separator", async () => {
    const startResponse = await auth(request(app).post("/api/admin/shops"))
      .send({
        name: "Invalid Start Slug",
        slug: "-shoptest",
        status: "active",
      })
      .expect(400);

    expect(startResponse.body.message).toBe(
      "Slug chỉ gồm chữ thường, số, dấu gạch ngang (-) hoặc gạch dưới (_), không bắt đầu/kết thúc bằng dấu.",
    );

    const endResponse = await auth(request(app).post("/api/admin/shops"))
      .send({
        name: "Invalid End Slug",
        slug: "shoptest-",
        status: "active",
      })
      .expect(400);

    expect(endResponse.body.message).toBe(
      "Slug chỉ gồm chữ thường, số, dấu gạch ngang (-) hoặc gạch dưới (_), không bắt đầu/kết thúc bằng dấu.",
    );
  });

  test("validate import returns SHOP_SLUG_MISMATCH when JSON shopSlug differs", async () => {
    const response = await auth(
      request(app).post(
        `/api/admin/shops/${shop._id}/products/import-json/validate`,
      ),
    )
      .send({
        ...importBody(),
        shopSlug: "chu-tam-tan-xe",
      })
      .expect(400);

    expect(response.body.code).toBe("SHOP_SLUG_MISMATCH");
    expect(response.body.currentShopSlug).toBe(shop.slug);
    expect(response.body.jsonShopSlug).toBe("chu-tam-tan-xe");
    expect(response.body.message).toBe(
      "JSON shopSlug không khớp với shop hiện tại.",
    );
  });

  test("validate full draft import handles many products", async () => {
    const products = Array.from({ length: 120 }).map((_, index) => ({
      importKey: `BULK-${index}`,
      name: `Bulk product ${index}`,
      categoryName: "Bulk category",
      status: "draft",
    }));

    const response = await auth(
      request(app).post(
        `/api/admin/shops/${shop._id}/products/import-json/validate`,
      ),
    )
      .send({ schemaVersion: "1.0", source: "jest", products })
      .expect(200);

    expect(response.body.data.summary).toMatchObject({
      total: 120,
      valid: 120,
      created: 120,
      skipped: 0,
    });
  });

  test("commit import creates product and category", async () => {
    const response = await commitImport();

    expect(response.body.data.summary).toMatchObject({
      total: 1,
      valid: 1,
      created: 1,
      updated: 0,
      skipped: 0,
    });

    const product = await Product.findOne({ importKey: "IMP-001" });
    expect(product).toBeTruthy();
    expect(product.name).toBe("Imported product");
    expect(product.categoryIds).toHaveLength(1);
    expect(await Category.countDocuments({ shopId: shop._id })).toBe(1);
  });

  test("re-import with same importKey updates product without duplicate", async () => {
    await commitImport();
    await commitImport(importBody({ name: "Imported product updated" }));

    expect(await Product.countDocuments({ importKey: "IMP-001" })).toBe(1);
    const product = await Product.findOne({ importKey: "IMP-001" });
    expect(product.name).toBe("Imported product updated");
  });

  test("product without sku but with importKey imports successfully", async () => {
    await commitImport(importBody({ sku: undefined, importKey: "NO-SKU-001" }));

    const product = await Product.findOne({ importKey: "NO-SKU-001" });
    expect(product).toBeTruthy();
    expect(product.sku).toBe("NO-SKU-001");
  });

  test("missing price becomes contact price mode", async () => {
    await commitImport(importBody({ importKey: "CONTACT-001", price: undefined }));

    const product = await Product.findOne({ importKey: "CONTACT-001" });
    expect(product.price).toBe(0);
    expect(product.priceMode).toBe("contact");
  });

  test("multiple images import and remove duplicate URLs", async () => {
    await commitImport();

    const product = await Product.findOne({ importKey: "IMP-001" });
    expect(product.images).toEqual([
      "https://example.com/imp-001.jpg",
      "https://example.com/imp-001-2.jpg",
    ]);
    expect(product.thumbnailUrl).toBe("https://example.com/imp-001.jpg");
  });

  test("product without image still imports", async () => {
    await commitImport(
      importBody({
        importKey: "NO-IMAGE-001",
        thumbnailUrl: "",
        images: [],
      }),
    );

    const product = await Product.findOne({ importKey: "NO-IMAGE-001" });
    expect(product).toBeTruthy();
    expect(product.thumbnailUrl).toBe("");
    expect(product.images).toEqual([]);
  });

  test("JSON pin fields are ignored on import", async () => {
    await commitImport();

    const product = await Product.findOne({ importKey: "IMP-001" });
    expect(product.isPinned).toBe(false);
    expect(product.pinnedOrder).toBe(0);
    expect(product.pinnedAt).toBeNull();
  });

  test("re-import does not reset manual pin", async () => {
    await commitImport();
    let product = await Product.findOne({ importKey: "IMP-001" });

    await auth(request(app).patch(`/api/admin/products/${product._id}/pin`))
      .send({ isPinned: true, pinnedOrder: 1 })
      .expect(200);

    await commitImport(importBody({ name: "Pinned product updated" }));

    product = await Product.findOne({ importKey: "IMP-001" });
    expect(product.isPinned).toBe(true);
    expect(product.pinnedOrder).toBe(1);
    expect(product.pinnedAt).toBeTruthy();
  });

  test("pin and unpin product successfully", async () => {
    await commitImport();
    const product = await Product.findOne({ importKey: "IMP-001" });

    const pinResponse = await auth(
      request(app).patch(`/api/admin/products/${product._id}/pin`),
    )
      .send({ isPinned: true, pinnedOrder: 2 })
      .expect(200);

    expect(pinResponse.body.data.product.isPinned).toBe(true);
    expect(pinResponse.body.data.product.pinnedOrder).toBe(2);
    expect(pinResponse.body.data.product.pinnedAt).toBeTruthy();

    const unpinResponse = await auth(
      request(app).patch(`/api/admin/products/${product._id}/pin`),
    )
      .send({ isPinned: false })
      .expect(200);

    expect(unpinResponse.body.data.product.isPinned).toBe(false);
    expect(unpinResponse.body.data.product.pinnedOrder).toBe(0);
    expect(unpinResponse.body.data.product.pinnedAt).toBeNull();
  });

  test("public products return pinned active product first", async () => {
    await Product.create([
      {
        shopId: shop._id,
        sku: "NORMAL-001",
        name: "Normal product",
        slug: "normal-product",
        price: 100000,
        status: "active",
      },
      {
        shopId: shop._id,
        sku: "PINNED-001",
        name: "Pinned product",
        slug: "pinned-product",
        price: 100000,
        status: "active",
        isPinned: true,
        pinnedOrder: 1,
        pinnedAt: new Date(),
      },
    ]);

    const response = await request(app)
      .get(`/api/public/shops/${shop.slug}/products`)
      .expect(200);

    expect(response.body.data.products.map((product) => product.sku)).toEqual([
      "PINNED-001",
      "NORMAL-001",
    ]);
  });

  test("draft pinned product is hidden from public products", async () => {
    await Product.create({
      shopId: shop._id,
      sku: "DRAFT-PINNED-001",
      name: "Draft pinned product",
      slug: "draft-pinned-product",
      price: 100000,
      status: "draft",
      isPinned: true,
      pinnedOrder: 1,
      pinnedAt: new Date(),
    });

    const response = await request(app)
      .get(`/api/public/shops/${shop.slug}/products`)
      .expect(200);

    expect(response.body.data.products).toHaveLength(0);
  });
});
