function normalizePhone(phone) {
  return String(phone || "").trim().replace(/\D/g, "");
}

function isValidVietnamPhone(phone) {
  const value = String(phone || "").trim();

  if (!value || !/^\+?[\d\s.-]+$/.test(value)) {
    return false;
  }

  const digits = normalizePhone(value);

  if (/^(\d)\1+$/.test(digits)) {
    return false;
  }

  if (digits.startsWith("0")) {
    return digits.length === 10;
  }

  if (digits.startsWith("84")) {
    return digits.length === 11;
  }

  return false;
}

function isHttpUrl(value) {
  const trimmedValue = String(value || "").trim();

  if (!trimmedValue) {
    return true;
  }

  try {
    const url = new URL(trimmedValue);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (error) {
    return false;
  }
}

function normalizeSlug(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
}

function isValidSlug(value) {
  const slug = String(value || "").trim();
  return Boolean(slug) && /^(?:[a-z0-9]|[a-z0-9][a-z0-9_-]*[a-z0-9])$/.test(slug);
}

module.exports = {
  isValidVietnamPhone,
  normalizePhone,
  isHttpUrl,
  normalizeSlug,
  isValidSlug,
};
