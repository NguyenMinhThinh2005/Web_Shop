const bcrypt = require("bcryptjs");
const { User } = require("../../models");
const { signAccessToken, signRefreshToken } = require("../../utils/jwt");

async function loginAdmin({ email, password }) {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
    role: "admin",
  }).select("+passwordHash");

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  if (user.status !== "active") {
    const error = new Error("Admin account is blocked");
    error.statusCode = 403;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.passwordHash || "",
  );

  if (!isPasswordValid) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      role: user.role,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
    },
  };
}

function getMe(user) {
  return {
    id: user._id,
    role: user.role,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    status: user.status,
  };
}

module.exports = {
  loginAdmin,
  getMe,
};
