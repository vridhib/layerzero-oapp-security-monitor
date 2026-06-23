'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { AlertTriangle, Loader2, Lock, Mail, Shield, User } from 'lucide-react';
import Link from 'next/link';

/**
 * Registration page for the LayerZero OApp Configuration Monitor.
 * 
 * Allows users to create an account by submitting a username, email, and 
 * password. On successful registration it:
 * 1. Calls the Django user registration endpoint (`/api/auth/users/`).
 * 2. Automatically logs the user in by calling the JWT endpoint with the 
 *    submitted credentials.
 * 3. Redirects the user to the `/user-dashboard` route.
 * 
 * @component
 * @requires useAuth - Authentication context for auto-login after registration.
 * @requires useRouter - Next.js navigation for post-registration redirect.
 * @returns The rendered registration page.
 * 
 * @see {@link Login} for the login page.
 * @see {@link useAuth} for the authentication context.
 */
export default function Register() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear errors on input change
  useEffect(() => {
    if (error) setError('');
  }, [username, password]);

  // Register and auto-login user
  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/users/', { username, password, email });
      const res = await api.post('auth/jwt/create/', { username, password });
      login(res.data.access, res.data.refresh);
      router.push('/user-dashboard');
    }
    catch (err: any) {
      const data = err.response?.data;
      const msg = data?.username?.[0] || data?.email?.[0] || data?.password?.[0] || 'Registration failed';
      setError(msg);
    }
    finally {
      setLoading(false);
    }
  }

  // Render UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-950 px-4">
      <div className="w-full max-w-md">
        {/* Card with Subtle Glow */}
        <div className="relative bg-indigo-900/60 backdrop-blur-sm border border-indigo-700/50 rounded-2xl shadow-2xl shadow-indigo-900/30 p-8">
          {/* Decorative Top Accent */}
          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" />

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 mb-4">
              <Shield className="h-7 w-7 text-violet-400" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Create Account</h2>
            <p className="text-indigo-300 text-sm mt-1">Start monitoring your OApps</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-900/40 border border-red-700/50 text-red-200 p-3 rounded-xl text-sm flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-indigo-200 text-xs font-semibold tracking-wider uppercase mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-indigo-800/50 border border-indigo-700/50 text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                  placeholder="Choose a username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-indigo-200 text-xs font-semibold tracking-wider uppercase mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-indigo-800/50 border border-indigo-700/50 text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-indigo-200 text-xs font-semibold tracking-wider uppercase mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-indigo-800/50 border border-indigo-700/50 text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                  placeholder="Create a strong password"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-600/20 hover:shadow-violet-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-indigo-300 mt-6 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}