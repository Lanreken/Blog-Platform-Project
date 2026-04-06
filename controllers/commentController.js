const Comment = require("../models/comment");
const Blog = require("../models/blog");
const asyncHandler = require("../utils/asyncHandler");

exports.addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { blogId } = req.params;

  const blog = await Blog.findById(blogId);
  if (!blog || !blog.published) {
    return res.status(404).json({ message: "Published blog post not found" });
  }

  const comment = await Comment.create({
    content,
    user: req.user.userId,
    blog: blogId,
  });

  await comment.populate("user", "name avatar");

  const io = req.app.get("io");
  io.to(blogId).emit("new-comment", comment);

  return res.status(201).json({
    message: "Comment added successfully",
    comment,
  });
});

exports.getComments = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const { blogId } = req.params;

  const [comments, total] = await Promise.all([
    Comment.find({ blog: blogId })
      .populate("user", "name avatar")
      .populate("likes", "name avatar")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit),
    Comment.countDocuments({ blog: blogId }),
  ]);

  return res.json({
    comments,
    pagination: {
      currentPage: page,
      perPage: limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

exports.updateComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  if (comment.user.toString() !== req.user.userId && req.user.role !== "admin") {
    return res.status(403).json({ message: "You are not allowed to edit this comment" });
  }

  comment.content = req.body.content;
  comment.editedAt = new Date();
  await comment.save();
  await comment.populate("user", "name avatar");

  return res.json({
    message: "Comment updated successfully",
    comment,
  });
});

exports.deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  if (comment.user.toString() !== req.user.userId && req.user.role !== "admin") {
    return res.status(403).json({ message: "You are not allowed to delete this comment" });
  }

  await comment.deleteOne();

  return res.json({ message: "Comment deleted successfully" });
});

exports.likeComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  const userId = req.user.userId;
  const isLiked = comment.likes.some((id) => id.toString() === userId);

  if (isLiked) {
    comment.likes.pull(userId);
  } else {
    comment.likes.push(userId);
  }

  await comment.save();

  return res.json({
    liked: !isLiked,
    likes: comment.likes.length,
  });
});
