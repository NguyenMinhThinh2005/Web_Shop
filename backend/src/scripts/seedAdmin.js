const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const env = require("../config/env");
const { User } = require("../models");

async function seedAdmin() {
  await connectDB();

  const fullName = process.env.SEED_ADMIN_NAME || "Admin";
  const email = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin@123456";

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await User.findOneAndUpdate(
    {
      email: email.toLowerCase(),
      role: "admin",
    },
    {
      $set: {
        role: "admin",
        fullName,
        email: email.toLowerCase(),
        passwordHash,
        status: "active",
      },
    },
    {
      upsert: true,
      new: true,
    },
  );

  console.log("Admin seeded:");
  console.log({
    id: admin._id.toString(),
    fullName: admin.fullName,
    email: admin.email,
    role: admin.role,
  });

  process.exit(0);
}

seedAdmin().catch((error) => {
  console.error("Seed admin failed:", error);
  process.exit(1);
});
