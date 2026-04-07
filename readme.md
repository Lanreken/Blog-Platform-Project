# Blog Platform API

A production-oriented blog platform backend built with Node.js, Express, MongoDB, JWT authentication, file uploads, and Socket.IO. The codebase has been upgraded with stronger validation, creator analytics, bookmarks, featured content, slugs, reading-time metadata, profile completion scoring, and cleaner API ergonomics.

## Highlights

- JWT-based authentication with stronger password policy
- Author dashboards with views, likes, bookmarks, drafts, and recent post insights
- Blog slugs for human-friendly URLs and SEO-ready metadata fields
- Advanced blog discovery with pagination, sorting, search, tags, categories, featured posts, and related posts
- Bookmarking system synced between users and blog posts
- Real-time engagement events for likes and comments with Socket.IO
- Comment editing, likes, pagination, and audit timestamp support
- Profile completion scoring, social links, and bookmark retrieval
- Upload endpoint for images with file metadata responses
- Health check endpoint, centralized error handling, basic rate limiting, and security headers

## Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT
- Socket.IO
- Multer
- express-validator

## API Documentation

The API is fully documented using Swagger/OpenAPI 3.0 specification. You can access the interactive API documentation at:

**Swagger UI**: `http://localhost:1010/api-docs`

The documentation includes:
- Complete endpoint specifications
- Request/response schemas
- Authentication requirements
- Interactive API testing
- Schema definitions for all models

## Project Structure

```text
.
|-- app.js
|-- config/
|   `-- db.js
|-- controllers/
|   |-- authController.js
|   |-- blogController.js
|   |-- commentController.js
|   |-- uploadController.js
|   `-- userController.js
|-- middleware/
|   |-- authMiddleware.js
|   |-- errorMiddleware.js
|   |-- rateLimiter.js
|   |-- securityMiddleware.js
|   |-- uploadMiddleware.js
|   `-- validateMiddleware.js
|-- models/
|   |-- blog.js
|   |-- comment.js
|   `-- user.js
|-- routes/
|   |-- authRoutes.js
|   |-- blogRoutes.js
|   |-- commentRoutes.js
|   |-- uploadRoutes.js
|   `-- userRoutes.js
`-- utils/
    |-- asyncHandler.js
    |-- calculateReadingTime.js
    |-- normalizeList.js
    `-- slugify.js
```

## Environment Variables

Create a `.env` file in the project root:

```env
MONGO_URI=mongodb://127.0.0.1:27017/blog_platform
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
PORT=1010
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

`CLIENT_URL` can be a comma-separated list if you need multiple frontend origins.

## Installation

```bash
npm install
npm run dev
```

For production:

```bash
npm start
```

## API Overview

### Health

- `GET /api/health` - API uptime and environment metadata

### Auth

- `POST /api/auth/register` - Register a user and receive a token
- `POST /api/auth/login` - Login and receive a token

### Blogs

- `GET /api/blogs` - List blogs with filters:
  - `page`
  - `limit`
  - `search`
  - `category`
  - `tag`
  - `author`
  - `featured`
  - `published`
  - `minReadingTime`
  - `maxReadingTime`
  - `sort=newest|popular|most-liked|oldest|updated`
- `GET /api/blogs/featured` - Featured published posts
- `GET /api/blogs/drafts` - Authenticated user's drafts
- `GET /api/blogs/dashboard` - Authenticated creator dashboard
- `GET /api/blogs/:idOrSlug` - Single blog by MongoDB id or slug, with related posts and metrics
- `POST /api/blogs` - Create blog
- `PUT /api/blogs/:id` - Update blog
- `DELETE /api/blogs/:id` - Delete blog
- `POST /api/blogs/:id/like` - Like or unlike a blog
- `POST /api/blogs/:id/bookmark` - Bookmark or unbookmark a blog

### Comments

- `POST /api/comments/:blogId` - Add comment
- `GET /api/comments/:blogId?page=1&limit=10` - Paginated comments for a blog
- `PUT /api/comments/:commentId` - Edit own comment or admin edit
- `DELETE /api/comments/:commentId` - Delete own comment or admin delete
- `POST /api/comments/:commentId/like` - Like or unlike a comment

### Users

- `GET /api/users` - Paginated user directory
- `GET /api/users/profile/:id?` - Authenticated request for your profile or another user by id
- `PUT /api/users/profile` - Update profile
- `GET /api/users/bookmarks` - Current user's bookmarked posts
- `POST /api/users/:id/follow` - Follow or unfollow a user

### Uploads

- `POST /api/upload/image` - Upload an image file using multipart form data

## Socket Events

Client can subscribe to blog rooms and receive live engagement updates:

- `join-blog` with `blogId`
- `leave-blog` with `blogId`
- `blog-liked`
- `new-comment`

## Sample Create Blog Payload

```json
{
  "title": "Building a resilient Node.js content platform",
  "content": "Long-form article body with at least fifty characters...",
  "excerpt": "Short summary for cards and previews.",
  "categories": ["Engineering", "Backend"],
  "tags": ["nodejs", "mongodb", "architecture"],
  "image": "https://example.com/cover.jpg",
  "published": true,
  "featured": false,
  "metaTitle": "Resilient Node.js content platform",
  "metaDescription": "Patterns for building a scalable modern publishing API."
}
```

## Notable Upgrades Applied

- Reworked models with indexes, virtuals, and richer metadata
- Added slug generation and reading-time calculation
- Added bookmark synchronization between user and blog documents
- Added author dashboard endpoint
- Added featured posts endpoint
- Added centralized request validation middleware
- Added centralized error middleware
- Added rate limiting and security headers
- Added health endpoint and production start script
- Updated README to reflect the current API and deployment setup

## Recommended Next Steps

1. Add automated tests with Jest or Vitest plus Supertest
2. Introduce refresh tokens and email verification
3. Move image storage to Cloudinary, S3, or Supabase Storage
4. Add structured logging and request tracing
5. Add API versioning and OpenAPI documentation
