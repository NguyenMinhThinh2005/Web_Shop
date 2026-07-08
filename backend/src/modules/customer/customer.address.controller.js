const { z } = require("zod");
const asyncHandler = require("../../utils/asyncHandler.js");
const { successResponse } = require("../../utils/apiResponse.js");
const { isValidVietnamPhone } = require("../../utils/validators.js");
const customerAddressService = require("./customer.address.service.js");

const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone is required")
  .refine(isValidVietnamPhone, "Invalid Vietnam phone");

const createAddressSchema = z.object({
  receiverName: z.string().trim().min(1, "Receiver name is required"),
  phone: phoneSchema,
  province: z.string().trim().optional(),
  district: z.string().trim().optional(),
  ward: z.string().trim().optional(),
  addressLine: z.string().trim().min(1, "Address line is required"),
  note: z.string().trim().optional(),
  isDefault: z.boolean().optional(),
});

const updateAddressSchema = createAddressSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "Address update data is required",
  },
);

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

const listAddresses = asyncHandler(async (req, res) => {
  const addresses = await customerAddressService.listAddresses(req.user);

  return successResponse(res, {
    message: "Customer address list",
    data: { addresses },
  });
});

const createAddress = asyncHandler(async (req, res) => {
  const payload = validate(
    createAddressSchema,
    req.body,
    "Invalid address data",
  );
  const address = await customerAddressService.createAddress(req.user, payload);

  return successResponse(res, {
    statusCode: 201,
    message: "Customer address created",
    data: { address },
  });
});

const updateAddress = asyncHandler(async (req, res) => {
  const payload = validate(
    updateAddressSchema,
    req.body,
    "Invalid address data",
  );
  const address = await customerAddressService.updateAddress(
    req.user,
    req.params.addressId,
    payload,
  );

  return successResponse(res, {
    message: "Customer address updated",
    data: { address },
  });
});

const deleteAddress = asyncHandler(async (req, res) => {
  const result = await customerAddressService.deleteAddress(
    req.user,
    req.params.addressId,
  );

  return successResponse(res, {
    message: "Customer address deleted",
    data: result,
  });
});

module.exports = {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
};
