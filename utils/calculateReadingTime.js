const calculateReadingTime = (content = "") => {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
};

module.exports = calculateReadingTime;
