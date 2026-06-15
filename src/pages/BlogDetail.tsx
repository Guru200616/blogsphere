import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Bookmark, Share2, Eye, Clock, MessageSquare, ChevronLeft, Send, Trash2, Edit3, CornerDownRight, AlertCircle, ThumbsUp, Check } from 'lucide-react';
import { api } from '../services/api';
import { Blog, Comment, User } from '../types';
import { useAuth } from '../context/AuthContext';

export const BlogDetail: React.FC<{ triggerToast: (msg: string, isErr?: boolean) => void }> = ({ triggerToast }) => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const navigate = useNavigate();
  const { user, token, refreshUser } = useAuth();

  const [blog, setBlog] = useState<Blog | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Comment draft triggers
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  // Follow states
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followersCount, setFollowersCount] = useState<number>(0);

  // Likes & Bookmarks triggers
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [hasBookmarked, setHasBookmarked] = useState<boolean>(false);

  useEffect(() => {
    loadBlogDetails();
  }, [idOrSlug]);

  const loadBlogDetails = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      // 1. Fetch Blog by id or slug
      const blogRes = await api.get<Blog>(`/blogs/${idOrSlug}`);
      const b = blogRes.data;
      setBlog(b);

      // Verify self likes, bookmarks, and author follow state
      if (user) {
        setHasLiked(b.likes?.includes(user.id) || false);
        setHasBookmarked(b.bookmarks?.includes(user.id) || false);
        const authorFollowers = b.author?.followers || [];
        setIsFollowing(authorFollowers.includes(user.id));
      }
      setFollowersCount(b.author?.followers?.length || 0);

      // 2. Fetch comments
      const commentsRes = await api.get<Comment[]>(`/comments/${b.id}`);
      setComments(commentsRes.data);

      // 3. Fetch related blogs in category
      const relatedRes = await api.get<Blog[]>('/blogs', {
        params: { category: b.category, status: 'Published' }
      });
      // Filter out current blog
      setRelatedBlogs(relatedRes.data.filter((item) => item.id !== b.id).slice(0, 3));

    } catch (err: any) {
      console.error(err);
      setErrorMsg('Could not find the requested blog story. It might have been drafted or removed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggles for Likes
  const handleLikeBlog = async () => {
    if (!token) {
      triggerToast('Please log in to like articles.', true);
      navigate('/auth');
      return;
    }
    if (!blog) return;

    try {
      const response = await api.post(`/blogs/${blog.id}/like`);
      setHasLiked(response.data.hasLiked);
      setBlog({ ...blog, likes: response.data.likes });
      triggerToast(response.data.hasLiked ? 'Story liked!' : 'Like removed.');
    } catch (err) {
      triggerToast('Error updating rating.', true);
    }
  };

  // Toggles for Bookmarks
  const handleBookmarkBlog = async () => {
    if (!token) {
      triggerToast('Please log in to bookmark stories.', true);
      navigate('/auth');
      return;
    }
    if (!blog) return;

    try {
      const response = await api.post(`/blogs/${blog.id}/bookmark`);
      setHasBookmarked(response.data.hasBookmarked);
      setBlog({ ...blog, bookmarks: response.data.bookmarks });
      triggerToast(response.data.hasBookmarked ? 'Added to private bookmarks.' : 'Bookmark removed.');
    } catch (err) {
      triggerToast('Error saving bookmark.', true);
    }
  };

  // Follow authors
  const handleFollowAuthor = async () => {
    if (!token) {
      triggerToast('Please log in to follow authors.', true);
      navigate('/auth');
      return;
    }
    if (!blog) return;

    try {
      const response = await api.post(`/authors/${blog.author.id}/follow`);
      setIsFollowing(response.data.isFollowing);
      setFollowersCount(prev => response.data.isFollowing ? prev + 1 : prev - 1);
      triggerToast(response.data.message);
      refreshUser();
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Error executing follow action.', true);
    }
  };

  // Submit master comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      triggerToast('Log in required to post comments.', true);
      navigate('/auth');
      return;
    }
    if (!newCommentText.trim() || !blog) return;

    try {
      const response = await api.post('/comments', {
        blogId: blog.id,
        comment: newCommentText
      });
      setComments([...comments, response.data.comment]);
      setNewCommentText('');
      triggerToast('Comment added!');
    } catch (err) {
      triggerToast('Could not save comment.', true);
    }
  };

  // Submit nested reply
  const handleSubmitReply = async (parentCommentId: string) => {
    if (!token) {
      triggerToast('Log in required to post replies.', true);
      navigate('/auth');
      return;
    }
    if (!replyText.trim() || !blog) return;

    try {
      const response = await api.post('/comments', {
        blogId: blog.id,
        comment: replyText,
        parentCommentId
      });
      setComments([...comments, response.data.comment]);
      setReplyingCommentId(null);
      setReplyText('');
      triggerToast('Reply added!');
    } catch (err) {
      triggerToast('Could not save reply.', true);
    }
  };

  // Edit comment submit
  const handleEditComment = async (commentId: string) => {
    if (!editingText.trim()) return;
    try {
      const response = await api.put(`/comments/${commentId}`, {
        comment: editingText
      });
      setComments(comments.map(c => c.id === commentId ? { ...c, comment: response.data.comment.comment } : c));
      setEditingCommentId(null);
      setEditingText('');
      triggerToast('Comment updated.');
    } catch (err) {
      triggerToast('Failed to save edits.', true);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Delete this comment and all nested replies?')) return;
    try {
      await api.delete(`/comments/${commentId}`);
      // Remove all elements whose IDs equal commentId OR recursively parentCommentId is commentId
      const targetIds = new Set<string>([commentId]);
      
      // Do recursive marking
      let prevSize = 0;
      while (targetIds.size !== prevSize) {
        prevSize = targetIds.size;
        comments.forEach(c => {
          if (c.parentCommentId && targetIds.has(c.parentCommentId)) {
            targetIds.add(c.id);
          }
        });
      }

      setComments(comments.filter(c => !targetIds.has(c.id)));
      triggerToast('Comment thread deleted.');
    } catch (err) {
      triggerToast('Failed to delete comment.', true);
    }
  };

  // Toggle comment like rating
  const handleToggleLikeComment = async (commentId: string) => {
    if (!token) {
      triggerToast('Please log in to like comments.', true);
      return;
    }

    try {
      const response = await api.post(`/comments/${commentId}/like`);
      setComments(comments.map(c => c.id === commentId ? { ...c, likes: response.data.likes } : c));
    } catch (err) {
      triggerToast('Error rating comment.', true);
    }
  };

  const handleShareBlog = () => {
    navigator.clipboard.writeText(window.location.href);
    triggerToast('Copied story URL coordinates to clipboard! Share it.');
  };

  // Nesting and sorting comments helper
  const getCommentsHierarchy = () => {
    const roots = comments.filter(c => !c.parentCommentId);
    
    // Recursive loader
    const loadChildren = (parent: Comment): Comment[] => {
      const children = comments.filter(c => c.parentCommentId === parent.id);
      return children.map(child => ({
        ...child,
        replies: loadChildren(child)
      }));
    };

    return roots.map(root => ({
      ...root,
      replies: loadChildren(root)
    }));
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin"></div>
        <p className="text-sm text-gray-500 font-mono">Drawing canvas...</p>
      </div>
    );
  }

  if (errorMsg || !blog) {
    return (
      <div className="py-16 text-center text-red-500 max-w-md mx-auto px-4">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <h3 className="text-lg font-bold">Story Unavailable</h3>
        <p className="text-xs text-gray-500 mt-2">{errorMsg}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-full hover:bg-indigo-700 shadow-sm inline-flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Exit to Homepage</span>
        </button>
      </div>
    );
  }

  const commentHierarchy = getCommentsHierarchy();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-10">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to stories</span>
      </button>

      {/* CORE READ CANVAS */}
      <article className="space-y-6">
        {/* Category & Tags */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30 text-xs font-bold text-indigo-600 dark:text-indigo-400">
            {blog.category}
          </span>
          {blog.tags?.map(t => (
            <span key={t} className="text-xs text-gray-400">#{t}</span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
          {blog.title}
        </h1>

        {/* Excerpt */}
        <p className="text-base sm:text-lg text-gray-500 dark:text-zinc-400 italic font-medium leading-relaxed max-w-3xl">
          {blog.excerpt}
        </p>

        {/* AUTHOR CARD & ENGAGEMENT SUMMARY */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900/50 border border-gray-150 dark:border-zinc-800/80 gap-4">
          <div className="flex items-center gap-3">
            <img
              src={blog.author.avatar}
              alt={blog.author.name}
              className="w-12 h-12 rounded-full object-cover border border-gray-200"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{blog.author.name}</span>
                {user && user.id !== blog.author.id && (
                  <button
                    onClick={handleFollowAuthor}
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                      isFollowing 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                    }`}
                  >
                    {isFollowing ? <Check className="w-2.5 h-2.5" /> : null}
                    <span>{isFollowing ? 'Following' : 'Follow'}</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-500 font-medium">@{blog.author.username} • {followersCount} Followers</p>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                {new Date(blog.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-gray-500 justify-end">
            <span className="flex items-center gap-1" title="Views count">
              <Eye className="w-4 h-4" />
              <span>{blog.views || 0} views</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{blog.readingTime || 3} min read</span>
            </span>
          </div>
        </div>

        {/* Cover Image */}
        <div className="aspect-[21/9] w-full rounded-2xl overflow-hidden shadow-sm border border-gray-200/50 dark:border-zinc-800/60">
          <img
            src={blog.coverImage}
            alt={blog.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        {/* DYNAMIC ARTICLE RENDER CONTENT */}
        <div className="prose prose-sm sm:prose dark:prose-invert max-w-none leading-relaxed dark:text-zinc-200 py-6 font-sans">
          <div dangerouslySetInnerHTML={{ __html: blog.content }} />
        </div>
      </article>

      {/* SHARE, LIKES, BOOKMARKS CONTROLLERS BAR */}
      <div className="flex items-center justify-between py-4 border-y border-gray-200/60 dark:border-zinc-800/60">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLikeBlog}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full border transition-all ${
              hasLiked
                ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/30 text-rose-600 dark:text-rose-450'
                : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
            }`}
          >
            <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current text-rose-500' : ''}`} />
            <span>{blog.likes?.length || 0} Likes</span>
          </button>

          <button
            onClick={handleBookmarkBlog}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full border transition-all ${
              hasBookmarked
                ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30 text-amber-650 dark:text-amber-450'
                : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${hasBookmarked ? 'fill-current text-amber-500' : ''}`} />
            <span>{hasBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </button>
        </div>

        <button
          onClick={handleShareBlog}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors"
          title="Share Article"
        >
          <Share2 className="w-4 h-4" />
          <span>Share Story</span>
        </button>
      </div>

      {/* RELATED POSTS GRID */}
      {relatedBlogs.length > 0 && (
        <div className="py-6 space-y-4">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white uppercase tracking-wider text-xs">
            Recommended Stories
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedBlogs.map(r => (
              <div key={r.id} className="group flex flex-col justify-between overflow-hidden rounded-xl border border-gray-150 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/30 p-4 shadow-sm hover:shadow-md transition-all">
                <div>
                  <img
                    src={r.coverImage}
                    alt=""
                    className="aspect-video w-full object-cover rounded-lg mb-3"
                  />
                  <Link to={`/blog/${r.slug}`}>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 line-clamp-2 leading-snug transition-colors">
                      {r.title}
                    </h4>
                  </Link>
                </div>
                <div className="text-[10px] text-gray-400 mt-2 flex items-center justify-between font-mono">
                  <span>@{r.author.username}</span>
                  <span>{r.readingTime || 3} min read</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RE-RENDER COMMENTS DEEP ROOT */}
      <div className="pt-6 border-t border-gray-200/60 dark:border-zinc-800/60 space-y-8">
        <h3 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-500" />
          <span>Responses ({comments.length})</span>
        </h3>

        {/* Input Comment Box */}
        {token ? (
          <form onSubmit={handleSubmitComment} className="flex gap-3 items-start">
            <img
              src={user?.avatar}
              alt=""
              className="w-10 h-10 rounded-full object-cover border border-gray-200 mt-1"
            />
            <div className="flex-grow space-y-2">
              <textarea
                placeholder="What are your thoughts on this story?"
                rows={3}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="w-full text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 placeholder-zinc-400 p-3 rounded-xl border border-gray-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-full text-xs font-semibold hover:bg-indigo-700 shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish response</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-5 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100/30 text-center space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-zinc-350">Join the discussion</p>
            <p className="text-xs text-gray-500">Sign in to publish comments, ask questions, or like opinions.</p>
            <button
              onClick={() => navigate('/auth')}
              className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-full hover:bg-indigo-700 inline-block shadow-sm"
            >
              Sign In to Respond
            </button>
          </div>
        )}

        {/* RECURSIVE COMMENTS RENDER SECTION */}
        <div className="space-y-6">
          {comments.length === 0 ? (
            <p className="text-center text-sm text-gray-400 font-medium py-6">No responses yet. Be the first to share your opinion!</p>
          ) : (
            commentHierarchy.map((commentNode) => (
              <CommentCard
                key={commentNode.id}
                comment={commentNode}
                currentUser={user}
                onReplyToggle={setReplyingCommentId}
                replyingId={replyingCommentId}
                replyText={replyText}
                onReplyTextChange={setReplyText}
                onReplySubmit={handleSubmitReply}
                onEditToggle={(id, text) => {
                  setEditingCommentId(id);
                  setEditingText(text);
                }}
                editingId={editingCommentId}
                editingText={editingText}
                onEditingTextChange={setEditingText}
                onEditSubmit={handleEditComment}
                onDelete={handleDeleteComment}
                onLike={handleToggleLikeComment}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// MULTI-LEVEL NESTED COMMENT NODE VIEW
interface CommentCardProps {
  comment: Comment;
  currentUser: User | null;
  onReplyToggle: (id: string | null) => void;
  replyingId: string | null;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  onReplySubmit: (parentId: string) => void;
  onEditToggle: (id: string | null, text: string) => void;
  editingId: string | null;
  editingText: string;
  onEditingTextChange: (text: string) => void;
  onEditSubmit: (id: string) => void;
  onDelete: (id: string) => void;
  onLike: (id: string) => void;
  nestingLevel?: number;
}

const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  currentUser,
  onReplyToggle,
  replyingId,
  replyText,
  onReplyTextChange,
  onReplySubmit,
  onEditToggle,
  editingId,
  editingText,
  onEditingTextChange,
  onEditSubmit,
  onDelete,
  onLike,
  nestingLevel = 0
}) => {
  const isCreator = currentUser && currentUser.id === comment.userId;
  const isAdmin = currentUser && currentUser.role === 'Admin';
  const hasLikedComment = currentUser && comment.likes?.includes(currentUser.id);

  return (
    <div className={`space-y-3.5 ${nestingLevel > 0 ? 'ml-4 sm:ml-8 pl-4 border-l border-gray-200 dark:border-zinc-800' : ''}`}>
      <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800/80 shadow-xs">
        {/* User profile details */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <img
              src={comment.user.avatar}
              alt=""
              className="w-8 h-8 rounded-full object-cover border"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-905 dark:text-zinc-250">{comment.user.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-zinc-850 text-gray-500 font-bold uppercase">
                  {comment.user.role}
                </span>
              </div>
              <p className="text-[10px] text-gray-400">@{comment.user.username} • {new Date(comment.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isCreator && (
              <button
                onClick={() => onEditToggle(comment.id, comment.comment)}
                className="p-1 text-gray-450 hover:text-indigo-650 rounded hover:bg-gray-50 dark:hover:bg-zinc-850"
                title="Edit opinion"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            {(isCreator || isAdmin) && (
              <button
                onClick={() => onDelete(comment.id)}
                className="p-1 text-gray-450 hover:text-red-650 rounded hover:bg-gray-50 dark:hover:bg-zinc-850"
                title="Delete comment"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Comment text body or Edit inline container */}
        {editingId === comment.id ? (
          <div className="space-y-2">
            <textarea
              value={editingText}
              onChange={(e) => onEditingTextChange(e.target.value)}
              className="w-full text-xs p-2 whitespace-pre-wrap rounded bg-zinc-50 dark:bg-zinc-950 border text-gray-900 dark:text-zinc-100 outline-none"
              rows={2}
            />
            <div className="flex justify-end gap-1">
              <button
                onClick={() => onEditToggle(null, '')}
                className="px-2.5 py-1 text-[10px] border rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => onEditSubmit(comment.id)}
                className="px-2.5 py-1 text-[10px] bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-gray-700 dark:text-zinc-350 leading-relaxed whitespace-pre-line">
            {comment.comment}
          </p>
        )}

        {/* Comment actions (likes & reply action) */}
        {editingId !== comment.id && (
          <div className="flex items-center gap-4 mt-3.5 pt-3 border-t border-gray-100 dark:border-zinc-850 text-[11px] text-gray-500 font-mono">
            <button
              onClick={() => onLike(comment.id)}
              className={`flex items-center gap-1 hover:text-indigo-600 transition-colors ${
                hasLikedComment ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${hasLikedComment ? 'fill-current text-indigo-500' : ''}`} />
              <span>{comment.likes?.length || 0} Likes</span>
            </button>

            {currentUser && nestingLevel < 3 && (
              <button
                onClick={() => onReplyToggle(replyingId === comment.id ? null : comment.id)}
                className="text-gray-450 hover:text-indigo-6
0 flex items-center gap-1.5 font-sans hover:underline"
              >
                <CornerDownRight className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Inline Reply input container */}
      {replyingId === comment.id && (
        <div className="flex gap-2.5 items-start bg-gray-50/50 dark:bg-zinc-900/40 p-3 rounded-xl border ml-4 sm:ml-8 pl-4">
          <textarea
            placeholder={`Reply to ${comment.user.name}...`}
            rows={2}
            value={replyText}
            onChange={(e) => onReplyTextChange(e.target.value)}
            className="flex-grow text-xs p-2.5 outline-none rounded border bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-500"
          />
          <div className="flex flex-col gap-1 items-end shrink-0">
            <button
              onClick={() => onReplySubmit(comment.id)}
              disabled={!replyText.trim()}
              className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-[10px] rounded hover:bg-indigo-700 shadow-sm disabled:opacity-50"
            >
              Submit
            </button>
            <button
              onClick={() => onReplyToggle(null)}
              className="text-[9px] text-gray-400 hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Render sub reply components */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-4 pt-1">
          {comment.replies.map((subNode) => (
            <CommentCard
              key={subNode.id}
              comment={subNode}
              currentUser={currentUser}
              onReplyToggle={onReplyToggle}
              replyingId={replyingId}
              replyText={replyText}
              onReplyTextChange={onReplyTextChange}
              onReplySubmit={onReplySubmit}
              onEditToggle={onEditToggle}
              editingId={editingId}
              editingText={editingText}
              onEditingTextChange={onEditingTextChange}
              onEditSubmit={onEditSubmit}
              onDelete={onDelete}
              onLike={onLike}
              nestingLevel={nestingLevel + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
