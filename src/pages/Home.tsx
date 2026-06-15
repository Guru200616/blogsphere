import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Compass, BookOpen, Clock, Heart, MessageCircle, AlertCircle, Sparkles, ChevronRight, Bookmark } from 'lucide-react';
import { api } from '../services/api';
import { Blog } from '../types';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Technology', 'Programming', 'Business', 'Education', 'Lifestyle', 'Travel', 'Health'];

export const Home: React.FC = () => {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    fetchBlogs();
  }, [selectedCategory, selectedTag, sortOrder]);

  const fetchBlogs = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const params: any = {
        sort: sortOrder,
        status: 'Published' // Standard homepage only shows published
      };
      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      if (selectedTag) {
        params.tag = selectedTag;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await api.get('/blogs', { params });
      setBlogs(response.data);
    } catch (err: any) {
      setErrorMsg('Failed to load blog posts. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBlogs();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedTag('');
    setSortOrder('newest');
  };

  const featuredBlog = blogs[0];
  const secondaryBlogs = blogs.slice(1, 3);
  const trendingBlogs = [...blogs]
    .sort((a,b) => b.views - a.views)
    .slice(0, 4);

  return (
    <div className="space-y-10 py-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* HERO BANNER SECTION (Framer Motion feel) */}
      {!isLoading && blogs.length > 0 && selectedCategory === 'All' && !selectedTag && !searchQuery && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Featured post (Glass Card) */}
          {featuredBlog && (
            <div className="lg:col-span-2 group relative overflow-hidden rounded-3xl border border-gray-150 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md shadow-sm xl:shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full">
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={featuredBlog.coverImage}
                  alt={featuredBlog.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500 text-white shadow-sm">
                    Featured
                  </span>
                </div>
              </div>
              <div className="p-6 sm:p-8 flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {featuredBlog.category}
                    </span>
                    <span className="text-gray-300 dark:text-zinc-700">•</span>
                    <span className="text-xs text-gray-500 font-mono">
                      {new Date(featuredBlog.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <Link to={`/blog/${featuredBlog.slug}`}>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2">
                      {featuredBlog.title}
                    </h1>
                  </Link>
                  <p className="mt-3 text-sm sm:text-base text-gray-650 dark:text-zinc-450 line-clamp-3">
                    {featuredBlog.excerpt}
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-zinc-800/85 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={featuredBlog.author.avatar}
                      alt={featuredBlog.author.name}
                      className="w-10 h-10 rounded-full object-cover bg-gray-100"
                    />
                    <div>
                      <div className="text-sm font-semibold text-gray-905 dark:text-zinc-200">
                        {featuredBlog.author.name}
                      </div>
                      <div className="text-xs text-gray-500 font-medium">
                        @{featuredBlog.author.username}
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/blog/${featuredBlog.slug}`}
                    className="flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:gap-2 transition-all"
                  >
                    <span>Read Article</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Secondary Featured Items */}
          <div className="space-y-6">
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Editors Picks</span>
            </h2>
            
            {secondaryBlogs.length > 0 ? (
              secondaryBlogs.map((b) => (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl border border-gray-150 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-205 flex gap-4"
                >
                  <img
                    src={b.coverImage}
                    alt={b.title}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex flex-col justify-between flex-grow">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                        {b.category}
                      </span>
                      <Link to={`/blog/${b.slug}`}>
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mt-1 hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-2 transition-colors">
                          {b.title}
                        </h3>
                      </Link>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2">
                      <span className="font-semibold">{b.author.name}</span>
                      <span className="font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {b.readingTime || 3} min
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 text-center text-gray-500 text-sm">
                No Editor’s Picks available.
              </div>
            )}
          </div>
        </div>
      )}

      {/* FILTER & CATEGORY NAVIGATION BAR */}
      <div className="sticky top-0 z-10 bg-gray-50/80 dark:bg-zinc-950/85 backdrop-blur-lg border-b border-gray-200/60 dark:border-zinc-800/60 py-4 -mx-4 px-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all rounded-b-xl">
        {/* Categories sliding view */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none max-w-full">
          <Compass className="w-4.5 h-4.5 text-gray-400 flex-shrink-0 hidden sm:inline" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedTag('');
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-450 border border-gray-200/50 dark:border-zinc-800/80 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search submit & Sort order */}
        <div className="flex gap-2 items-center flex-shrink-0">
          <form onSubmit={handleSearchSubmit} className="relative flex-grow">
            <input
              type="text"
              placeholder="Search by keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 w-full md:w-56 text-xs bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 placeholder-zinc-400 border border-gray-200/60 dark:border-zinc-800/80 rounded-full focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all dark:bg-zinc-900"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </form>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 border border-gray-200/60 dark:border-zinc-800/80 rounded-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="views">Most Viewed</option>
            <option value="likes">Most Liked</option>
          </select>
        </div>
      </div>

      {/* RE-RENDER TAG INDICATOR */}
      {(selectedTag || searchQuery) && (
        <div className="flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-950/20 px-5 py-3 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30">
          <div className="flex gap-2 items-center text-xs text-indigo-800 dark:text-indigo-300">
            <span>Query Results:</span>
            {searchQuery && (
              <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 font-bold">
                Keywords: "{searchQuery}"
              </span>
            )}
            {selectedTag && (
              <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 font-bold">
                Tag: #{selectedTag}
              </span>
            )}
          </div>
          <button
            onClick={handleClearFilters}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* TRENDING CAROUSEL PANEL (Only on clear main feed) */}
      {blogs.length > 0 && selectedCategory === 'All' && !selectedTag && !searchQuery && (
        <div className="pt-4 border-t border-gray-200/60 dark:border-zinc-800/60">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            <span>Trending on BlogSphere</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingBlogs.map((b, idx) => (
              <div key={b.id} className="flex gap-4 group">
                <span className="text-3xl font-extrabold text-gray-200 dark:text-zinc-800/80 font-mono tracking-tighter leading-none">
                  0{idx + 1}
                </span>
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-semibold mb-1">
                      <img
                        src={b.author.avatar}
                        alt=""
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span>{b.author.name}</span>
                    </div>
                    <Link to={`/blog/${b.slug}`}>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                        {b.title}
                      </h3>
                    </Link>
                  </div>
                  <span className="text-[10.5px] text-gray-400 font-mono mt-1">
                    {new Date(b.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {b.readingTime || 3} min read
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRIMARY ARTICLES STREAM */}
      <div className="pt-6 border-t border-gray-200/60 dark:border-zinc-800/60">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">
          {selectedCategory !== 'All' ? `${selectedCategory} Articles` : 'Explore Latest Stories'}
        </h2>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
            <p className="text-xs text-gray-500 dark:text-zinc-450 font-mono">Curating catalog stories...</p>
          </div>
        ) : errorMsg ? (
          <div className="py-12 text-center text-red-500 flex flex-col items-center justify-center gap-2">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm font-semibold">{errorMsg}</p>
            <button onClick={fetchBlogs} className="text-xs text-indigo-600 mt-2 font-bold underline">
              Retry fetch
            </button>
          </div>
        ) : blogs.length === 0 ? (
          <div className="py-20 text-center text-gray-500 border border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl p-8">
            <Compass className="w-12 h-12 mx-auto text-gray-300 dark:text-zinc-700 mb-3" />
            <p className="font-semibold text-gray-700 dark:text-zinc-350">We found no articles fitting these tags</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Try adjusting your filter search query, clearing tag filters, or writing a draft of your own!
            </p>
            {(selectedCategory !== 'All' || selectedTag || searchQuery) && (
              <button
                onClick={handleClearFilters}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-full hover:bg-indigo-700 shadow-sm"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((b) => (
              <article
                key={b.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-150 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div>
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={b.coverImage}
                      alt={b.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                    <span className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 bg-black/45 dark:bg-zinc-900/65 backdrop-blur-sm text-white rounded-full">
                      {b.category}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2 font-mono text-[10.5px] text-gray-400">
                      <span>{new Date(b.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span>•</span>
                      <span>{b.readingTime || 3} min read</span>
                    </div>

                    <Link to={`/blog/${b.slug}`}>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                        {b.title}
                      </h3>
                    </Link>
                    
                    <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-zinc-450 line-clamp-2 leading-relaxed">
                      {b.excerpt}
                    </p>

                    {/* Tag bubbles */}
                    {b.tags && b.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {b.tags.map(t => (
                          <button
                            key={t}
                            onClick={() => setSelectedTag(t)}
                            className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded hover:bg-indigo-150 transition-colors"
                          >
                            #{t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card footer */}
                <div className="p-5 pt-0 border-t border-gray-100/70 dark:border-zinc-800/50 mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={b.author.avatar}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-gray-800 dark:text-zinc-200">
                        {b.author.name}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        @{b.author.username}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                    <span className="flex items-center gap-1" title="Views">
                      <Compass className="w-3.5 h-3.5" />
                      {b.views || 0}
                    </span>
                    <span className="flex items-center gap-0.5" title="Likes">
                      <Heart className="w-3.5 h-3.5" />
                      {b.likes?.length || 0}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default Home;
