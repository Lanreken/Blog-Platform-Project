const express = require("express");
const { protect, admin } = require("../middleware/authMiddleware");
const {
  createBlog,
  getBlogs,
  deleteBlog,
} = require("../controllers/blogController");

const router = express.Router();

router.post("/", protect, createBlog);
router.get("/", getBlogs);
router.delete("/:id", protect, admin, deleteBlog);

module.exports = router;
