const Blog = require("../models/blog");
const Comment = require("../models/comment");
const User = require("../models/user");
const asyncHandler = require("../utils/asyncHandler");
const normalizeList = require("../utils/normalizeList");

const buildPublicBlogQuery = (req) => {
  const {
    search,
    category,
    tag,
    author,
    featured,
    published = "true",
    minReadingTime,
    maxReadingTime,
  } = req.query;

  const query = {};

  if (published !== "all") {
    query.published = published === "true";
  }

  if (search) {
    query.$text = { $search: search };
  }

  if (category) {
    query.categories = category;
  }

  if (tag) {
    query.tags = tag;
  }

  if (author) {
    query.author = author;
  }

  if (featured !== undefined) {
    query.featured = featured === "true";
  }

  if (minReadingTime || maxReadingTime) {
    query.readingTime = {};
    if (minReadingTime) query.readingTime.$gte = Number(minReadingTime);
    if (maxReadingTime) query.readingTime.$lte = Number(maxReadingTime);
  }

  return query;
};

const resolveSort = (sort) => {
  switch (sort) {
    case "popular":
      return { views: -1, createdAt: -1 };
    case "oldest":
      return { createdAt: 1 };
    case "updated":
      return { updatedAt: -1 };
    default:
      return { featured: -1, createdAt: -1 };
  }
};

const formatBlogPayload = (body, currentBlog = {}) => {
  return {
    title: body.title ?? currentBlog.title,
    content: body.content ?? currentBlog.content,
    excerpt: body.excerpt ?? currentBlog.excerpt,
    categories: body.categories ? normalizeList(body.categories) : currentBlog.categories,
    tags: body.tags ? normalizeList(body.tags) : currentBlog.tags,
    image: body.image ?? currentBlog.image,
    published:
      body.published !== undefined ? body.published === true || body.published === "true" : currentBlog.published,
    featured:
      body.featured !== undefined ? body.featured === true || body.featured === "true" : currentBlog.featured,
    metaTitle: body.metaTitle ?? currentBlog.metaTitle,
    metaDescription: body.metaDescription ?? currentBlog.metaDescription,
  };
};

exports.createBlog = asyncHandler(async (req, res) => {
  const payload = formatBlogPayload(req.body, { published: true, featured: false });

  if (payload.featured && req.user.role !== "admin") {
    payload.featured = false;
  }

  const blog = await Blog.create({
    ...payload,
    author: req.user.userId,
  });

  return res.status(201).json({
    message: "Blog created successfully",
    blog,
  });
});

