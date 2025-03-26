const express = require("express");
const { protect, admin } = require("../middleware/authMiddleware");
const {
  addComment,
  getComments,
  deleteComment,
} = require("../controllers/commentController");

const router = express.Router();

router.post("/:blogId", protect, addComment);
router.get("/:blogId", getComments);
router.delete("/:commentId", protect, deleteComment);

module.exports = router;
