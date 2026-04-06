const express = require("express");
const { body } = require("express-validator");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validateMiddleware");
const {
  addComment,
  getComments,
  updateComment,
  deleteComment,
  likeComment,
} = require("../controllers/commentController");

const router = express.Router();

const commentValidationRules = [
  body("content")
    .trim()
    .isLength({ min: 2, max: 1000 })
    .withMessage("Comment must be between 2 and 1000 characters"),
  validate,
];

router.post("/:blogId", protect, commentValidationRules, addComment);
router.get("/:blogId", getComments);
router.put("/:commentId", protect, commentValidationRules, updateComment);
router.delete("/:commentId", protect, deleteComment);
router.post("/:commentId/like", protect, likeComment);

module.exports = router;