exports.getBlogs = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const sort = resolveSort(req.query.sort);
  const query = buildPublicBlogQuery(req);
  const isMostLikedSort = req.query.sort === "most-liked";

  const blogQueryPromise = isMostLikedSort
    ? Blog.aggregate([
        { $match: query },
        { $addFields: { likeCount: { $size: "$likes" } } },
        { $sort: { likeCount: -1, createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ])
    : Blog.find(query)
        .populate("author", "name avatar bio profileCompleted")
        .sort(sort)
        .limit(limit)
        .skip((page - 1) * limit);

  let [blogs, total, topCategories, topTags] = await Promise.all([
    blogQueryPromise,
    Blog.countDocuments(query),
    Blog.aggregate([
      { $match: { published: true } },
      { $unwind: "$categories" },
      { $group: { _id: "$categories", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    Blog.aggregate([
      { $match: { published: true } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
  ]);

  if (isMostLikedSort) {
    blogs = await Blog.populate(blogs, {
      path: "author",
      select: "name avatar bio profileCompleted",
    });
  }

  return res.json({
    blogs,
    pagination: {
      currentPage: page,
      perPage: limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit) || 1,
      hasNextPage: page * limit < total,
    },
    insights: {
      topCategories: topCategories.map((item) => ({ name: item._id, count: item.count })),
      topTags: topTags.map((item) => ({ name: item._id, count: item.count })),
    },
  });
});

exports.getFeaturedBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find({ published: true, featured: true })
    .populate("author", "name avatar")
    .sort({ publishedAt: -1 })
    .limit(6);

  return res.json({ blogs });
});

exports.getBlogById = asyncHandler(async (req, res) => {
  const identifier = req.params.idOrSlug;
  const searchConditions = [{ slug: identifier }];

  if (/^[0-9a-fA-F]{24}$/.test(identifier)) {
    searchConditions.unshift({ _id: identifier });
  }

  const blog = await Blog.findOne({
    $or: searchConditions,
  })
    .populate("author", "name avatar bio website socialLinks profileCompleted")
    .populate("likes", "name avatar")
    .populate("bookmarks", "name");

  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  await Blog.updateOne({ _id: blog._id }, { $inc: { views: 1 } });
  blog.views += 1;

  const [commentCount, relatedPosts] = await Promise.all([
    Comment.countDocuments({ blog: blog._id }),
    Blog.find({
      _id: { $ne: blog._id },
      published: true,
      $or: [{ categories: { $in: blog.categories } }, { tags: { $in: blog.tags } }],
    })
      .select("title slug excerpt image readingTime createdAt")
      .limit(4)
      .sort({ createdAt: -1 }),
  ]);

  return res.json({
    blog,
    relatedPosts,
    metrics: {
      commentCount,
      likeCount: blog.likes.length,
      bookmarkCount: blog.bookmarks.length,
      engagementScore: blog.engagementScore,
    },
  });
});

exports.updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  if (blog.author.toString() !== req.user.userId && req.user.role !== "admin") {
    return res.status(403).json({ message: "You are not allowed to update this blog" });
  }

  const payload = formatBlogPayload(req.body, blog);
  if (payload.featured && req.user.role !== "admin") {
    payload.featured = blog.featured;
  }

  Object.assign(blog, payload);
  await blog.save();

  return res.json({
    message: "Blog updated successfully",
    blog,
  });
});

exports.deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  if (blog.author.toString() !== req.user.userId && req.user.role !== "admin") {
    return res.status(403).json({ message: "You are not allowed to delete this blog" });
  }

  await Promise.all([
    blog.deleteOne(),
    Comment.deleteMany({ blog: blog._id }),
    User.updateMany({ bookmarks: blog._id }, { $pull: { bookmarks: blog._id } }),
  ]);

  return res.json({ message: "Blog deleted successfully" });
});

exports.likeBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  const userId = req.user.userId;
  const isLiked = blog.likes.some((id) => id.toString() === userId);

  if (isLiked) {
    blog.likes.pull(userId);
  } else {
    blog.likes.push(userId);
  }

  await blog.save();

  const io = req.app.get("io");
  io.to(blog._id.toString()).emit("blog-liked", {
    blogId: blog._id,
    likes: blog.likes.length,
    liked: !isLiked,
    userId,
  });

  return res.json({
    liked: !isLiked,
    likes: blog.likes.length,
  });
});

exports.toggleBookmark = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  const user = await User.findById(req.user.userId);

  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const alreadyBookmarked = user.bookmarks.some((bookmarkId) => bookmarkId.toString() === req.params.id);

  if (alreadyBookmarked) {
    user.bookmarks.pull(req.params.id);
    blog.bookmarks.pull(req.user.userId);
  } else {
    user.bookmarks.push(req.params.id);
    blog.bookmarks.push(req.user.userId);
  }

  await Promise.all([user.save(), blog.save()]);

  return res.json({
    bookmarked: !alreadyBookmarked,
    totalBookmarks: blog.bookmarks.length,
  });
});

exports.getDrafts = asyncHandler(async (req, res) => {
  const blogs = await Blog.find({ author: req.user.userId, published: false })
    .sort({ updatedAt: -1 })
    .select("title slug excerpt updatedAt readingTime featured");

  return res.json({ blogs });
});

exports.getMyDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const [blogs, totalComments, recentBlogs] = await Promise.all([
    Blog.find({ author: userId }).sort({ createdAt: -1 }),
    Comment.countDocuments({ user: userId }),
    Blog.find({ author: userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("title slug published views createdAt updatedAt"),
  ]);

  const stats = blogs.reduce(
    (acc, blog) => {
      acc.totalBlogs += 1;
      acc.totalViews += blog.views;
      acc.totalLikes += blog.likes.length;
      acc.totalBookmarks += blog.bookmarks.length;
      if (blog.published) acc.publishedBlogs += 1;
      else acc.draftBlogs += 1;
      return acc;
    },
    {
      totalBlogs: 0,
      publishedBlogs: 0,
      draftBlogs: 0,
      totalViews: 0,
      totalLikes: 0,
      totalBookmarks: 0,
    }
  );

  return res.json({
    stats: {
      ...stats,
      totalComments,
    },
    recentBlogs,
  });
});
