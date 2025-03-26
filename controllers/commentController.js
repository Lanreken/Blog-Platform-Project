const Comment = require("../models/comment");
const Blog = require("../models/blog");

exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const { blogId } = req.params;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    const comment = new Comment({
      content,
      user: req.user.userId,
      blog: blogId,
    });

    await comment.save();
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: `Error: ${error.message}` });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { blogId } = req.params;

    const comments = await Comment.find({ blog: blogId }).populate(
      "user",
      "name"
    );
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: `Error: ${error.message}` });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (
      comment.user.toString() !== req.user.userId &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
    }

    await comment.deleteOne();
    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: `Error: ${error.message}` });
  }
};
