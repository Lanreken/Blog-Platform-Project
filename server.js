const http = require("http");
const dotenv = require("dotenv");
const socketIo = require("socket.io");
const connectDB = require("./config/db");
const app = require("./app");
const { logger } = require("./middleware/logger");

dotenv.config();
connectDB();

const server = http.createServer(app);
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim())
  : "*";

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  logger.info("Socket connected", { socketId: socket.id });

  socket.on("join-blog", (blogId) => {
    socket.join(blogId);
    logger.info("Socket joined blog room", { socketId: socket.id, blogId });
  });

  socket.on("leave-blog", (blogId) => {
    socket.leave(blogId);
    logger.info("Socket left blog room", { socketId: socket.id, blogId });
  });

  socket.on("disconnect", () => {
    logger.info("Socket disconnected", { socketId: socket.id });
  });
});

const PORT = process.env.PORT || 1010;
server.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
