# Blog Platform

A full-stack blog platform built with Node.js, Express, MongoDB, and JWT authentication.

## Features

- **User Authentication**: Register and login with JWT tokens
- **Blog Management**: Create, read, and delete blog posts
- **Comments**: Add and manage comments on blog posts
- **Role-Based Access Control**: Admin and user roles with different permissions
- **Secure Password Hashing**: Passwords encrypted with bcryptjs

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: bcryptjs for password hashing

## Project Structure

```
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── blogController.js     # Blog CRUD operations
│   └── commentController.js  # Comment management
├── models/
│   ├── user.js              # User schema
│   ├── blog.js              # Blog schema
│   └── comment.js           # Comment schema
├── routes/
│   ├── authRoutes.js        # Auth endpoints
│   ├── blogRoutes.js        # Blog endpoints
│   └── commentRoutes.js     # Comment endpoints
├── middleware/
│   └── authMiddleware.js    # JWT verification & role check
├── app.js                    # Express app setup
└── .env                      # Environment variables
```

## Installation

1. Clone the repository

```bash
git clone <repository-url>
cd blog-platform
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file with the following variables:

```
MONGO_URI=mongodb://localhost:27017/blog_platform
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
```

4. Start the server

```bash
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT token

### Blogs

- `POST /api/blogs` - Create a blog (requires authentication)
- `GET /api/blogs` - Get all blogs
- `DELETE /api/blogs/:id` - Delete a blog (requires admin role)

### Comments

- `POST /api/comments/:blogId` - Add comment (requires authentication)
- `GET /api/comments/:blogId` - Get all comments for a blog
- `DELETE /api/comments/:commentId` - Delete comment (requires authentication)

## Authentication

Include the JWT token in request headers:

```
Authorization: Bearer <your_jwt_token>
```

## License

MIT License - See LICENSE.txt for details
