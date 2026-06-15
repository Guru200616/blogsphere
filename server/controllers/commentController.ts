import { Response } from 'express';
import { DB } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { Comment, User } from '../../src/types';

export async function getCommentsForBlog(req: any, res: Response): Promise<void> {
  const { blogId } = req.params;

  try {
    const comments = await DB.comments.findByBlog(blogId);
    
    // Sort chronologically (oldest first so conversations represent reading flowing downwards)
    comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving comments for this article.' });
  }
}

export async function addComment(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required to post comments.' });
    return;
  }

  const { blogId, comment, parentCommentId } = req.body;

  if (!blogId || !comment) {
    res.status(400).json({ message: 'blogId and comment body are required.' });
    return;
  }

  try {
    const blog = await DB.blogs.findOne({ id: blogId });
    if (!blog) {
      res.status(404).json({ message: 'Target blog article not found.' });
      return;
    }

    const userObj = await DB.users.findOne({ id: req.user.id });
    if (!userObj) {
      res.status(404).json({ message: 'User metadata not found.' });
      return;
    }

    const newCommentData = {
      blogId,
      userId: req.user.id,
      parentCommentId: parentCommentId || null,
      comment,
      user: {
        id: userObj.id,
        name: userObj.name,
        username: userObj.username,
        avatar: userObj.avatar,
        role: userObj.role
      }
    };

    const newComment = await DB.comments.create(newCommentData);
    res.status(201).json({ message: 'Comment published successfully!', comment: newComment });
  } catch (err) {
    res.status(500).json({ message: 'Error saving comment.' });
  }
}

export async function editComment(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthenticated.' });
    return;
  }

  const { id } = req.params;
  const { comment } = req.body;

  if (!comment) {
    res.status(400).json({ message: 'Comment content cannot be empty.' });
    return;
  }

  try {
    const existing = await DB.comments.findOne(id);
    if (!existing) {
      res.status(404).json({ message: 'Comment search out of bounds or deleted.' });
      return;
    }

    // Security: Only comment author can edit
    if (existing.userId !== req.user.id) {
      res.status(403).json({ message: 'Forbidden: You can only edit comments you published yourself.' });
      return;
    }

    const updated = await DB.comments.update(id, { comment });
    res.status(200).json({ message: 'Comment updated successfully!', comment: updated });
  } catch (err) {
    res.status(500).json({ message: 'Error modifying comment.' });
  }
}

export async function deleteComment(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthenticated.' });
    return;
  }

  const { id } = req.params;

  try {
    const existing = await DB.comments.findOne(id);
    if (!existing) {
      res.status(404).json({ message: 'Comment not found.' });
      return;
    }

    const blog = await DB.blogs.findOne({ id: existing.blogId });

    // Security: Delete permitted to Comment Author OR Blog author OR Admin!
    const isCommentAuthor = existing.userId === req.user.id;
    const isBlogAuthor = blog && blog.author.id === req.user.id;
    const isAdmin = req.user.role === 'Admin';

    if (!isCommentAuthor && !isBlogAuthor && !isAdmin) {
      res.status(403).json({ message: 'Forbidden. Inappropriate permissions to delete comment.' });
      return;
    }

    await DB.comments.delete(id);
    res.status(200).json({ message: 'Comment and nested replies deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting comment.' });
  }
}

export async function toggleLikeComment(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Login required to rate comments.' });
    return;
  }

  const { id } = req.params;

  try {
    const comment = await DB.comments.findOne(id);
    if (!comment) {
      res.status(404).json({ message: 'Comment not found.' });
      return;
    }

    const likes = comment.likes || [];
    const hasLiked = likes.includes(req.user.id);

    let updatedLikes;
    if (hasLiked) {
      updatedLikes = likes.filter((uid: string) => uid !== req.user!.id);
    } else {
      updatedLikes = [...likes, req.user.id];
    }

    const updated = await DB.comments.update(id, { likes: updatedLikes });
    res.status(200).json({ 
      message: hasLiked ? 'Liked comment removed.' : 'Comment liked!', 
      likes: updated.likes,
      hasLiked: !hasLiked 
    });
  } catch (err) {
    res.status(500).json({ message: 'Error toggling comment like.' });
  }
}

// ADMIN ACTION
export async function getAllCommentsAdmin(req: AuthRequest, res: Response): Promise<void> {
  try {
    const comments = await DB.comments.find();
    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving system comments.' });
  }
}
