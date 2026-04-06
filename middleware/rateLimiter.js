const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 300;
const requests = new Map();

const rateLimiter = (req, res, next) => {
  const key = req.ip || req.connection.remoteAddress || "anonymous";
  const currentTime = Date.now();
  const entry = requests.get(key) || { count: 0, startTime: currentTime };

  if (currentTime - entry.startTime > WINDOW_MS) {
    entry.count = 0;
    entry.startTime = currentTime;
  }

  entry.count += 1;
  requests.set(key, entry);

  if (entry.count > MAX_REQUESTS) {
    return res.status(429).json({
      message: "Too many requests. Please try again later.",
    });
  }

  return next();
};

module.exports = rateLimiter;
