const { v4: uuidv4 } = require("uuid");

module.exports = (req, res, next) => {
  const requestId = req.headers["x-request-id"] || uuidv4();
  const traceId = req.headers["x-trace-id"] || requestId;

  req.requestId = requestId;
  req.traceId = traceId;

  res.setHeader("x-request-id", requestId);
  res.setHeader("x-trace-id", traceId);

  next();
};
