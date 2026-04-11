const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf, json, colorize } = format;

const formatEntry = combine(
  timestamp({ format: "YYYY-MM-DDTHH:mm:ss.SSSZ" }),
  json()
);

const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: formatEntry,
  transports: [
    new transports.Console({
      format: process.env.NODE_ENV === "production" ? formatEntry : combine(colorize(), timestamp({ format: "YYYY-MM-DDTHH:mm:ss.SSSZ" }), printf(({ level, message, timestamp, ...meta }) => {
        const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : "";
        return `${timestamp} [${level}]: ${message} ${metaString}`;
      })),
    }),
  ],
});

const requestLogger = (req, res, next) => {
  req.logger = logger.child({ requestId: req.requestId, traceId: req.traceId });
  req.logger.info("Incoming request", {
    method: req.method,
    url: req.originalUrl,
    headers: {
      "user-agent": req.headers["user-agent"],
      "x-forwarded-for": req.headers["x-forwarded-for"],
    },
  });
  next();
};

module.exports = {
  logger,
  requestLogger,
};
