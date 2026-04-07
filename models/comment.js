/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Comment ID
 *         content:
 *           type: string
 *           description: Comment content
 *           minLength: 2
 *           maxLength: 1000
 *         user:
 *           $ref: '#/components/schemas/User'
 *         blog:
 *           type: string
 *           description: Blog ID this comment belongs to
 *         likes:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who liked this comment
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 1000,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    blog: { type: mongoose.Schema.Types.ObjectId, ref: "Blog", required: true, index: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    editedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.likeCount = ret.likes?.length || 0;
        delete ret.__v;
        return ret;
      },
    },
  }
);

commentSchema.index({ blog: 1, createdAt: -1 });

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;
