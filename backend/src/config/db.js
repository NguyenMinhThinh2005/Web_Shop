const mongoose = require("mongoose");
const env = require("./env");

async function connectDB() {
  try {
    const conn = await mongoose.connect(env.mongodbUri);

    console.log(`MongoDB connected: ${conn.connection.host}`);
    console.log(`Database name: ${conn.connection.name}`);

    return conn;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
