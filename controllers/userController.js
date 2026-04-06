const User = require("../models/user");
const Blog = require("../models/blog");
const asyncHandler = require("../utils/asyncHandler");

const profileSelect = "-password";

exports.getProfile = asyncHandler(async (req, res) => {
  const userId = req.params.id || req.user.userId;

  const user = await User.findById(userId)
    .select(profileSelect)
    .populate("followers", "name avatar")
    .populate("following", "name avatar")
    .populate({
      path: "bookmarks",
      select: "title slug excerpt image readingTime createdAt",
      options: { sort: { createdAt: -1 } },
    });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const authoredBlogs = await Blog.countDocuments({ author: user._id });
  const publishedBlogs = await Blog.countDocuments({ author: user._id, published: true });

  return res.json({
    user,
    stats: {
      authoredBlogs,
      publishedBlogs,
      draftBlogs: authoredBlogs - publishedBlogs,
    },
  });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, avatar, website, socialLinks } = req.body;
  const user = await User.findById(req.user.userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (name !== undefined) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (avatar !== undefined) user.avatar = avatar;
  if (website !== undefined) user.website = website;

  if (socialLinks) {
    user.socialLinks = {
      ...user.socialLinks,
      ...socialLinks,
    };
  }

  await user.save();

  return res.json({
    message: "Profile updated successfully",
    user,
  });
});

exports.followUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.userId) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }

  const [userToFollow, currentUser] = await Promise.all([
    User.findById(req.params.id),
    User.findById(req.user.userId),
  ]);

  if (!userToFollow || !currentUser) {
    return res.status(404).json({ message: "User not found" });
  }

  const isFollowing = currentUser.following.some((id) => id.toString() === req.params.id);

  if (isFollowing) {
    currentUser.following.pull(req.params.id);
    userToFollow.followers.pull(req.user.userId);
  } else {
    currentUser.following.push(req.params.id);
    userToFollow.followers.push(req.user.userId);
  }

  await Promise.all([currentUser.save(), userToFollow.save()]);

  return res.json({
    following: !isFollowing,
    followerCount: userToFollow.followers.length,
  });
});

exports.getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
  const search = req.query.search?.trim();
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select(profileSelect)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit),
    User.countDocuments(query),
  ]);

  return res.json({
    users,
    pagination: {
      currentPage: page,
      perPage: limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

exports.getBookmarkedBlogs = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).populate({
    path: "bookmarks",
    populate: { path: "author", select: "name avatar" },
    options: { sort: { createdAt: -1 } },
  });

  return res.json({
    blogs: user?.bookmarks || [],
  });
});
