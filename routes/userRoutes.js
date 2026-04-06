const express = require("express");
const { body } = require("express-validator");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validateMiddleware");
const {
  getProfile,
  updateProfile,
  followUser,
  getUsers,
  getBookmarkedBlogs,
} = require("../controllers/userController");

const router = express.Router();

router.get("/", getUsers);
router.get("/profile/:id?", protect, getProfile);
router.get("/bookmarks", protect, getBookmarkedBlogs);
router.put(
  "/profile",
  protect,
  [
    body("name").optional().trim().isLength({ min: 2, max: 80 }).withMessage("Name must be between 2 and 80 characters"),
    body("bio").optional().isLength({ max: 500 }).withMessage("Bio cannot exceed 500 characters"),
    body("avatar").optional().isURL().withMessage("Avatar must be a valid URL"),
    body("website").optional().isURL().withMessage("Website must be a valid URL"),
    body("socialLinks.twitter").optional().isURL().withMessage("Twitter link must be a valid URL"),
    body("socialLinks.linkedin").optional().isURL().withMessage("LinkedIn link must be a valid URL"),
    body("socialLinks.github").optional().isURL().withMessage("GitHub link must be a valid URL"),
    validate,
  ],
  updateProfile
);
router.post("/:id/follow", protect, followUser);

module.exports = router;
