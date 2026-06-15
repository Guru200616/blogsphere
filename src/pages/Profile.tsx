import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Settings, Edit3, Trash2, Bookmark, FileText, Globe, Link as LinkIcon, Twitter, Github, Users, PlusCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Blog } from '../types';

export const Profile: React.FC<{ triggerToast: (msg: string, isErr?: boolean) => void }> = ({ triggerToast }) => {
  const navigate = useNavigate();
  const { user, token, updateUser, refreshUser } = useAuth();

  const [myBlogs, setMyBlogs] = useState<Blog[]>([]);
  const [bookmarkedBlogs, setBookmarkedBlogs] = useState<Blog[]>([]);
  const [followingUsers, setFollowingUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'published' | 'drafts' | 'bookmarks' | 'following'>('published');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Profile Edit Overlay Toggle
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    bio: '',
    avatar: '',
    twitter: '',
    github: '',
    website: ''
  });

  useEffect(() => {
    if (!token) {
      triggerToast('Authentication required.', true);
      navigate('/auth');
      return;
    }

    if (user) {
      // Sync edit form fields
      setEditForm({
        name: user.name || '',
        username: user.username || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
        twitter: user.socialLinks?.twitter || '',
        github: user.socialLinks?.github || '',
        website: user.socialLinks?.website || ''
      });

      loadProfileData();
    }
  }, [token, user?.id]);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch my blogs
      const myBlogsResponse = await api.get('/blogs', {
        params: { status: 'All' } // Request drafts + published
      });
      // Filter out blogs written by current user
      const selfBlogs = myBlogsResponse.data.filter((b: Blog) => b.author.id === user?.id);
      setMyBlogs(selfBlogs);

      // 2. Fetch bookmarks: request all published blogs, filter those wherebookmarks has userId
      const blogsRes = await api.get('/blogs');
      const bookmarked = blogsRes.data.filter((b: Blog) => b.bookmarks?.includes(user?.id || ''));
      setBookmarkedBlogs(bookmarked);

      // 3. Fetch following users attributes
      const followingList = [];
      if (user?.following && user.following.length > 0) {
        for (const targetId of user.following) {
          try {
            const res = await api.get(`/authors/${targetId}`);
            followingList.push(res.data);
          } catch (e) {
            // Target was deleted or unaddressable
          }
        }
      }
      setFollowingUsers(followingList);

    } catch (err) {
      triggerToast('Error updating profile statistics, please refresh.', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      triggerToast('Full Name cannot be empty.', true);
      return;
    }

    try {
      const response = await api.put('/users/profile', {
        name: editForm.name,
        username: editForm.username,
        bio: editForm.bio,
        avatar: editForm.avatar,
        socialLinks: {
          twitter: editForm.twitter,
          github: editForm.github,
          website: editForm.website
        }
      });

      updateUser(response.data.user);
      setIsEditMode(false);
      triggerToast('Profile updated successfully!');
      refreshUser();
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to update profile.', true);
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this blog post permanently? This action cannot be reversed.')) {
      return;
    }

    try {
      await api.delete(`/blogs/${blogId}`);
      setMyBlogs(myBlogs.filter(b => b.id !== blogId));
      triggerToast('Story deleted successfully.');
    } catch (err) {
      triggerToast('Failed to delete story.', true);
    }
  };

  const handleUnfollowAuthor = async (authorId: string) => {
    try {
      const res = await api.post(`/authors/${authorId}/follow`);
      setFollowingUsers(followingUsers.filter(u => u.id !== authorId));
      triggerToast('Unfollowed author.');
      refreshUser();
    } catch (err) {
      triggerToast('Error unfollowing author.', true);
    }
  };

  if (!user) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-gray-405">Constructing credentials profile...</p>
      </div>
    );
  }

  // Segment my blogs
  const publishedStories = myBlogs.filter(b => b.status === 'Published');
  const draftStories = myBlogs.filter(b => b.status === 'Draft' || b.status === 'Archived');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* AUTHOR GRAPHIC INFO HEADER */}
      <div className="p-6 md:p-8 rounded-3xl border border-gray-150/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md shadow-sm flex flex-col md:flex-row gap-6 md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-6 items-center text-center sm:text-left">
          <img
            src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
            alt=""
            className="w-24 h-24 rounded-full object-cover border-2 border-indigo-150 shadow-sm shrink-0"
          />
          <div className="space-y-2 max-w-lg">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-none tracking-tight">
                {user.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100/40 uppercase">
                {user.role}
              </span>
            </div>

            <p className="text-xs text-gray-500 font-mono">@{user.username}</p>

            <p className="text-xs sm:text-sm text-gray-650 dark:text-zinc-400 leading-relaxed font-normal">
              {user.bio || "No biography details shared yet. Click 'Edit profile detail' to establish yours!"}
            </p>

            {/* Social linkages */}
            <div className="flex flex-wrap gap-4 items-center justify-center sm:justify-start pt-1 text-xs text-gray-500 font-semibold">
              {user.socialLinks?.twitter && (
                <a href={user.socialLinks.twitter} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-indigo-500">
                  <Twitter className="w-3.5 h-3.5 text-sky-400" />
                  <span>Twitter</span>
                </a>
              )}
              {user.socialLinks?.github && (
                <a href={user.socialLinks.github} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-indigo-500">
                  <Github className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                  <span>GitHub</span>
                </a>
              )}
              {user.socialLinks?.website && (
                <a href={user.socialLinks.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-indigo-500">
                  <LinkIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Website</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Followers / Following Counters & Buttons */}
        <div className="flex md:flex-col gap-4 items-center sm:justify-center md:items-end flex-shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
          <div className="flex gap-6 text-center shrink-0">
            <div>
              <div className="text-lg font-black text-gray-900 dark:text-white leading-none">
                {user.followers?.length || 0}
              </div>
              <div className="text-[10px] text-gray-450 uppercase font-bold mt-1 tracking-wider">Followers</div>
            </div>
            <div className="w-px bg-gray-200"></div>
            <div>
              <div className="text-lg font-black text-gray-900 dark:text-white leading-none">
                {user.following?.length || 0}
              </div>
              <div className="text-[10px] text-gray-450 uppercase font-bold mt-1 tracking-wider font-semibold">Following</div>
            </div>
          </div>

          <button
            onClick={() => setIsEditMode(true)}
            className="px-4 py-2 text-xs font-bold rounded-full border border-gray-200 dark:border-zinc-800 text-gray-750 dark:text-zinc-300 bg-white dark:bg-zinc-950 hover:bg-gray-50 flex items-center gap-1.5 shadow-xs shrink-0 select-none cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Customize bio</span>
          </button>
        </div>
      </div>

      {/* EDIT PROFILE COLLAPSIBLE MODAL INSIDE BOX */}
      {isEditMode && (
        <form onSubmit={handleEditProfileSubmit} className="p-6 rounded-3xl bg-gray-50 dark:bg-zinc-900/45 border border-indigo-100/50 dark:border-zinc-800 space-y-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Customize Writer Portfolio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-650 dark:text-zinc-405">Full Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                className="w-full text-xs p-2 rounded-lg bg-white dark:bg-zinc-950 border outline-none text-gray-900 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-650 dark:text-zinc-405">Username</label>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                className="w-full text-xs p-2 rounded-lg bg-white dark:bg-zinc-950 border outline-none text-gray-900 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-bold text-gray-650 dark:text-zinc-405">Short Bio</label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                rows={2}
                className="w-full text-xs p-2 rounded-lg bg-white dark:bg-zinc-950 border outline-none text-gray-900 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-650 dark:text-zinc-405">Avatar Image URL</label>
              <input
                type="text"
                value={editForm.avatar}
                onChange={(e) => setEditForm({...editForm, avatar: e.target.value})}
                className="w-full text-xs p-2 rounded-lg bg-white dark:bg-zinc-950 border outline-none text-gray-900 dark:text-zinc-100 hover:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-650 dark:text-zinc-405">Twitter Link</label>
              <input
                type="text"
                placeholder="https://twitter.com/..."
                value={editForm.twitter}
                onChange={(e) => setEditForm({...editForm, twitter: e.target.value})}
                className="w-full text-xs p-2 rounded-lg bg-white dark:bg-zinc-950 border outline-none text-gray-900 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-650 dark:text-zinc-405">GitHub Link</label>
              <input
                type="text"
                placeholder="https://github.com/..."
                value={editForm.github}
                onChange={(e) => setEditForm({...editForm, github: e.target.value})}
                className="w-full text-xs p-2 rounded-lg bg-white dark:bg-zinc-950 border outline-none text-gray-900 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-650 dark:text-zinc-405">Website Link</label>
              <input
                type="text"
                placeholder="https://..."
                value={editForm.website}
                onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                className="w-full text-xs p-2 rounded-lg bg-white dark:bg-zinc-950 border outline-none text-gray-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-150">
            <button
              type="button"
              onClick={() => setIsEditMode(false)}
              className="px-4 py-1.5 rounded-full text-xs border bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 rounded-full text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            >
              Save Profile Details
            </button>
          </div>
        </form>
      )}

      {/* CORE WORKSPACE TABS */}
      <div className="space-y-6">
        <div className="border-b border-gray-200/65 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex gap-4 overflow-x-auto pb-px scrollbar-none">
            {/* Show Blogs list if they are Admin/Author */}
            {(user.role === 'Admin' || user.role === 'Author') && (
              <>
                <button
                  onClick={() => setActiveTab('published')}
                  className={`text-xs uppercase tracking-wider font-extrabold pb-3.5 px-1 relative whitespace-nowrap transition-all ${
                    activeTab === 'published'
                      ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                      : 'text-gray-455 hover:text-gray-900 dark:text-zinc-450'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4" />
                    <span>My Publications ({publishedStories.length})</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('drafts')}
                  className={`text-xs uppercase tracking-wider font-extrabold pb-3.5 px-1 relative whitespace-nowrap transition-all ${
                    activeTab === 'drafts'
                      ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                      : 'text-gray-455 hover:text-gray-900 dark:text-zinc-450'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span>Private Drafts ({draftStories.length})</span>
                  </span>
                </button>
              </>
            )}

            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`text-xs uppercase tracking-wider font-extrabold pb-3.5 px-1 relative whitespace-nowrap transition-all ${
                activeTab === 'bookmarks'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                  : 'text-gray-455 hover:text-gray-900 dark:text-zinc-450'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Bookmark className="w-4 h-4" />
                <span>My Bookmarks ({bookmarkedBlogs.length})</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('following')}
              className={`text-xs uppercase tracking-wider font-extrabold pb-3.5 px-1 relative whitespace-nowrap transition-all ${
                activeTab === 'following'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                  : 'text-gray-455 hover:text-gray-900 dark:text-zinc-450'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>Following ({followingUsers.length})</span>
              </span>
            </button>
          </div>

          {/* Quick write redirect button (if Admin/Author) */}
          {(user.role === 'Admin' || user.role === 'Author') && (
            <Link
              to="/write"
              className="px-3.5 py-1.5 mb-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg border border-indigo-100/40 flex items-center gap-1.5 transition-all shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">New Story</span>
            </Link>
          )}
        </div>

        {/* TAB WORKSPACE VIEWS */}
        {isLoading ? (
          <div className="py-12 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-gray-450 font-mono">Loading data feeds...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 1. PUBLISHED STORIES TAB */}
            {activeTab === 'published' && (
              publishedStories.length === 0 ? (
                <div className="p-10 border border-dashed border-gray-200 dark:border-zinc-800 text-center rounded-2xl">
                  <Globe className="w-10 h-10 mx-auto text-gray-300 dark:text-zinc-700 mb-2" />
                  <p className="text-sm font-semibold text-gray-550 dark:text-zinc-400">You have no published stories yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Compose story coordinates and launch them to start gathering audience attention!</p>
                  <Link to="/write" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold underline mt-3 inline-block">Compose article now</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {publishedStories.map((b) => (
                    <ProfileStoryCard key={b.id} blog={b} onDelete={handleDeleteBlog} isEditable />
                  ))}
                </div>
              )
            )}

            {/* 2. DRAFTS TAB */}
            {activeTab === 'drafts' && (
              draftStories.length === 0 ? (
                <div className="p-10 border border-dashed border-gray-200 dark:border-zinc-800 text-center rounded-2xl">
                  <FileText className="w-10 h-10 mx-auto text-gray-300 dark:text-zinc-700 mb-2" />
                  <p className="text-sm font-semibold text-gray-550 dark:text-zinc-400 font-bold">Your private scratchpad is empty.</p>
                  <p className="text-xs text-gray-405 mt-1">Drafts are saved here securely. Readers cannot see them until published.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {draftStories.map((b) => (
                    <ProfileStoryCard key={b.id} blog={b} onDelete={handleDeleteBlog} isEditable />
                  ))}
                </div>
              )
            )}

            {/* 3. BOOKMARKS TAB */}
            {activeTab === 'bookmarks' && (
              bookmarkedBlogs.length === 0 ? (
                <div className="p-10 border border-dashed border-gray-200 dark:border-zinc-800 text-center rounded-2xl">
                  <Bookmark className="w-10 h-10 mx-auto text-gray-300 dark:text-zinc-700 mb-2" />
                  <p className="text-sm font-semibold text-gray-550 dark:text-zinc-400 font-bold">No bookmarks recorded.</p>
                  <p className="text-xs text-gray-405 mt-1">Tap the bookmark badge on any blog post to save a copy for safe keeping here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {bookmarkedBlogs.map((b) => (
                    <ProfileStoryCard key={b.id} blog={b} />
                  ))}
                </div>
              )
            )}

            {/* 4. FOLLOWING TAB */}
            {activeTab === 'following' && (
              followingUsers.length === 0 ? (
                <div className="p-10 border border-dashed border-gray-200 dark:border-zinc-800 text-center rounded-2xl">
                  <Users className="w-10 h-10 mx-auto text-gray-300 dark:text-zinc-700 mb-2" />
                  <p className="text-sm font-semibold text-gray-550 dark:text-zinc-400 font-bold">You are not following any authors.</p>
                  <p className="text-xs text-gray-405 mt-1">Follow other writers on their article pages to follow changes on their stories.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-4">
                  {followingUsers.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-gray-150 dark:border-zinc-800/80 bg-white/75 dark:bg-zinc-900/60 shadow-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <img src={item.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                        <div>
                          <span className="text-xs font-bold text-gray-900 dark:text-white leading-none block">{item.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono block">@{item.username}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnfollowAuthor(item.id)}
                        className="px-2.5 py-1 text-[10px] bg-indigo-50/50 hover:bg-red-50 hover:text-red-600 dark:bg-zinc-850 dark:hover:bg-red-950/30 text-indigo-650 dark:text-indigo-400 border rounded font-semibold transition-all"
                      >
                        Unfollow
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// MINI MODULE COMPONENT CARD FOR PROFILE
interface ProfileStoryCardProps {
  blog: Blog;
  onDelete?: (id: string) => void;
  isEditable?: boolean;
}

const ProfileStoryCard: React.FC<ProfileStoryCardProps> = ({ blog, onDelete, isEditable }) => {
  return (
    <div className="p-5 rounded-2xl border border-gray-150 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-md shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between text-[10.5px] uppercase font-bold text-indigo-600 mb-2">
          <span>{blog.category}</span>
          <span className={`px-2 py-0.2 rounded font-black uppercase text-[9.5px] ${
            blog.status === 'Published' 
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' 
              : 'bg-amber-100 text-amber-850 dark:bg-amber-950/30 dark:text-amber-400'
          }`}>
            {blog.status}
          </span>
        </div>

        <Link to={`/blog/${blog.slug}`}>
          <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white leading-tight hover:text-indigo-600 transition-colors line-clamp-2">
            {blog.title}
          </h3>
        </Link>
        <p className="text-[11.5px] sm:text-xs text-gray-500 dark:text-zinc-400 line-clamp-2 mt-2 leading-relaxed">
          {blog.excerpt}
        </p>
      </div>

      <div className="border-t border-gray-100 dark:border-zinc-850 pt-3 mt-4 flex items-center justify-between text-[11px] text-gray-400 font-mono">
        <span>{blog.readingTime || 3} min read</span>
        
        {isEditable && isEditable && onDelete ? (
          <div className="flex gap-2 shrink-0">
            <Link
              to={`/write/${blog.id}`}
              className="p-1 px-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800/60 text-gray-500 dark:text-zinc-350 rounded border flex items-center gap-1 font-sans font-semibold text-[10px]"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </Link>
            <button
              onClick={() => onDelete(blog.id)}
              className="p-1 px-2 bg-red-50 hover:bg-red-100 text-red-650 rounded border border-red-105 flex items-center gap-1 font-sans font-semibold text-[10px]"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 font-sans">
            <img src={blog.author?.avatar} className="w-4.5 h-4.5 rounded-full object-cover" />
            <span className="text-gray-500 font-medium">@{blog.author?.username}</span>
          </div>
        )}
      </div>
    </div>
  );
};
