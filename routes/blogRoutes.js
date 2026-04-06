const express = require("express");
const { body } = require("express-validator");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validateMiddleware");
const {
  createBlog,
  getBlogs,
  getFeaturedBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  likeBlog,
  toggleBookmark,
  getDrafts,
  getMyDashboard,
} = require("../controllers/blogController");

const router = express.Router();

const sharedBlogValidationRules = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 6, max: 180 })
    .withMessage("Title must be between 6 and 180 characters"),
  body("content")
    .optional()
    .isLength({ min: 50 })
    .withMessage("Content must be at least 50 characters long"),
  body("excerpt")
    .optional()
    .isLength({ max: 320 })
    .withMessage("Excerpt cannot exceed 320 characters"),
  body("image").optional().isURL().withMessage("Image must be a valid URL"),
  body("metaTitle")
    .optional()
    .isLength({ max: 70 })
    .withMessage("Meta title cannot exceed 70 characters"),
  body("metaDescription")
    .optional()
    .isLength({ max: 160 })
    .withMessage("Meta description cannot exceed 160 characters"),
  validate,
];

const createBlogValidationRules = [
  body("title")
    .trim()
    .isLength({ min: 6, max: 180 })
    .withMessage("Title must be between 6 and 180 characters"),
  body("content")
    .isLength({ min: 50 })
    .withMessage("Content must be at least 50 characters long"),
  ...sharedBlogValidationRules.slice(2),
];

router.get("/", getBlogs);
router.get("/featured", getFeaturedBlogs);
router.get("/drafts", protect, getDrafts);
router.get("/dashboard", protect, getMyDashboard);
router.post("/", protect, createBlogValidationRules, createBlog);
router.post("/:id/like", protect, likeBlog);
router.post("/:id/bookmark", protect, toggleBookmark);
router.get("/:idOrSlug", getBlogById);
router.put("/:id", protect, sharedBlogValidationRules, updateBlog);
router.delete("/:id", protect, deleteBlog);

module.exports = router;
