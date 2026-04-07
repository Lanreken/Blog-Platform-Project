/**
 * @swagger
 * components:
 *   schemas:
 *     Blog:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Blog ID
 *         title:
 *           type: string
 *           description: Blog title
 *           minLength: 6
 *           maxLength: 180
 *         slug:
 *           type: string
 *           description: URL-friendly slug
 *         content:
 *           type: string
 *           description: Blog content (HTML or Markdown)
 *           minLength: 50
 *         excerpt:
 *           type: string
 *           description: Short summary of the blog
 *           maxLength: 320
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of category names
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of tag names
 *         image:
 *           type: string
 *           format: uri
 *           description: Blog cover image URL
 *         published:
 *           type: boolean
 *           default: true
 *           description: Whether the blog is published
 *         likes:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who liked this blog
 *         views:
 *           type: integer
 *           default: 0
 *           description: Number of views
 *         readingTime:
 *           type: integer
 *           description: Estimated reading time in minutes
 *         metaTitle:
 *           type: string
 *           maxLength: 70
 *           description: SEO meta title
 *         metaDescription:
 *           type: string
 *           maxLength: 160
 *           description: SEO meta description
 *         author:
 *           $ref: '#/components/schemas/User'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const mongoose = require("mongoose");
const slugify = require("../utils/slugify");
const calculateReadingTime = require("../utils/calculateReadingTime");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 6,
      maxlength: 180,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      minlength: 50,
    },
    excerpt: {
      type: String,
      maxlength: 320,
      default: "",
    },
    categories: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true }],
    image: { type: String, default: "" },
    published: { type: Boolean, default: true },
    publishedAt: { type: Date },
    featured: { type: Boolean, default: false },
    readingTime: { type: Number, default: 1 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    views: { type: Number, default: 0, min: 0 },
    metaTitle: { type: String, maxlength: 70, default: "" },
    metaDescription: { type: String, maxlength: 160, default: "" },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.likeCount = ret.likes?.length || 0;
        ret.bookmarkCount = ret.bookmarks?.length || 0;
        delete ret.__v;
        return ret;
      },
    },
  }
);

blogSchema.index({ title: "text", content: "text", tags: "text", excerpt: "text" });
blogSchema.index({ published: 1, featured: 1, createdAt: -1 });
blogSchema.index({ categories: 1, tags: 1 });

blogSchema.pre("validate", async function ensureBlogMetadata(next) {
  if (this.isModified("title") || !this.slug) {
    const baseSlug = slugify(this.title) || `blog-${Date.now()}`;
    let slug = baseSlug;
    let suffix = 1;

    while (
      await this.constructor.exists({
        slug,
        _id: { $ne: this._id },
      })
    ) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    this.slug = slug;
  }

  if (this.isModified("content") || !this.readingTime) {
    this.readingTime = calculateReadingTime(this.content);
  }

  if (this.isModified("content") && !this.excerpt) {
    this.excerpt = this.content.replace(/\s+/g, " ").trim().slice(0, 200);
  }

  if (this.published && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  if (!this.published) {
    this.featured = false;
    this.publishedAt = undefined;
  }

  next();
});

blogSchema.virtual("engagementScore").get(function engagementScore() {
  return this.views + this.likes.length * 3 + this.bookmarks.length * 2;
});

const Blog = mongoose.model("Blog", blogSchema);
module.exports = Blog;
