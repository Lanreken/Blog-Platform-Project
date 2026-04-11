const notFound = (req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode >= 400 ? res.statusCode : 500;

  if (req.logger) {
    req.logger.error("Unhandled error", {
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  } else {
    console.error(err);
  }

  res.status(statusCode).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

module.exports = {
  notFound,
  errorHandler,
};
