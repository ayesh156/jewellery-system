import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Loader2, Lock, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(username.trim().toLowerCase(), password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Animated gold particles */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/3 rounded-full blur-3xl" />
        </div>

        {/* Gold ring decorative lines */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-80 h-80 rounded-full border border-amber-500/10 animate-[spin_30s_linear_infinite]" />
          <div className="absolute w-64 h-64 rounded-full border border-amber-500/15 animate-[spin_25s_linear_infinite_reverse]" />
          <div className="absolute w-48 h-48 rounded-full border border-amber-500/20 animate-[spin_20s_linear_infinite]" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-16">
          {/* Logo */}
          <div className="mb-10">
            <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl shadow-amber-500/20 rotate-12 hover:rotate-0 transition-transform duration-500">
              <img src="/logo.jpg" alt="Onelka Jewellery" className="w-full h-full object-cover" />
            </div>
          </div>

          <h1 className="text-5xl font-bold text-white tracking-tight mb-3">
            Onelka
          </h1>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-500/50" />
            <p className="text-amber-400/80 text-lg font-light tracking-[0.3em] uppercase">
              Jewellery
            </p>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-500/50" />
          </div>

          <p className="text-slate-400 text-center max-w-sm leading-relaxed">
            Exquisite Craftsmanship Since 1985
          </p>

          {/* Features */}
          <div className="mt-16 space-y-4 w-full max-w-xs">
            {[
              'Inventory & Product Management',
              'Sales & Invoice Tracking',
              'Business Analytics & Reports',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-slate-500">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom attribution */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} Onelka Jewellery &middot; All Rights Reserved
          </p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 relative">
        {/* Mobile logo */}
        <div className="lg:hidden absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden">
            <img src="/logo.jpg" alt="Onelka" className="w-full h-full object-cover" />
          </div>
          <span className="text-xl font-bold text-slate-800 dark:text-white">Onelka</span>
        </div>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Sign in to your account to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Alert */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm flex items-center gap-3">
                <div className="w-8 h-8 shrink-0 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                {error}
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  autoFocus
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-600">
            Onelka Jewellery System
          </p>
        </div>
      </div>
    </div>
  );
}
