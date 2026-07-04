const { normalizeSlug } = require("./validators.js");

function slugify(value) {
  return normalizeSlug(value);
}

module.exports = slugify;
