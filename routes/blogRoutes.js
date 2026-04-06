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

/**
 * @swagger
 * /api/blogs:
 *   get:
 *     summary: Get all published blogs with pagination and filtering
 *     tags: [Blogs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of blogs per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query for title, content, or tags
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by tag
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filter by author ID
 *     responses:
 *       200:
 *         description: Blogs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 blogs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Blog'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalBlogs:
 *                   type: integer
 */
router.get("/", getBlogs);

/**
 * @swagger
 * /api/blogs/featured:
 *   get:
 *     summary: Get featured blogs
 *     tags: [Blogs]
 *     responses:
 *       200:
 *         description: Featured blogs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Blog'
 */
router.get("/featured", getFeaturedBlogs);

/**
 * @swagger
 * /api/blogs/drafts:
 *   get:
 *     summary: Get user's draft blogs
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Draft blogs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Blog'
 *       401:
 *         description: Unauthorized
 */
router.get("/drafts", protect, getDrafts);

/**
 * @swagger
 * /api/blogs/dashboard:
 *   get:
 *     summary: Get user's dashboard statistics
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/dashboard", protect, getMyDashboard);

/**
 * @swagger
 * /api/blogs:
 *   post:
 *     summary: Create a new blog post
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 180
 *               content:
 *                 type: string
 *                 minLength: 50
 *               excerpt:
 *                 type: string
 *                 maxLength: 320
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               image:
 *                 type: string
 *                 format: uri
 *               published:
 *                 type: boolean
 *                 default: true
 *               metaTitle:
 *                 type: string
 *                 maxLength: 70
 *               metaDescription:
 *                 type: string
 *                 maxLength: 160
 *     responses:
 *       201:
 *         description: Blog created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Blog'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/", protect, createBlogValidationRules, createBlog);

/**
 * @swagger
 * /api/blogs/{id}/like:
 *   post:
 *     summary: Like or unlike a blog post
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     responses:
 *       200:
 *         description: Blog like status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 likes:
 *                   type: integer
 *                 liked:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Blog not found
 */
router.post("/:id/like", protect, likeBlog);

/**
 * @swagger
 * /api/blogs/{id}/bookmark:
 *   post:
 *     summary: Bookmark or unbookmark a blog post
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     responses:
 *       200:
 *         description: Bookmark status updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Blog not found
 */
router.post("/:id/bookmark", protect, toggleBookmark);

/**
 * @swagger
 * /api/blogs/{idOrSlug}:
 *   get:
 *     summary: Get a blog post by ID or slug
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: idOrSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID or slug
 *     responses:
 *       200:
 *         description: Blog retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Blog'
 *       404:
 *         description: Blog not found
 */
router.get("/:idOrSlug", getBlogById);

/**
 * @swagger
 * /api/blogs/{id}:
 *   put:
 *     summary: Update a blog post
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 180
 *               content:
 *                 type: string
 *                 minLength: 50
 *               excerpt:
 *                 type: string
 *                 maxLength: 320
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               image:
 *                 type: string
 *                 format: uri
 *               published:
 *                 type: boolean
 *               metaTitle:
 *                 type: string
 *                 maxLength: 70
 *               metaDescription:
 *                 type: string
 *                 maxLength: 160
 *     responses:
 *       200:
 *         description: Blog updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Blog'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Blog not found
 */
router.put("/:id", protect, sharedBlogValidationRules, updateBlog);

/**
 * @swagger
 * /api/blogs/{id}:
 *   delete:
 *     summary: Delete a blog post
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     responses:
 *       200:
 *         description: Blog deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Blog not found
 */
router.delete("/:id", protect, deleteBlog);

module.exports = router;
