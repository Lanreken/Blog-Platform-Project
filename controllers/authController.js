const crypto = require("crypto");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const sendMail = require("../utils/mailer");

const generateToken = (user) =>
  jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });

const generateRefreshToken = () => crypto.randomBytes(40).toString("hex");

const buildVerificationUrl = (token) => {
  const baseUrl = process.env.CLIENT_URL || `http://localhost:${process.env.PORT || 1010}`;
  return `${baseUrl}/api/v1/auth/verify-email/${token}`;
};

exports.registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ message: "An account with that email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const emailVerificationToken = crypto.randomBytes(20).toString("hex");
  const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    isEmailVerified: false,
    emailVerificationToken,
    emailVerificationExpires,
  });

  const verificationUrl = buildVerificationUrl(emailVerificationToken);
  await sendMail({
    to: user.email,
    subject: "Verify your email address",
    text: `Welcome to the platform! Verify your email with this link: ${verificationUrl}`,
    html: `<p>Welcome to the platform!</p><p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`,
  });

  return res.status(201).json({
    message: "User registered successfully. Check your email to verify your account.",
    user,
  });
});

exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password +refreshToken +refreshTokenExpires +isEmailVerified");

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  if (!user.isEmailVerified) {
    return res.status(403).json({ message: "Email must be verified before logging in." });
  }

  const refreshToken = generateRefreshToken();
  user.refreshToken = refreshToken;
  user.refreshTokenExpires = Date.now() + 30 * 24 * 60 * 60 * 1000;
  user.lastLoginAt = new Date();
  await user.save();

  return res.json({
    message: "Login successful",
    token: generateToken(user),
    refreshToken,
    user,
  });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  const user = await User.findOne({
    refreshToken,
    refreshTokenExpires: { $gt: Date.now() },
  }).select("+refreshToken +refreshTokenExpires");

  if (!user) {
    return res.status(401).json({ message: "Refresh token is invalid or expired" });
  }

  const newRefreshToken = generateRefreshToken();
  user.refreshToken = newRefreshToken;
  user.refreshTokenExpires = Date.now() + 30 * 24 * 60 * 60 * 1000;
  await user.save();

  return res.json({
    token: generateToken(user),
    refreshToken: newRefreshToken,
  });
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Email verification token is invalid or has expired." });
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  return res.json({ message: "Email verified successfully" });
});

exports.resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({ message: "Email is already verified." });
  }

  const emailVerificationToken = crypto.randomBytes(20).toString("hex");
  user.emailVerificationToken = emailVerificationToken;
  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  await user.save();

  const verificationUrl = buildVerificationUrl(emailVerificationToken);
  await sendMail({
    to: user.email,
    subject: "Verify your email address",
    text: `Verify your email with this link: ${verificationUrl}`,
    html: `<p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`,
  });

  return res.json({ message: "Verification email resent successfully" });
});
