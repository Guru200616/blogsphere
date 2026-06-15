import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Users, BookOpen, MessageSquare, AlertCircle, Trash2, ShieldAlert, CheckCircle, RefreshCcw, Eye, ShieldCheck, UserCheck } from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats, User, Blog, Comment, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

export const AdminDashboard: React.FC<{ triggerToast: (msg: string, isErr?: boolean) => void }> = ({ triggerToast }) => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<'analytics' | 'users' | 'blogs' | 'comments'>('analytics');
  
  const [isUpdatingUser, setIsUpdatingUser] = useState<string | null>(null);
  const [isDeletingBlog, setIsDeletingBlog] = useState<string | null>(null);

  useEffect(() => {
    // Role validation
    if (!token) {
      triggerToast('Authentication required.', true);
      navigate('/auth');
      return;
    }

    if (user && user.role !== 'Admin') {
      triggerToast('Access denied. Administrator privileges required.', true);
      navigate('/');
      return;
    }

    loadDashboardData();
  }, [token, user]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch stats
      const statsRes = await api.get<DashboardStats>('/admin/stats');
      setStats(statsRes.data);

      // Fetch users list
      const usersRes = await api.get<User[]>('/admin/users');
      setUsers(usersRes.data);

      // Fetch all blogs
      const blogsRes = await api.get<Blog[]>('/blogs', { params: { status: 'All' } });
      setBlogs(blogsRes.data);

      // Fetch comments list
      const commentsRes = await api.get<Comment[]>('/admin/comments');
      setComments(commentsRes.data);

    } catch (err: any) {
      triggerToast('Failed to compile administrative statistics.', true);
    } finally {
      setIsLoading(false);
    }
  };

  // User Actions
  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    setIsUpdatingUser(userId);
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      triggerToast('Authority access level modified successfully.');
      loadDashboardData(); // Refresh stats too
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Error updating role.', true);
    } finally {
      setIsUpdatingUser(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Delete this user? All associated writings and metrics will remain under author governance.')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
      triggerToast('User account successfully removed.');
      loadDashboardData();
    } catch (err) {
      triggerToast('Failed to delete account.', true);
    }
  };

  // Blog Actions
  const handleAdminDeleteBlog = async (blogId: string) => {
    if (!window.confirm('Administrative deletion: Purge this article from the database permanently? This action cannot be undone.')) return;
    setIsDeletingBlog(blogId);
    try {
      await api.delete(`/blogs/${blogId}`);
      setBlogs(blogs.filter(b => b.id !== blogId));
      triggerToast('Article successfully purged of references.');
      loadDashboardData();
    } catch (err) {
      triggerToast('Error purging article.', true);
    } finally {
      setIsDeletingBlog(null);
    }
  };

  // Comment Actions
  const handleAdminDeleteComment = async (commentId: string) => {
    if (!window.confirm('Moderate comment: delete this opinion and all its children?')) return;
    try {
      await api.delete(`/comments/${commentId}`);
      setComments(comments.filter(c => c.id !== commentId));
      triggerToast('Response flagged and moderated.');
      loadDashboardData();
    } catch (err) {
      triggerToast('Error during comment moderating.', true);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="py-24 text-center">
        <RefreshCcw className="w-8 h-8 animate-spin mx-auto text-indigo-650 mb-3" />
        <p className="text-xs text-gray-450 font-mono">Assembling admin console metric engines...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <ShieldAlert className="w-6 h-6 text-indigo-600" />
            <span>HQ Administrative Core Command</span>
          </h1>
          <p className="text-xs text-gray-455">Platform governance, user controls, analytical dashboards, and response moderation.</p>
        </div>

        {/* REFRESH CORE BUTTON */}
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 text-xs font-bold rounded-lg border bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 flex items-center gap-1.5 transition-all select-none cursor-pointer"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>Sync Core Data</span>
        </button>
      </div>

      {/* METRIC CARD STATS MATRIX */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl border border-gray-150/80 dark:border-zinc-800/80 bg-white/75 dark:bg-zinc-900/60 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-450 uppercase font-black tracking-wider mb-2">
            <span>Total Accounts</span>
            <Users className="w-4.5 h-4.5 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-gray-950 dark:text-white">{stats.totalUsers}</div>
          <div className="text-[10.5px] mt-1 text-emerald-600 font-semibold">● Live growth tracked</div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl border border-gray-150/80 dark:border-zinc-800/80 bg-white/75 dark:bg-zinc-900/60 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-450 uppercase font-black tracking-wider mb-2">
            <span>Total Articles</span>
            <BookOpen className="w-4.5 h-4.5 text-sky-505" />
          </div>
          <div className="text-2xl font-extrabold text-gray-950 dark:text-white">{stats.totalBlogs}</div>
          <p className="text-[10.5px] mt-1 text-gray-400">Published, drafts, & archives</p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl border border-gray-150/80 dark:border-zinc-800/80 bg-white/75 dark:bg-zinc-900/60 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-450 uppercase font-black tracking-wider mb-2">
            <span>Aggregated Views</span>
            <Eye className="w-4.5 h-4.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-gray-950 dark:text-white">{stats.totalViews}</div>
          <p className="text-[10.5px] mt-1 text-emerald-600 font-semibold">+18.5% weekly increments</p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl border border-gray-150/80 dark:border-zinc-800/80 bg-white/75 dark:bg-zinc-900/60 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-450 uppercase font-black tracking-wider mb-2">
            <span>Pruned Responses</span>
            <MessageSquare className="w-4.5 h-4.5 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-gray-950 dark:text-white">{stats.totalComments}</div>
          <p className="text-[10.5px] mt-1 text-gray-405">Total feedback comments logged</p>
        </div>
      </div>

      {/* ADMIN NAVIGATION SWIFT BAR */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-gray-200/60 dark:border-zinc-800/60">
        <button
          onClick={() => setActiveSection('analytics')}
          className={`px-4 py-2 rounded-lg text-xs font-bold tracking-tight whitespace-nowrap transition-all ${
            activeSection === 'analytics'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
          }`}
        >
          Visual Analytics Console
        </button>

        <button
          onClick={() => setActiveSection('users')}
          className={`px-4 py-2 rounded-lg text-xs font-bold tracking-tight whitespace-nowrap transition-all ${
            activeSection === 'users'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
          }`}
        >
          Manage User Privileges ({users.length})
        </button>

        <button
          onClick={() => setActiveSection('blogs')}
          className={`px-4 py-2 rounded-lg text-xs font-bold tracking-tight whitespace-nowrap transition-all ${
            activeSection === 'blogs'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
          }`}
        >
          Content Surveillance ({blogs.length})
        </button>

        <button
          onClick={() => setActiveSection('comments')}
          className={`px-4 py-2 rounded-lg text-xs font-bold tracking-tight whitespace-nowrap transition-all ${
            activeSection === 'comments'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
          }`}
        >
          Moderate Comments ({comments.length})
        </button>
      </div>

      {/* CORE WORKSPACE SECTIONS */}
      <div className="space-y-4">
        {/* SECTION 1: ANALYTICS CONSOLE (HIGH-FIDELITY CUSTOM SVG CHARTS) */}
        {activeSection === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visual Chart A: Monthly Posts Line Area Chart */}
            <div className="p-5 rounded-2xl border border-gray-150 dark:border-zinc-800/80 bg-white/75 dark:bg-zinc-900/60 backdrop-blur shadow-sm space-y-4">
              <div>
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Monthly Post Frequencies</h3>
                <p className="text-[11px] text-gray-450 leading-none mt-1">Timeline representation of story publication cycles</p>
              </div>
              <div className="h-60 w-full relative">
                {/* SVG Area Chart */}
                <svg className="w-full h-full overflow-visible" viewBox="0 0 400 180" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="400" y2="30" className="stroke-gray-100 dark:stroke-zinc-800" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="80" x2="400" y2="80" className="stroke-gray-100 dark:stroke-zinc-800" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="130" x2="400" y2="130" className="stroke-gray-100 dark:stroke-zinc-800" strokeWidth="1" strokeDasharray="3 3" />
                  {/* Bottom Line */}
                  <line x1="0" y1="160" x2="400" y2="160" className="stroke-gray-300 dark:stroke-zinc-700" strokeWidth="1.5" />
                  
                  {/* Gradient Area path */}
                  <path
                    d="M 10 160 Q 80 120 120 100 T 230 40 T 320 120 T 390 140 L 390 160 L 10 160 Z"
                    fill="url(#indigoGrad)"
                    className="opacity-20 dark:opacity-10"
                  />
                  {/* Wave Spline path */}
                  <path
                    d="M 10 160 Q 80 120 120 100 T 230 40 T 320 120 T 390 140"
                    fill="none"
                    className="stroke-indigo-600 dark:stroke-indigo-400"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Datapoint coordinates dots */}
                  <circle cx="10" cy="160" r="4.5" className="fill-indigo-600" />
                  <circle cx="120" cy="100" r="4.5" className="fill-indigo-600" />
                  <circle cx="230" cy="40" r="4.5" className="fill-indigo-600" />
                  <circle cx="320" cy="120" r="4.5" className="fill-indigo-600" />
                  <circle cx="390" cy="140" r="4.5" className="fill-indigo-600" />

                  {/* SVG Definitions */}
                  <defs>
                    <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Horizontal label tags */}
                <div className="absolute bottom-1 w-full flex justify-between text-[9px] font-mono text-gray-400 px-1">
                  <span>Jan-Apr</span>
                  <span>May</span>
                  <span>June (Launch)</span>
                  <span>July (Proj)</span>
                </div>
              </div>
            </div>

            {/* Visual Chart B: Popular Categories Coverage Distribution */}
            <div className="p-5 rounded-2xl border border-gray-150 dark:border-zinc-800/80 bg-white/75 dark:bg-zinc-900/60 backdrop-blur shadow-sm space-y-4">
              <div>
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Active Catalog Categories</h3>
                <p className="text-[11px] text-gray-450 leading-none mt-1">Relative article distribution percentage by niche</p>
              </div>

              {/* Horizontal fill bars */}
              <div className="space-y-3.5 pt-2">
                {stats.popularCategories && stats.popularCategories.length > 0 ? (
                  stats.popularCategories.map((c, idx) => {
                    const totalPoints = stats.totalBlogs || 1;
                    const percent = Math.round((c.count / totalPoints) * 100);
                    const barColors = ['bg-indigo-600', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
                    const color = barColors[idx % barColors.length];

                    return (
                      <div key={c.name} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-gray-700 dark:text-zinc-350">
                          <span>{c.name}</span>
                          <span className="font-mono">{c.count} Articles ({percent}%)</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-center text-gray-400 py-10">No categories recorded yet.</p>
                )}
              </div>
            </div>

            {/* Visual Chart C: User Signup Growth Splines */}
            <div className="p-5 rounded-2xl border border-gray-150 dark:border-zinc-800/80 bg-white/75 dark:bg-zinc-900/60 backdrop-blur shadow-sm space-y-4 lg:col-span-2">
              <div>
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Dynamic User Accounts Accretion Spline</h3>
                <p className="text-[11px] text-gray-450 leading-none mt-1">Accumulated customer signups tracking line</p>
              </div>

              <div className="h-56 w-full relative">
                {/* SVG Line Chart */}
                <svg className="w-full h-full overflow-visible" viewBox="0 0 600 150" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="600" y2="30" className="stroke-gray-100 dark:stroke-zinc-850" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="65" x2="600" y2="65" className="stroke-gray-100 dark:stroke-zinc-850" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="100" x2="600" y2="100" className="stroke-gray-100 dark:stroke-zinc-850" strokeWidth="1" strokeDasharray="4 4" />
                  {/* Bottom Line */}
                  <line x1="0" y1="140" x2="600" y2="140" className="stroke-gray-300 dark:stroke-zinc-700" strokeWidth="1.5" />
                  
                  {/* Smooth wave line */}
                  <path
                    d="M 10 130 S 150 100 200 80 S 350 40 450 30 S 550 10 590 10"
                    fill="none"
                    className="stroke-emerald-500"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Dot anchors */}
                  <circle cx="10" cy="130" r="5" className="fill-emerald-500 stroke-white dark:stroke-zinc-900" strokeWidth="1.5" />
                  <circle cx="200" cy="80" r="5" className="fill-emerald-500 stroke-white dark:stroke-zinc-900" strokeWidth="1.5" />
                  <circle cx="450" cy="30" r="5" className="fill-emerald-500 stroke-white dark:stroke-zinc-900" strokeWidth="1.5" />
                  <circle cx="590" cy="10" r="5" className="fill-emerald-500 stroke-white dark:stroke-zinc-900" strokeWidth="1.5" />
                </svg>

                {/* Vertical indicators overlay */}
                <div className="absolute bottom-1 w-full flex justify-between text-[8px] font-mono text-gray-400 px-2">
                  <span>June 1</span>
                  <span>June 5</span>
                  <span>June 10</span>
                  <span>June 15 (Active)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: MANAGE USER PRIVILEGES (RBAC TABLE) */}
        {activeSection === 'users' && (
          <div className="rounded-2xl border border-gray-150 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 dark:bg-zinc-800/50 text-[10.5px] font-black uppercase tracking-wider text-gray-450 border-b">
                  <tr>
                    <th className="p-4">Staff details</th>
                    <th className="p-4">Contact email</th>
                    <th className="p-4 text-center">Auth privilege scope (RBAC)</th>
                    <th className="p-4 text-right">Database control action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                  {users.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-850/30 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <img src={item.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                        <div>
                          <p className="font-extrabold text-gray-901 dark:text-zinc-200">{item.name}</p>
                          <p className="text-[10.5px] text-gray-400 font-mono">@{item.username}</p>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-gray-600 dark:text-zinc-400">{item.email}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isUpdatingUser === item.id ? (
                            <span className="text-[10px] text-gray-400 animate-pulse">Syncing...</span>
                          ) : (
                            <select
                              value={item.role}
                              disabled={item.id === user?.id} // Cannot demote self
                              onChange={(e) => handleUpdateRole(item.id, e.target.value as UserRole)}
                              className="px-2.5 py-1 rounded bg-gray-50 dark:bg-zinc-950 border text-[11px] font-bold text-gray-850 dark:text-zinc-200 outline-none"
                            >
                              <option value="Reader">Reader</option>
                              <option value="Author">Author</option>
                              <option value="Admin">Admin</option>
                            </select>
                          )}
                          {item.id === user?.id && <span className="text-[9px] text-gray-400 font-bold uppercase shrink-0">(Self)</span>}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(item.id)}
                          disabled={item.id === user?.id} // Cannot delete self
                          className="px-2.5 py-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-40 transition-all font-semibold"
                          title="Purge user account"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 3: CONTENT SURVEILLANCE TABLE */}
        {activeSection === 'blogs' && (
          <div className="rounded-2xl border border-gray-150 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 dark:bg-zinc-800/50 text-[10.5px] font-black uppercase tracking-wider text-gray-450 border-b">
                  <tr>
                    <th className="p-4">Post title</th>
                    <th className="p-4">Author details</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Engagement views</th>
                    <th className="p-4 text-right">Mod actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                  {blogs.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-850/30 transition-colors">
                      <td className="p-4 max-w-sm">
                        <Link to={`/blog/${item.slug}`} className="font-extrabold text-gray-901 dark:text-zinc-200 hover:text-indigo-600 line-clamp-2">
                          {item.title}
                        </Link>
                        <p className="text-[10px] text-indigo-500 uppercase font-black mt-1">{item.category}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-gray-800 dark:text-zinc-350">{item.author?.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">@{item.author?.username}</p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                          item.status === 'Published'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-850 dark:bg-amber-950/20 dark:text-amber-400'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-gray-700 dark:text-zinc-400">
                        {item.views || 0}
                      </td>
                      <td className="p-4 text-right">
                        {isDeletingBlog === item.id ? (
                          <span className="text-[10px] text-gray-400 animate-pulse">Flagging...</span>
                        ) : (
                          <button
                            onClick={() => handleAdminDeleteBlog(item.id)}
                            className="px-2.5 py-1.5 rounded-lg text-red-550 hover:bg-red-50 dark:hover:bg-red-950/35 transition-all font-semibold"
                            title="Purge post content"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {blogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400">No blog posts registered.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 4: MODERATE COMMENTS */}
        {activeSection === 'comments' && (
          <div className="rounded-2xl border border-gray-150 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 dark:bg-zinc-800/50 text-[10.5px] font-black uppercase tracking-wider text-gray-455 border-b">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Feedback comment text</th>
                    <th className="p-4">Date stamp</th>
                    <th className="p-4 text-right">Governance Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-850">
                  {comments.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-850/30 transition-colors">
                      <td className="p-4 space-y-1">
                        <p className="font-extrabold text-gray-901 dark:text-zinc-200">{item.user?.name}</p>
                        <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-zinc-850 text-gray-450 font-black uppercase font-mono">
                          {item.user?.role}
                        </span>
                      </td>
                      <td className="p-4 max-w-md">
                        <p className="text-gray-750 dark:text-zinc-350 line-clamp-3 leading-relaxed whitespace-pre-wrap">{item.comment}</p>
                      </td>
                      <td className="p-4 font-mono text-gray-500 text-[11px]">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleAdminDeleteComment(item.id)}
                          className="px-2.5 py-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all font-semibold"
                          title="Purge inappropriate comment"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {comments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-400">Discussion threads are empty. No moderation necessary!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
