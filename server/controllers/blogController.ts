import { Response } from 'express';
import { DB } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { Blog, BlogStatus, DashboardStats, User } from '../../src/types';

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  const uid = Math.random().toString(36).substring(2, 7);
  return `${base}-${uid}`;
}

function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  // Clean HTML tags first
  const cleanText = text.replace(/<[^>]*>/g, '');
  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return minutes || 1;
}

export async function getBlogs(req: any, res: Response): Promise<void> {
  const { category, tag, search, sort, status } = req.query;

  try {
    // Determine filters
    const filter: any = {};
    if (status) {
      filter.status = status as BlogStatus;
    } else {
      filter.status = 'Published'; // Standard reader views only see published articles
    }

    if (category) filter.category = category as string;
    if (tag) filter.tag = tag as string;
    if (search) filter.search = search as string;

    let blogs = await DB.blogs.find(filter);

    // Apply sorting
    if (sort === 'oldest') {
      blogs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sort === 'views') {
      blogs.sort((a, b) => b.views - a.views);
    } else if (sort === 'likes') {
      blogs.sort((a, b) => b.likes.length - a.likes.length);
    } else {
      // Default: newest
      blogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    res.status(200).json(blogs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching articles.' });
  }
}

export async function getBlogByIdOrSlug(req: any, res: Response): Promise<void> {
  const { idOrSlug } = req.params;

  try {
    let blog = await DB.blogs.findOne({ id: idOrSlug });
    if (!blog) {
      blog = await DB.blogs.findOne({ slug: idOrSlug });
    }

    if (!blog) {
      res.status(404).json({ message: 'Blog article not found.' });
      return;
    }

    // Increment Views count asynchronously
    const updatedViews = (blog.views || 0) + 1;
    const updatedBlog = await DB.blogs.update(blog.id, { views: updatedViews });

    res.status(200).json(updatedBlog);
  } catch (err) {
    res.status(500).json({ message: 'Error reading blog details.' });
  }
}

export async function createBlog(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized. Authentication token is missing.' });
    return;
  }

  // Admin and Authors can create articles
  if (req.user.role !== 'Admin' && req.user.role !== 'Author') {
    res.status(403).json({ message: 'Required roles: [Admin, Author]. Your role: Reader' });
    return;
  }

  const { title, content, excerpt, category, tags, coverImage, status } = req.body;

  if (!title || !content || !category) {
    res.status(400).json({ message: 'Title, content, and category are required parameters.' });
    return;
  }

  try {
    const authorRecord = await DB.users.findOne({ id: req.user.id });
    if (!authorRecord) {
      res.status(404).json({ message: 'Author metadata not found.' });
      return;
    }

    const { password: _, ...cleanAuthor } = authorRecord as any;

    const computedExcerpt = excerpt || (content.replace(/<[^>]*>/g, '').substring(0, 150) + '...');
    const computedSlug = generateSlug(title);
    const readingTime = calculateReadingTime(content);

    const blogData: any = {
      title,
      slug: computedSlug,
      excerpt: computedExcerpt,
      content,
      coverImage: coverImage || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
      category,
      tags: tags && Array.isArray(tags) ? tags : [],
      status: status || 'Draft',
      author: cleanAuthor,
      readingTime
    };

    const newBlog = await DB.blogs.create(blogData);
    res.status(201).json({ message: 'Blog created successfully!', blog: newBlog });
  } catch (err) {
    console.error('Create Blog Error:', err);
    res.status(500).json({ message: 'Internal Server Error saving article.' });
  }
}

export async function updateBlog(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthenticated.' });
    return;
  }

  const { id } = req.params;
  const { title, content, excerpt, category, tags, coverImage, status } = req.body;

  try {
    const blog = await DB.blogs.findOne({ id });
    if (!blog) {
      res.status(404).json({ message: 'Blog not found.' });
      return;
    }

    // Role verification: only Author of the post OR Admin can edit
    if (blog.author.id !== req.user.id && req.user.role !== 'Admin') {
      res.status(403).json({ message: 'Forbidden. You do not own this article and are not an administrator.' });
      return;
    }

    const updates: any = {};
    if (title) {
      updates.title = title;
      // Optionally regenerate clean slug if title changes
      updates.slug = generateSlug(title);
    }
    if (content) {
      updates.content = content;
      updates.readingTime = calculateReadingTime(content);
      if (!excerpt) {
        updates.excerpt = content.replace(/<[^>]*>/g, '').substring(0, 150) + '...';
      }
    }
    if (excerpt !== undefined) updates.excerpt = excerpt;
    if (category) updates.category = category;
    if (tags && Array.isArray(tags)) updates.tags = tags;
    if (coverImage) updates.coverImage = coverImage;
    if (status) updates.status = status;

    const updatedBlog = await DB.blogs.update(id, updates);
    res.status(200).json({ message: 'Blog updated successfully!', blog: updatedBlog });
  } catch (err) {
    res.status(500).json({ message: 'Error updating blog.' });
  }
}

