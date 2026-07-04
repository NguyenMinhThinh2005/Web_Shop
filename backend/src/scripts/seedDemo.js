const mongoose = require("mongoose");
const connectDB = require("../config/db.js");
const { Category, Product, Shop } = require("../models/index.js");

const DEMO_SHOP = {
  name: "Chú Tám Tân Xe Demo",
  slug: "chu-tam-tan-xe-demo",
  description:
    "Shop demo phụ tùng xe máy để kiểm tra luồng đặt hàng nhanh.",
  campaignId: "chutam-demo",
  contact: {
    messengerUrl: "https://m.me/demo",
    zaloUrl: "https://zalo.me/0900000000",
    hotline: "0900000000",
  },
  checkoutConfig: {
    allowGuestCheckout: true,
    suggestLoginAfterOrder: true,
    requireAddress: true,
    requireProvince: false,
  },
  sheetConfig: {
    enabled: false,
    syncMode: "manual",
    webhookUrl: "",
  },
  status: "active",
};

const CATEGORY_DEMOS = [
  {
    name: "Nhông sên dĩa",
    slug: "nhong-sen-dia",
    sortOrder: 10,
  },
  {
    name: "Bảo vệ xe",
    slug: "bao-ve-xe",
    sortOrder: 20,
  },
  {
    name: "Phụ kiện nhỏ",
    slug: "phu-kien-nho",
    sortOrder: 30,
  },
  {
    name: "Sản phẩm cần tư vấn",
    slug: "san-pham-can-tu-van",
    sortOrder: 40,
  },
];

const PRODUCT_DEMOS = [
  {
    sku: "DEMO-NSD-428H",
    slug: "bo-nhong-sen-dia-428h-cho-xe-pho-thong",
    name: "Bộ nhông sên dĩa 428H cho xe phổ thông",
    categorySlug: "nhong-sen-dia",
    priceMode: "fixed",
    price: 520000,
    salePrice: 480000,
    thumbnailUrl: "https://placehold.co/800x600?text=NSD+428H",
    images: [
      "https://placehold.co/800x600?text=NSD+428H",
      "https://placehold.co/800x600?text=Bo+nhong+sen+dia",
    ],
    isFeatured: true,
    sortOrder: 10,
    attributes: {
      Loại: "Bộ nhông sên dĩa",
      "Dòng sên": "428H",
      "Phù hợp": "Xe phổ thông",
      "Ghi chú": "Dữ liệu demo",
    },
  },
  {
    sku: "DEMO-SEN-428",
    slug: "sen-xe-428-chong-rao-demo",
    name: "Sên xe 428 chống rão demo",
    categorySlug: "nhong-sen-dia",
    priceMode: "fixed",
    price: 280000,
    salePrice: null,
    thumbnailUrl: "https://placehold.co/800x600?text=Sen+428",
    images: ["https://placehold.co/800x600?text=Sen+428"],
    sortOrder: 20,
    attributes: {
      "Dòng sên": "428",
      "Ghi chú": "Dữ liệu demo",
    },
  },
  {
    sku: "DEMO-DIA-428",
    slug: "dia-tai-428-demo",
    name: "Dĩa tải 428 demo cho xe phổ thông",
    categorySlug: "nhong-sen-dia",
    priceMode: "fixed",
    price: 180000,
    salePrice: null,
    thumbnailUrl: "",
    images: [],
    sortOrder: 30,
    attributes: {
      Loại: "Dĩa tải",
      "Dòng sên": "428",
    },
  },
  {
    sku: "DEMO-BOC-CHAN-CHONG",
    slug: "boc-chan-chong-cao-su-chong-truot",
    name: "Bọc chân chống cao su chống trượt",
    categorySlug: "bao-ve-xe",
    priceMode: "fixed",
    price: 45000,
    salePrice: 39000,
    thumbnailUrl: "https://placehold.co/800x600?text=Boc+chan+chong",
    images: ["https://placehold.co/800x600?text=Boc+chan+chong"],
    isFeatured: true,
    sortOrder: 40,
  },
  {
    sku: "DEMO-GAC-CHAN",
    slug: "mieng-bao-ve-gac-chan-demo",
    name: "Miếng bảo vệ gác chân demo",
    categorySlug: "bao-ve-xe",
    priceMode: "fixed",
    price: 55000,
    salePrice: null,
    thumbnailUrl: "",
    images: [],
    sortOrder: 50,
  },
  {
    sku: "DEMO-PHU-KIEN-001",
    slug: "bo-oc-trang-tri-xe-may-demo",
    name: "Bộ ốc trang trí xe máy demo",
    categorySlug: "phu-kien-nho",
    priceMode: "fixed",
    price: 65000,
    salePrice: null,
    thumbnailUrl: "https://placehold.co/800x600?text=Oc+trang+tri",
    images: ["https://placehold.co/800x600?text=Oc+trang+tri"],
    sortOrder: 60,
    attributes: {
      Loại: "Phụ kiện trang trí",
      "Ghi chú": "Dữ liệu demo",
    },
  },
  {
    sku: "DEMO-MOC-KHOA",
    slug: "moc-khoa-xe-may-demo",
    name: "Móc khóa xe máy demo",
    categorySlug: "phu-kien-nho",
    priceMode: "fixed",
    price: 30000,
    salePrice: 25000,
    thumbnailUrl: "",
    images: [],
    sortOrder: 70,
  },
  {
    sku: "DEMO-TU-VAN-001",
    slug: "combo-phu-tung-can-tu-van-theo-dong-xe",
    name: "Combo phụ tùng cần tư vấn theo dòng xe",
    categorySlug: "san-pham-can-tu-van",
    priceMode: "contact",
    price: 0,
    salePrice: null,
    thumbnailUrl: "https://placehold.co/800x600?text=Can+tu+van",
    images: ["https://placehold.co/800x600?text=Can+tu+van"],
    isFeatured: true,
    sortOrder: 80,
    attributes: {
      "Tư vấn": "Chọn theo dòng xe",
      "Ghi chú": "Dữ liệu demo",
    },
  },
  {
    sku: "DEMO-HIDDEN-001",
    slug: "san-pham-an-gia-de-bao-sau",
    name: "Sản phẩm ẩn giá để báo sau",
    categorySlug: "san-pham-can-tu-van",
    priceMode: "hidden",
    price: 0,
    salePrice: null,
    thumbnailUrl: "",
    images: [],
    sortOrder: 90,
  },
  {
    sku: "DEMO-COMBO-CARE",
    slug: "goi-cham-soc-xe-demo",
    name: "Gói chăm sóc xe demo",
    categorySlug: "bao-ve-xe",
    priceMode: "contact",
    price: 0,
    salePrice: null,
    thumbnailUrl: "https://placehold.co/800x600?text=Cham+soc+xe",
    images: ["https://placehold.co/800x600?text=Cham+soc+xe"],
    sortOrder: 100,
  },
];

