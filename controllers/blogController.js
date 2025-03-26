const Blog = require("../models/blog");

exports.createBlog = async (req, res) => {
  try {
    const blog = new Blog({
      title: req.body.title,
      content: req.body.content,
      author: req.user.userId,
    });

    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: `Error: ${error.message}` });
  }
};

exports.getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().populate("author", "name");
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: `Error: ${error.message}` });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    await blog.deleteOne();
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: `Error: ${error.message}` });
  }
};
