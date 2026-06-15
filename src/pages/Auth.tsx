import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogIn, Mail, Lock, UserCheck, Shield, KeyRound, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Auth: React.FC<{ triggerToast: (msg: string, isErr?: boolean) => void }> = ({ triggerToast }) => {
  const navigate = useNavigate();
  const { login, register, token, isLoading } = useAuth();

  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Reader', // Default Role selection option
    rememberMe: false
  });

  useEffect(() => {
    // If already logged in, redirect to home
    if (token) {
      navigate('/');
    }
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (isLoginMode) {
        // LOGIN
        if (!formData.email || !formData.password) {
          setErrorMsg('Please input both your email and password.');
          setIsSubmitting(false);
          return;
        }

        await login(formData.email, formData.password);
        triggerToast('Welcome back to BlogSphere! Login successful.');
        navigate('/');
      } else {
        // REGISTER
        if (!formData.name || !formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
          setErrorMsg('All registration fields are required.');
          setIsSubmitting(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setErrorMsg('Confirmation password does not match.');
          setIsSubmitting(false);
          return;
        }

        if (formData.password.length < 6) {
          setErrorMsg('Password must contain at least 6 characters.');
          setIsSubmitting(false);
          return;
        }

        await register({
          name: formData.name,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          role: formData.role
        });

        triggerToast('Congratulations! Your BlogSphere account is ready.');
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Authentication error. Please re-check validation fields.';
      setErrorMsg(msg);
      triggerToast(msg, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      triggerToast('Please type your Email address in the email field first.', true);
      setErrorMsg('Type your email address above, then click Forgot Password again.');
      return;
    }

    try {
      triggerToast('Sending password recovery credentials...');
      const response = await login(formData.email, 'forgot-pwd-dummy-trigger-xyz'); // It will catch but let's send real forgot API
    } catch (err: any) {
      // Direct call forgot API
      try {
        const response = await api.post('/auth/forgot-password', { email: formData.email });
        triggerToast(response.data.message);
        setErrorMsg('');
      } catch (e: any) {
        triggerToast(e.response?.data?.message || 'Error processing request.', true);
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 py-12">
      {/* AUTH CARD (Glassmorphism look) */}
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl border border-gray-150/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex flex-col items-center justify-center space-y-2 mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md text-xl font-black tracking-tight select-none">
            B
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {isLoginMode ? 'Welcome back to BlogSphere' : 'Join our author collective'}
          </h1>
          <p className="text-xs text-gray-500 max-w-[280px]">
            {isLoginMode 
              ? 'Read, write, edit, and orchestrate knowledge instantly.' 
              : 'Write beautiful articles, track view counts, and accumulate followers.'}
          </p>
        </div>

        {/* Error Notification Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 flex items-start gap-2 text-xs text-red-650 dark:text-red-400">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <p className="font-medium leading-normal">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {!isLoginMode && (
            <>
              {/* Full Name input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 dark:text-zinc-400">Your Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    required
                    maxLength={50}
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border bg-gray-50/50 dark:bg-zinc-950/65 text-gray-900 dark:text-zinc-100 placeholder-zinc-450 border-gray-200 dark:border-zinc-850 focus:outline-none"
                  />
                  <UserRoleSelectorIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                </div>
              </div>

              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 dark:text-zinc-400">Username</label>
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    required
                    maxLength={30}
                    placeholder="e.g. johndoe_codes"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border bg-gray-50/50 dark:bg-zinc-950/65 text-gray-900 dark:text-zinc-100 placeholder-zinc-450 border-gray-200 dark:border-zinc-850 focus:outline-none"
                  />
                  <span className="text-xs text-gray-400 font-bold absolute left-3.5 top-3">@</span>
                </div>
              </div>
            </>
          )}

          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 dark:text-zinc-400">Email Address</label>
            <div className="relative">
              <input
                type="email"
                name="email"
                required
                placeholder="e.g. john@company.com"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border bg-gray-50/50 dark:bg-zinc-950/65 text-gray-900 dark:text-zinc-100 placeholder-zinc-450 border-gray-200 dark:border-zinc-850 focus:outline-none"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-600 dark:text-zinc-400">Security Password</label>
              {isLoginMode && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10.5px] font-semibold text-indigo-600 hover:underline"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="password"
                name="password"
                required
                minLength={6}
                placeholder="••••••"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border bg-gray-50/50 dark:bg-zinc-950/65 text-gray-900 dark:text-zinc-100 placeholder-zinc-450 border-gray-200 dark:border-zinc-850 focus:outline-none"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {!isLoginMode && (
            <>
              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 dark:text-zinc-400">Confirm Security Password</label>
                <div className="relative">
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    placeholder="••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border bg-gray-50/50 dark:bg-zinc-950/65 text-gray-900 dark:text-zinc-100 placeholder-zinc-450 border-gray-200 dark:border-zinc-850 focus:outline-none"
                  />
                  <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                </div>
              </div>

              {/* Start Role Select Option */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 dark:text-zinc-400 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Choose Starting Account Role</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full text-xs p-2.5 rounded-xl border bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 border-gray-200 dark:border-zinc-850 outline-none"
                >
                  <option value="Reader">Reader (Can read, rate, bookmark, and publish comments)</option>
                  <option value="Author">Author (Can draft and compile full blog articles, follow others)</option>
                  <option value="Admin">Admin (Full administrative dashboard, content governance and pruning)</option>
                </select>
                <p className="text-[10px] text-gray-400">Role-Based Access Control filters will adapt your permission scopes immediately.</p>
              </div>
            </>
          )}

          {/* Remember Me switch */}
          {isLoginMode && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                className="w-4 h-4 rounded text-indigo-600 border-gray-200"
              />
              <label htmlFor="rememberMe" className="text-xs text-gray-500 font-medium select-none cursor-pointer">
                Remember my session credentials
              </label>
            </div>
          )}

          {/* Core Actions Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
          >
            <LogIn className="w-4 h-4" />
            <span>{isSubmitting ? 'Authenticating credentials...' : isLoginMode ? 'Access account' : 'Generate writer profile'}</span>
          </button>
        </form>

        {/* Auth mode toggle footer */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-zinc-850 text-center text-xs">
          <p className="text-gray-500 font-medium">
            {isLoginMode ? "New to BlogSphere's reader group?" : 'Already a registered user?'}
            {' '}
            <button
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setErrorMsg('');
              }}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline ml-1"
            >
              {isLoginMode ? 'Generate account' : 'Enter existing account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// Simple visual fallback icon
const UserRoleSelectorIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

import { api } from '../services/api';
