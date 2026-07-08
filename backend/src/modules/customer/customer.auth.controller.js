const { z } = require("zod");
const asyncHandler = require("../../utils/asyncHandler.js");
const { successResponse } = require("../../utils/apiResponse.js");
const { isValidVietnamPhone } = require("../../utils/validators.js");
const customerAuthService = require("./customer.auth.service.js");

const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone is required")
  .refine(isValidVietnamPhone, "Invalid Vietnam phone");

const registerSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  phone: phoneSchema,
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  phoneOrEmail: z.string().trim().min(1, "Phone or email is required"),
  password: z.string().min(1, "Password is required"),
});

function validate(schema, data, message) {
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    const error = new Error(message);
    error.statusCode = 400;
    error.errors = parsed.error.flatten();
    throw error;
  }

  return parsed.data;
}

const register = asyncHandler(async (req, res) => {
  const payload = validate(registerSchema, req.body, "Invalid register data");
  const data = await customerAuthService.registerCustomer(payload);

  return successResponse(res, {
    statusCode: 201,
    message: "Customer register success",
    data,
  });
});

const login = asyncHandler(async (req, res) => {
  const payload = validate(loginSchema, req.body, "Invalid login data");
  const data = await customerAuthService.loginCustomer(payload);

  return successResponse(res, {
    message: "Customer login success",
    data,
  });
});

const me = asyncHandler(async (req, res) => {
  return successResponse(res, {
    message: "Current customer",
    data: {
      user: customerAuthService.mapCustomer(req.user),
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  return successResponse(res, {
    message: "Customer logout success",
    data: null,
  });
});

module.exports = {
  register,
  login,
  me,
  logout,
};