export async function deleteBlog(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthenticated.' });
    return;
  }

  const { id } = req.params;

  try {
    const blog = await DB.blogs.findOne({ id });
    if (!blog) {
      res.status(404).json({ message: 'Blog article not found.' });
      return;
    }

    // Role verification: only Author OR Admin can delete
    if (blog.author.id !== req.user.id && req.user.role !== 'Admin') {
      res.status(403).json({ message: 'Forbidden. You cannot delete an article written by another author.' });
      return;
    }

    await DB.blogs.delete(id);
    res.status(200).json({ message: 'Blog article deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting article.' });
  }
}

export async function toggleLikeBlog(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Login required to like articles.' });
    return;
  }

  const { id } = req.params;

  try {
    const blog = await DB.blogs.findOne({ id });
    if (!blog) {
      res.status(404).json({ message: 'Blog not found.' });
      return;
    }

    const likes = blog.likes || [];
    const hasLiked = likes.includes(req.user.id);

    let updatedLikes;
    if (hasLiked) {
      updatedLikes = likes.filter((uid: string) => uid !== req.user!.id);
    } else {
      updatedLikes = [...likes, req.user.id];
    }

    const updatedBlog = await DB.blogs.update(id, { likes: updatedLikes });
    res.status(200).json({ 
      message: hasLiked ? 'Article un-liked.' : 'Article liked!', 
      likes: updatedBlog.likes,
      hasLiked: !hasLiked
    });
  } catch (err) {
    res.status(500).json({ message: 'Error toggling article like.' });
  }
}

export async function toggleBookmarkBlog(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Login required to bookmark articles.' });
    return;
  }

  const { id } = req.params;

  try {
    const blog = await DB.blogs.findOne({ id });
    if (!blog) {
      res.status(404).json({ message: 'Blog not found.' });
      return;
    }

    const bookmarks = blog.bookmarks || [];
    const hasBookmarked = bookmarks.includes(req.user.id);

    let updatedBookmarks;
    if (hasBookmarked) {
      updatedBookmarks = bookmarks.filter((uid: string) => uid !== req.user!.id);
    } else {
      updatedBookmarks = [...bookmarks, req.user.id];
    }

    const updatedBlog = await DB.blogs.update(id, { bookmarks: updatedBookmarks });
    res.status(200).json({ 
      message: hasBookmarked ? 'Article bookmark removed.' : 'Article bookmarked successfully!', 
      bookmarks: updatedBlog.bookmarks,
      hasBookmarked: !hasBookmarked
    });
  } catch (err) {
    res.status(500).json({ message: 'Error toggling bookmark status.' });
  }
}

// FULL DASHBOARD ANALYTICS
export async function getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const users = await DB.users.find();
    const blogs = await DB.blogs.find();
    const comments = await DB.comments.find();

    const totalUsers = users.length;
    const totalBlogs = blogs.length;
    const totalComments = comments.length;
    let totalViews = 0;
    blogs.forEach((b: Blog) => totalViews += (b.views || 0));

    // Blog Views chart computation (views grouped by blog objects)
    const blogViews = blogs.slice(0, 5).map((b: Blog) => ({
      date: b.title.substring(0, 15) + '...',
      views: b.views || 0
    }));

    // Monthly Posts (categorize counts)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const postCounts: { [key: string]: number } = {};
    months.forEach(m => postCounts[m] = 0);
    
    blogs.forEach((b: Blog) => {
      const date = new Date(b.createdAt);
      if (!isNaN(date.getTime())) {
        const m = months[date.getMonth()];
        postCounts[m] = (postCounts[m] || 0) + 1;
      }
    });

    const monthlyPosts = months.map(m => ({
      month: m,
      posts: postCounts[m]
    }));

    // Popular categories count
    const catCounts: { [key: string]: number } = {};
    blogs.forEach((b: Blog) => {
      const cat = b.category || 'Uncategorized';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });

    const popularCategories = Object.keys(catCounts).map(cat => ({
      name: cat,
      count: catCounts[cat]
    }));

    // User growth projection
    const userGrowth = [
      { date: 'June 1', users: Math.max(1, totalUsers - 5) },
      { date: 'June 5', users: Math.max(2, totalUsers - 3) },
      { date: 'June 10', users: Math.max(2, totalUsers - 1) },
      { date: 'June 15', users: totalUsers }
    ];

    const stats: DashboardStats = {
      totalUsers,
      totalBlogs,
      totalComments,
      totalViews,
      blogViews,
      monthlyPosts,
      popularCategories,
      userGrowth
    };

    res.status(200).json(stats);
  } catch (err) {
    console.error('Analytics Error:', err);
    res.status(500).json({ message: 'Error compiling dashboard statistics.' });
  }
}
