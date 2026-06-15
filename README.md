# BlogSphere 🚀

A modern full-stack blogging platform built with React, TypeScript, Node.js, Express, and MongoDB. BlogSphere enables users to create, publish, discover, and engage with high-quality content through a clean and responsive user experience.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)

---

## ✨ Features

### 🔐 Authentication & Authorization

- User Registration
- User Login & Logout
- JWT Authentication
- Protected Routes
- Role-Based Access Control
- Author & Admin Permissions
- Password Recovery

### ✍️ Blog Management

- Create Blog Posts
- Edit Existing Posts
- Delete Posts
- Publish Articles
- Save Drafts
- Rich Text Editor
- Cover Images
- Categories & Tags

### 💬 Community Interaction

- Comment on Articles
- Edit/Delete Comments
- Like Comments
- Like Blog Posts
- Bookmark Articles
- Follow Authors

### 📚 Content Discovery

- Search Blogs
- Category Filtering
- Tag Filtering
- Trending Content
- Latest Articles
- Popular Posts

### 👤 User Profiles

- Profile Management
- Author Profiles
- Biography Section
- Followers & Following
- Published Articles

### 📊 Dashboard & Analytics

- Total Blogs
- Total Users
- Total Comments
- Views Analytics
- Content Statistics
- Admin Dashboard

---

## 🛠️ Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- Motion
- Lucide React

### Backend

- Node.js
- Express.js
- TypeScript

### Database

- MongoDB Atlas
- Mongoose

### Authentication

- JWT
- bcryptjs

---

## 📂 Project Structure

```bash
blogsphere/

├── src/
│   ├── components/
│   │   └── RichTextEditor.tsx
│   │
│   ├── context/
│   │   └── AuthContext.tsx
│   │
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── BlogDetail.tsx
│   │   ├── WriteBlog.tsx
│   │   ├── Profile.tsx
│   │   ├── Auth.tsx
│   │   └── AdminDashboard.tsx
│   │
│   ├── services/
│   │   └── api.ts
│   │
│   ├── types.ts
│   ├── App.tsx
│   └── main.tsx
│
├── server/
│   ├── config/
│   │   └── db.ts
│   │
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── blogController.ts
│   │   └── commentController.ts
│   │
│   ├── middleware/
│   │   └── auth.ts
│   │
│   └── routes/
│       └── api.ts
│
├── server.ts
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Clone Repository

```bash
git clone https://github.com/Guru200616/blogsphere.git

cd blogsphere
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret_key

CLIENT_URL=http://localhost:5173
```

---

## ▶️ Run Development Server

Start frontend and backend:

```bash
npm run dev
```

Application URLs:

```text
Frontend: http://localhost:5173
Backend : http://localhost:5000
```

---

## 📡 API Endpoints

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/forgot-password
```

### Users

```http
GET  /api/users/profile
PUT  /api/users/profile
PUT  /api/users/profile/password
```

### Blogs

```http
GET    /api/blogs
GET    /api/blogs/:idOrSlug
POST   /api/blogs
PUT    /api/blogs/:id
DELETE /api/blogs/:id

POST   /api/blogs/:id/like
POST   /api/blogs/:id/bookmark
```

### Comments

```http
GET    /api/comments/:blogId
POST   /api/comments
PUT    /api/comments/:id
DELETE /api/comments/:id
```

---

## 🗄️ Database Models

### User

```js
{
  name,
  username,
  email,
  password,
  avatar,
  bio,
  role,
  followers,
  following
}
```

### Blog

```js
{
  title,
  slug,
  excerpt,
  content,
  coverImage,
  category,
  tags,
  author,
  status,
  views,
  likes,
  bookmarks,
  createdAt
}
```

### Comment

```js
{
  blogId,
  userId,
  comment,
  likes,
  parentComment,
  createdAt
}
```

---

## 🔒 Security Features

- JWT Authentication
- Password Hashing (bcryptjs)
- Route Protection
- Role-Based Authorization
- Input Validation
- Secure Environment Variables
- MongoDB Data Protection
- Error Handling

---

## 📱 Responsive Design

Optimized for:

- Mobile Devices
- Tablets
- Laptops
- Desktop Screens

---

## 🎯 Key Learning Outcomes

This project demonstrates:

- Full Stack Development
- REST API Design
- Authentication & Authorization
- MongoDB Integration
- Content Management Systems
- Rich Text Editing
- React Context API
- TypeScript Best Practices
- Modern UI/UX Development

---

## 🌟 Future Improvements

- Email Verification
- AI Content Suggestions
- Newsletter System
- Real-Time Notifications
- Social Sharing
- Reading History
- Markdown Support
- Progressive Web App (PWA)
- Multi-Language Support

---

## 🚀 Deployment

### Frontend

- Vercel
- Netlify

### Backend

- Render
- Railway

### Database

- MongoDB Atlas

---

## 👨‍💻 Author

**Guru Rengarajan**

GitHub: https://github.com/Guru200616

Project: **BlogSphere – Full Stack Blogging & Content Management Platform**

---

## 📄 License

This project is licensed under the MIT License.

Feel free to use, modify, and extend this project for learning, portfolio building, internships, and professional development.

---

⭐ If you found this project useful, consider giving it a star on GitHub.
