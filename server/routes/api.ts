import { Router } from 'express';
import { 
  register, 
  login, 
  logout, 
  forgotPassword, 
  getProfile, 
  updateProfile, 
  updatePassword,
  getAuthorProfile,
  followAuthor,
  getAllUsersAdmin,
  updateUserRoleAdmin,
  deleteUserAdmin 
} from '../controllers/authController';
import { 
  getBlogs, 
  getBlogByIdOrSlug, 
  createBlog, 
  updateBlog, 
  deleteBlog, 
  toggleLikeBlog, 
  toggleBookmarkBlog,
  getDashboardStats 
} from '../controllers/blogController';
import { 
  getCommentsForBlog, 
  addComment, 
  editComment, 
  deleteComment, 
  toggleLikeComment,
  getAllCommentsAdmin 
} from '../controllers/commentController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// ==================================================
// AUTH ENDPOINTS
// ==================================================
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/logout', logout);
router.post('/auth/forgot-password', forgotPassword);

// ==================================================
// USERS / PROFILE ENDPOINTS
// ==================================================
router.get('/users/profile', authenticateToken, getProfile);
router.put('/users/profile', authenticateToken, updateProfile);
router.put('/users/profile/password', authenticateToken, updatePassword);
router.get('/authors/:id', getAuthorProfile);
router.post('/authors/:id/follow', authenticateToken, followAuthor);

// ==================================================
// BLOGS ENDPOINTS
// ==================================================
router.get('/blogs', getBlogs);
router.get('/blogs/:idOrSlug', getBlogByIdOrSlug);
router.post('/blogs', authenticateToken, createBlog);
router.put('/blogs/:id', authenticateToken, updateBlog);
router.delete('/blogs/:id', authenticateToken, deleteBlog);
router.post('/blogs/:id/like', authenticateToken, toggleLikeBlog);
router.post('/blogs/:id/bookmark', authenticateToken, toggleBookmarkBlog);

// ==================================================
// COMMENTS ENDPOINTS
// ==================================================
router.get('/comments/:blogId', getCommentsForBlog);
router.post('/comments', authenticateToken, addComment);
router.put('/comments/:id', authenticateToken, editComment);
router.delete('/comments/:id', authenticateToken, deleteComment);
router.post('/comments/:id/like', authenticateToken, toggleLikeComment);

// ==================================================
// ADMIN / ANALYTICS DASHBOARD
// ==================================================
// Require admin privilege
router.get('/admin/stats', authenticateToken, authorizeRoles('Admin'), getDashboardStats);
router.get('/admin/users', authenticateToken, authorizeRoles('Admin'), getAllUsersAdmin);
router.put('/admin/users/:id/role', authenticateToken, authorizeRoles('Admin'), updateUserRoleAdmin);
router.delete('/admin/users/:id', authenticateToken, authorizeRoles('Admin'), deleteUserAdmin);
router.get('/admin/comments', authenticateToken, authorizeRoles('Admin'), getAllCommentsAdmin);

export default router;
