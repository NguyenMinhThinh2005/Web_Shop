const env = require("../config/env.js");

function pad(value) {
  return String(value).padStart(2, "0");
}

function buildTimestamp(date = new Date()) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

function generateOrderCode() {
  const prefix = env.defaultOrderPrefix || "NLAI";
  const randomDigits = String(Math.floor(Math.random() * 10000)).padStart(
    4,
    "0",
  );

  return `${prefix}-${buildTimestamp()}-${randomDigits}`;
}

module.exports = generateOrderCode;
