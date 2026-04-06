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
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password;
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
