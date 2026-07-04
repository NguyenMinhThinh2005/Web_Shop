const { z } = require("zod");
const asyncHandler = require("../../utils/asyncHandler");
const { successResponse } = require("../../utils/apiResponse");
const authService = require("./auth.service");

const adminLoginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

const loginAdmin = asyncHandler(async (req, res) => {
  const parsed = adminLoginSchema.safeParse(req.body);

  if (!parsed.success) {
    const error = new Error("Invalid login data");
    error.statusCode = 400;
    error.errors = parsed.error.flatten();
    throw error;
  }

  const data = await authService.loginAdmin(parsed.data);

  return successResponse(res, {
    message: "Admin login success",
    data,
  });
});

const me = asyncHandler(async (req, res) => {
  return successResponse(res, {
    message: "Current admin",
    data: {
      user: authService.getMe(req.user),
    },
  });
});

module.exports = {
  loginAdmin,
  me,
};
