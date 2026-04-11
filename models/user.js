/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: User ID
 *         name:
 *           type: string
 *           description: User's full name
 *           minLength: 2
 *           maxLength: 80
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           default: user
 *         bio:
 *           type: string
 *           maxLength: 500
 *           description: User's biography
 *         avatar:
 *           type: string
 *           format: uri
 *           description: User's avatar image URL
 *         followers:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who follow this user
 *         following:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs this user follows
 *         bookmarks:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of blog IDs bookmarked by this user
 *         website:
 *           type: string
 *           format: uri
 *           description: User's website URL
 *         socialLinks:
 *           type: object
 *           properties:
 *             twitter:
 *               type: string
 *               format: uri
 *             linkedin:
 *               type: string
 *               format: uri
 *             github:
 *               type: string
 *               format: uri
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    bio: { type: String, maxlength: 500, default: "" },
    avatar: { type: String, default: "" },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blog" }],
    website: { type: String, default: "" },
    socialLinks: {
      twitter: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      github: { type: String, default: "" },
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    refreshToken: { type: String, select: false },
    refreshTokenExpires: { type: Date, select: false },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.refreshTokenExpires;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpires;
        delete ret.__v;
        ret.followerCount = ret.followers?.length || 0;
        ret.followingCount = ret.following?.length || 0;
        ret.bookmarkCount = ret.bookmarks?.length || 0;
        return ret;
      },
    },
  }
);

userSchema.virtual("profileCompleted").get(function profileCompleted() {
  const checks = [
    Boolean(this.name),
    Boolean(this.bio),
    Boolean(this.avatar),
    Boolean(this.website),
    Boolean(this.socialLinks?.github || this.socialLinks?.linkedin || this.socialLinks?.twitter),
  ];

  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return score;
});

const User = mongoose.model("User", userSchema);
module.exports = User;