async function upsertByQuery(Model, query, data) {
  const existing = await Model.findOne(query).select("_id");

  if (existing) {
    const updated = await Model.findByIdAndUpdate(
      existing._id,
      { $set: data },
      { returnDocument: "after", runValidators: true },
    );

    return { document: updated, created: false };
  }

  const document = await Model.create(data);
  return { document, created: true };
}

async function seedShop() {
  const { document: shop } = await upsertByQuery(
    Shop,
    { slug: DEMO_SHOP.slug },
    DEMO_SHOP,
  );

  return shop;
}

async function seedCategories(shop) {
  const summary = { created: 0, updated: 0 };
  const categoryBySlug = new Map();

  for (const categoryDemo of CATEGORY_DEMOS) {
    const { document: category, created } = await upsertByQuery(
      Category,
      {
        shopId: shop._id,
        slug: categoryDemo.slug,
      },
      {
        shopId: shop._id,
        name: categoryDemo.name,
        slug: categoryDemo.slug,
        description: "",
        parentId: null,
        sortOrder: categoryDemo.sortOrder,
        status: "active",
      },
    );

    summary[created ? "created" : "updated"] += 1;
    categoryBySlug.set(category.slug, category);
  }

  return { summary, categoryBySlug };
}

async function seedProducts(shop, categoryBySlug) {
  const summary = { created: 0, updated: 0 };

  for (const productDemo of PRODUCT_DEMOS) {
    const category = categoryBySlug.get(productDemo.categorySlug);

    if (!category) {
      throw new Error(`Missing demo category: ${productDemo.categorySlug}`);
    }

    const { categorySlug, ...productData } = productDemo;
    const { created } = await upsertByQuery(
      Product,
      {
        shopId: shop._id,
        sku: productData.sku,
      },
      {
        ...productData,
        shopId: shop._id,
        categoryIds: [category._id],
        shortDescription: "Sản phẩm demo để kiểm tra luồng MVP.",
        description:
          "Dữ liệu demo dùng cho QA luồng shop, giỏ hàng và đặt hàng nhanh.",
        tags: ["demo"],
        inventory: {
          trackStock: false,
          stockQuantity: null,
        },
        status: "active",
      },
    );

    summary[created ? "created" : "updated"] += 1;
  }

  return summary;
}

async function seedDemo() {
  await connectDB();

  const shop = await seedShop();
  const { summary: categorySummary, categoryBySlug } =
    await seedCategories(shop);
  const productSummary = await seedProducts(shop, categoryBySlug);

  console.log("Demo seed completed");
  console.log(`Shop: ${shop.name}`);
  console.log(`Public URL: /shop/${shop.slug}`);
  console.log(
    `Categories: created ${categorySummary.created}, updated ${categorySummary.updated}`,
  );
  console.log(
    `Products: created ${productSummary.created}, updated ${productSummary.updated}`,
  );
}

seedDemo()
  .catch((error) => {
    console.error("Demo seed failed:", error.message);
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
