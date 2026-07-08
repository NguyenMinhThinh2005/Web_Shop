const bcrypt = require("bcryptjs");
const { User } = require("../../models/index.js");
const { normalizePhone } = require("../../utils/validators.js");
const { signAccessToken, signRefreshToken } = require("../../utils/jwt.js");

function mapCustomer(user) {
  return {
    _id: user._id,
    role: user.role,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    status: user.status,
    defaultAddressId: user.defaultAddressId || null,
  };
}

function buildAuthResponse(user) {
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
    user: mapCustomer(user),
  };
}

async function ensureUniqueCustomer({ phone, email }) {
  const conditions = [{ phone }];

  if (email) {
    conditions.push({ email });
  }

  const existingUser = await User.findOne({ $or: conditions });

  if (!existingUser) {
    return;
  }

  const error = new Error(
    existingUser.phone === phone
      ? "Phone already exists"
      : "Email already exists",
  );
  error.statusCode = 409;
  throw error;
}

async function registerCustomer(payload) {
  const phone = normalizePhone(payload.phone);
  const email = payload.email ? payload.email.trim().toLowerCase() : undefined;

  await ensureUniqueCustomer({ phone, email });

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = await User.create({
    role: "customer",
    fullName: payload.fullName,
    phone,
    email,
    passwordHash,
    status: "active",
  });

  return buildAuthResponse(user);
}

async function loginCustomer({ phoneOrEmail, password }) {
  const loginValue = String(phoneOrEmail || "").trim();
  const normalizedEmail = loginValue.toLowerCase();
  const normalizedPhone = normalizePhone(loginValue);
  const query = loginValue.includes("@")
    ? { email: normalizedEmail }
    : { phone: normalizedPhone };

  const user = await User.findOne({
    ...query,
    role: "customer",
  }).select("+passwordHash");

  if (!user) {
    const error = new Error("Invalid phone/email or password");
    error.statusCode = 401;
    throw error;
  }

  if (user.status !== "active") {
    const error = new Error("Customer account is blocked");
    error.statusCode = 403;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.passwordHash || "",
  );

  if (!isPasswordValid) {
    const error = new Error("Invalid phone/email or password");
    error.statusCode = 401;
    throw error;
  }

  return buildAuthResponse(user);
}

module.exports = {
  registerCustomer,
  loginCustomer,
  mapCustomer,
};
