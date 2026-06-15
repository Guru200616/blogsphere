export type UserRole = 'Admin' | 'Author' | 'Reader';

export interface SocialLinks {
  twitter?: string;
  github?: string;
  website?: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  role: UserRole;
  followers: string[]; // User IDs
  following: string[]; // User IDs
  socialLinks?: SocialLinks;
  createdAt: string;
  updatedAt: string;
}

export type BlogStatus = 'Draft' | 'Published' | 'Archived';

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string[];
  category: string;
  author: User;
  status: BlogStatus;
  views: number;
  likes: string[]; // User IDs
  bookmarks?: string[]; // User IDs
  readingTime?: number; // In minutes
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  blogId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    role: UserRole;
  };
  comment: string;
  parentCommentId: string | null;
  likes: string[]; // User IDs
  createdAt: string;
  updatedAt: string;
  replies?: Comment[]; // For nested UI
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DashboardStats {
  totalUsers: number;
  totalBlogs: number;
  totalComments: number;
  totalViews: number;
  blogViews: { date: string; views: number }[];
  monthlyPosts: { month: string; posts: number }[];
  popularCategories: { name: string; count: number }[];
  userGrowth: { date: string; users: number }[];
}
