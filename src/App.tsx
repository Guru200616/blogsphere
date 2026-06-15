import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Compass, BookOpen, PenTool, LayoutDashboard, User as UserIcon, LogOut, Moon, Sun, AlertCircle, Info, Sparkles, X, Menu } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Home } from './pages/Home';
import { BlogDetail } from './pages/BlogDetail';
import { WriteBlog } from './pages/WriteBlog';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/AdminDashboard';
import { Auth } from './pages/Auth';

function Navigation() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-gray-150/80 dark:border-zinc-850/80 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo Brand */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-base shadow-sm group-hover:scale-105 transition-all">
                B
              </div>
              <span className="text-lg font-black tracking-tighter text-gray-905 dark:text-white select-none">
                Blog<span className="text-indigo-600 dark:text-indigo-400 font-extrabold">Sphere</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold">
            <Link
              to="/"
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full transition-all ${
                isActive('/') 
                  ? 'bg-gray-100 dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400' 
                  : 'text-gray-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Explore</span>
            </Link>

            {/* Author / Admin compose shortcuts */}
            {token && (user?.role === 'Admin' || user?.role === 'Author') && (
              <Link
                to="/write"
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full transition-all ${
                  isActive('/write') 
                    ? 'bg-gray-100 dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <PenTool className="w-4 h-4" />
                <span>Write Story</span>
              </Link>
            )}

            {/* Admin-only dash shortcuts */}
            {token && user?.role === 'Admin' && (
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full transition-all ${
                  isActive('/admin') 
                    ? 'bg-gray-100 dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Admin HQ</span>
              </Link>
            )}
          </div>

          {/* User Session Action Area */}
          <div className="hidden md:flex items-center gap-4">
            {token && user ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="flex items-center gap-2 group hover:opacity-90">
                  <span className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                    {user.name.split(' ')[0]}
                  </span>
                  <img
                    src={user.avatar}
                    alt=""
                    className="w-8 h-8 rounded-full border border-gray-150 object-cover group-hover:border-indigo-500 transition-colors bg-gray-100"
                  />
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-450 hover:text-red-650 rounded-full transition-colors flex items-center justify-center"
                  title="Sign Out Session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="px-5 py-2 rounded-full font-bold text-xs bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile menu triggers */}
          <div className="md:hidden flex items-center gap-3">
            {token && user && (
              <Link to="/profile">
                <img src={user.avatar} className="w-8 h-8 rounded-full object-cover border" />
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE EXPANSE DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-150 bg-white dark:bg-zinc-950 p-4 space-y-3 flex flex-col text-sm font-semibold text-gray-650 dark:text-zinc-400">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-indigo-600">
            Explore Feed
          </Link>
          {token && (user?.role === 'Admin' || user?.role === 'Author') && (
            <Link to="/write" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-indigo-600">
              Draft Story
            </Link>
          )}
          {token && user?.role === 'Admin' && (
            <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-indigo-600">
              Admin Governance Dashboard
            </Link>
          )}
          {token && user && (
            <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-indigo-600">
              My Profile Portfolio
            </Link>
          )}
          
          <div className="pt-2 border-t flex justify-between items-center">
            {token ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full py-2 bg-red-50 text-red-650 font-bold dark:bg-red-950/10 rounded-lg text-center"
              >
                Sign Out Account
              </button>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg text-center shadow-sm block"
              >
                Sign In Session
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(localStorage.getItem('theme') === 'dark');

  // Unified absolute Toast States
  const [toastText, setToastText] = useState<string>('');
  const [toastIsError, setToastIsError] = useState<boolean>(false);
  const [toastTimer, setToastTimer] = useState<any>(null);

  const triggerToast = (message: string, isErr?: boolean) => {
    if (toastTimer) clearTimeout(toastTimer);
    setToastText(message);
    setToastIsError(!!isErr);

    const timer = setTimeout(() => {
      setToastText('');
    }, 4500);
    setToastTimer(timer);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <AuthProvider>
      <HashRouter>
        <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col justify-between transition-colors duration-200">
          <div>
            {/* Navigation Header */}
            <Navigation />

            {/* Core Routed Workspace pages */}
            <main className="pb-16">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/blog/:idOrSlug" element={<BlogDetail triggerToast={triggerToast} />} />
                <Route path="/write" element={<WriteBlog triggerToast={triggerToast} />} />
                <Route path="/write/:id" element={<WriteBlog triggerToast={triggerToast} />} />
                <Route path="/profile" element={<Profile triggerToast={triggerToast} />} />
                <Route path="/admin" element={<AdminDashboard triggerToast={triggerToast} />} />
                <Route path="/auth" element={<Auth triggerToast={triggerToast} />} />
                <Route path="*" element={<Home />} className="hidden" />
              </Routes>
            </main>
          </div>

          {/* Elegant Footer details */}
          <footer className="bg-white dark:bg-zinc-950/80 border-t border-gray-150/60 dark:border-zinc-850/60 py-8 text-center text-xs text-gray-400 select-none transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 space-y-3">
              <div className="flex items-center justify-center gap-6">
                <Link to="/" className="hover:text-indigo-650">Discover catalog</Link>
                <span>•</span>
                <button onClick={() => setDarkMode(!darkMode)} className="hover:text-indigo-650 flex items-center gap-1 font-semibold">
                  {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400 fill-current" /> : <Moon className="w-3.5 h-3.5 text-zinc-500 fill-current" />}
                  <span>Toggle {darkMode ? 'Day Mode' : 'Night Shade'}</span>
                </button>
              </div>
              <p className="font-semibold text-[11px] text-gray-500">BlogSphere Full Stack CMS Application Core.</p>
              <p className="text-[10px] text-gray-400">Manufactured for GitHub archives, software developer placements, and portfolios. Powered by Node & React.</p>
            </div>
          </footer>

          {/* FLOATING CORNER PLANNED NOTIFICATION TOAST CARD */}
          {toastText && (
            <div className="fixed bottom-5 right-5 z-50 p-4 border rounded-2xl shadow-xl max-w-sm flex items-start gap-2.5 animate-bounce-short transition-all duration-300 bg-white dark:bg-zinc-900 border-gray-200/80 dark:border-zinc-800">
              {toastIsError ? (
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-grow">
                <p className="text-xs font-bold text-gray-900 dark:text-white">Notification Alert</p>
                <p className="text-[11px] text-gray-500 leading-normal mt-0.5">{toastText}</p>
              </div>
              <button onClick={() => setToastText('')} className="p-1 rounded hover:bg-gray-100">
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          )}
        </div>
      </HashRouter>
    </AuthProvider>
  );
}
