const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const authRoutes = require("./routes/authRoutes");
const blogRoutes = require("./routes/blogRoutes");
const commentRoutes = require("./routes/commentRoutes");
const userRoutes = require("./routes/userRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const rateLimiter = require("./middleware/rateLimiter");
const setSecurityHeaders = require("./middleware/securityMiddleware");
const requestTracer = require("./middleware/requestTracer");
const { requestLogger } = require("./middleware/logger");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Advanced Blog Platform API",
      version: "1.0.0",
      description: "A comprehensive blog platform with real-time features, user management, and social interactions",
      contact: {
        name: "API Support",
        email: "support@blogplatform.com",
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 1010}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js", "./models/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
const app = express();
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim())
  : "*";

app.set("trust proxy", 1);
app.use(requestTracer);
app.use(requestLogger);
app.use(setSecurityHeaders);
app.use(rateLimiter);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const healthHandler = (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
};

app.get("/api/health", healthHandler);
app.get("/api/v1/health", healthHandler);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/v1/blogs", blogRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/v1/uploads", uploadRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
