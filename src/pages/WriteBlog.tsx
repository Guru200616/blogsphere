import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Projector, Eye, FileText, Plus, X, Globe, Settings, AlertCircle, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { RichTextEditor } from '../components/RichTextEditor';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Technology', 'Programming', 'Business', 'Education', 'Lifestyle', 'Travel', 'Health'];

export const WriteBlog: React.FC<{ triggerToast: (msg: string, isErr?: boolean) => void }> = ({ triggerToast }) => {
  const { id } = useParams<{ id: string }>(); // If ID is present, we are in Edit mode!
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('Technology');
  const [excerpt, setExcerpt] = useState<string>('');
  const [coverImage, setCoverImage] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPreviewActive, setIsPreviewActive] = useState<boolean>(false);
  const [isLoadingBlog, setIsLoadingBlog] = useState<boolean>(false);

  useEffect(() => {
    // Check authentication
    if (!token) {
      triggerToast('Please log in to write articles.', true);
      navigate('/auth');
      return;
    }

    if (user && user.role !== 'Admin' && user.role !== 'Author') {
      triggerToast('Access restricted. Only Authors or Admins can draft articles.', true);
      navigate('/');
      return;
    }

    if (id) {
      loadDraftDetails();
    }
  }, [id, token, user]);

  const loadDraftDetails = async () => {
    setIsLoadingBlog(true);
    try {
      const response = await api.get(`/blogs/${id}`);
      const b = response.data;
      
      // Safety gate: only author or admin can edit
      if (user && b.author.id !== user.id && user.role !== 'Admin') {
        triggerToast('Forbidden. This article belongs to another author.', true);
        navigate('/');
        return;
      }

      setTitle(b.title);
      setCategory(b.category);
      setExcerpt(b.excerpt);
      setCoverImage(b.coverImage);
      setContent(b.content);
      setTags(b.tags || []);
    } catch (err) {
      triggerToast('Error loading story coordinates.', true);
    } finally {
      setIsLoadingBlog(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().replace(/[^a-zA-Z0-9]/g, '');
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveFlow = async (status: 'Draft' | 'Published') => {
    if (!title.trim()) {
      triggerToast('A captivating title is required.', true);
      return;
    }
    if (!content.trim() || content === '<p></p>') {
      triggerToast('Story content cannot be empty.', true);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title,
        content,
        excerpt,
        category,
        tags,
        coverImage,
        status
      };

      let response;
      if (id) {
        response = await api.put(`/blogs/${id}`, payload);
        triggerToast(status === 'Published' ? 'Story published successfully!' : 'Draft edits saved.');
      } else {
        response = await api.post('/blogs', payload);
        triggerToast(status === 'Published' ? 'Story published successfully!' : 'Story saved to drafts.');
      }

      // Navigate back to user profile or explore
      navigate('/profile');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error occurred while saving article.';
      triggerToast(msg, true);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingBlog) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-gray-500 font-mono">Fetching story details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* HEADER CONTROLS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/60 dark:border-zinc-800/60 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800/80 rounded-full text-gray-500 transition-all"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {id ? 'Edit Story' : 'Draft New Story'}
            </h1>
            <p className="text-xs text-gray-405 leading-none">Share your ideas with the world.</p>
          </div>
        </div>

        {/* Action Toggle controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPreviewActive(!isPreviewActive)}
            className={`px-3 py-1.5 text-xs rounded-full border font-semibold flex items-center gap-1.5 transition-all ${
              isPreviewActive
                ? 'bg-amber-100 border-amber-200 text-amber-800'
                : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-50'
            }`}
          >
            {isPreviewActive ? <FileText className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isPreviewActive ? 'Back to editor' : 'Live Preview'}</span>
          </button>

          <button
            onClick={() => handleSaveFlow('Draft')}
            disabled={isSaving}
            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 border border-transparent dark:border-zinc-700 select-none cursor-pointer flex items-center gap-1"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={() => handleSaveFlow('Published')}
            disabled={isSaving}
            className="px-5 py-1.5 rounded-full text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm disabled:opacity-50 flex items-center gap-1"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{id ? 'Republish' : 'Publish Story'}</span>
          </button>
        </div>
      </div>

      {isPreviewActive ? (
        /* INTERACTIVE RENDER PREVIEW MODE */
        <div className="p-6 md:p-10 rounded-2xl bg-white dark:bg-zinc-950 border border-gray-150 dark:border-zinc-850/80 max-w-4xl mx-auto space-y-6">
          <div className="text-center text-xs text-amber-600 font-bold uppercase tracking-widest bg-amber-50 dark:bg-amber-950/20 py-1.5 rounded border border-amber-100 dark:border-amber-900/30">
            Preview Mode Active — Replicating reader canvas
          </div>
          <div className="space-y-4">
            <span className="px-3 py-1 rounded bg-indigo-50 dark:bg-indigo-950/40 text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
              {category}
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
              {title || 'Empty Title'}
            </h1>
            <p className="text-base text-gray-505 dark:text-zinc-400 leading-relaxed italic">
              {excerpt || 'No excerpt formulated.'}
            </p>
            {coverImage && (
              <img
                src={coverImage}
                alt=""
                className="aspect-video w-full rounded-xl object-cover border"
              />
            )}
            <div className="prose prose-sm dark:prose-invert max-w-none pt-4 dark:text-zinc-200">
              <div dangerouslySetInnerHTML={{ __html: content || '<p>No content composed yet.</p>' }} />
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD WRITE WORKSPACE */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Editing Area (Inputs and Rich Editor) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Title */}
            <input
              type="text"
              placeholder="Title of your story..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl md:text-3xl font-black tracking-tight bg-transparent border-0 outline-none p-0 focus:ring-0 focus:outline-none focus:border-indigo-600 placeholder-zinc-300 dark:placeholder-zinc-650 dark:text-white"
            />

            {/* Rich Editor Component */}
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Start sharing your knowledge or experience..."
            />
          </div>

          {/* Right Configuration Drawer (Settings for image, tags, categories) */}
          <div className="space-y-5 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800/80 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b pb-2">
              <Settings className="w-4 h-4 text-indigo-500" />
              <span>Settings & Metadata</span>
            </h3>

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-650 dark:text-zinc-400">Story Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs p-2 rounded-lg bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 text-gray-800 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Cover Image URL input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-650 dark:text-zinc-400">Cover Image URL</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="w-full text-xs p-2 rounded-lg bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 text-gray-800 dark:text-zinc-300 focus:outline-none"
              />
              <p className="text-[10px] text-gray-400">Paste any direct image URL link (e.g. from Unsplash) to serve as a catalog preview banner.</p>
              {coverImage && (
                <div className="aspect-video w-full rounded-lg overflow-hidden border mt-1">
                  <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Excerpt descriptor box */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-650 dark:text-zinc-400">Excerpt / Short Description</label>
              <textarea
                placeholder="A compelling, short synopsis summarizing this blog article in 1-2 sentences..."
                rows={3}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full text-xs p-2 rounded-lg bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 text-gray-800 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-gray-400">Recommended for search results cards. If blank, we will generate one from your story text on save.</p>
            </div>

            {/* Tags interface */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-650 dark:text-zinc-400">Story Tags</label>
              <input
                type="text"
                placeholder="Add tags... (press Enter or comma)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full text-xs p-2 rounded-lg bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 text-gray-800 dark:text-zinc-300 focus:outline-none"
              />
              
              <div className="flex flex-wrap gap-1 pt-1.5">
                {tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 py-0.5 px-2 rounded-full text-[10.5px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 border border-indigo-100/50"
                  >
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(idx)}
                      className="text-gray-450 hover:text-red-500 font-bold outline-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default WriteBlog;
