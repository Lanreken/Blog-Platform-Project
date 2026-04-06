const express = require("express");
const { body } = require("express-validator");
const { registerUser, loginUser } = require("../controllers/authController");
const validate = require("../middleware/validateMiddleware");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*[A-Za-z])(?=.*\d).+$/)
      .withMessage("Password must contain at least one letter and one number"),
    validate,
  ],
  registerUser
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
    validate,
  ],
  loginUser
);

module.exports = router;
