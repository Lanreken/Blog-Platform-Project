const normalizeList = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => item.toString().trim()).filter(Boolean))];
  }

  return [...new Set(
    value
      .toString()
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  )];
};

module.exports = normalizeList;
