import React, { useState } from 'react';
import { Lock, Mail, User, ArrowRight } from 'lucide-react';
import CrownLogo from '../../assets/Logo';
import { useApp } from '../../hooks/useApp';

export default function LoginPage() {
  const { signInUser, signUpUser, updateSettings } = useApp();

  const [mode, setMode] = useState('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const profile = await signInUser(email.trim(), password);
        if (profile?.displayName) {
          await updateSettings({ displayName: profile.displayName });
        }
      } else {
        const nameToUse = displayName.trim() || email.split('@')[0] || 'Crown User';
        await signUpUser(email.trim(), password, nameToUse);
        await updateSettings({ displayName: nameToUse });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-crown-bg text-crown-text flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-crown-card shadow-card border border-crown-border">
            <CrownLogo size={54} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-crown-navy">
            CROWN HABIT
          </h1>
          <p className="text-xs font-bold tracking-widest text-crown-muted uppercase">
            RESET. TRACK. IMPROVE.
          </p>
        </div>

        <div className="bg-crown-card border border-crown-border rounded-xl p-6 shadow-elevated space-y-5">
          <div className="grid grid-cols-2 rounded-xl bg-crown-input p-1 border border-crown-border">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                mode === 'login'
                  ? 'bg-crown-blue text-white shadow-xs'
                  : 'text-crown-muted hover:text-crown-text'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                mode === 'register'
                  ? 'bg-crown-blue text-white shadow-xs'
                  : 'text-crown-muted hover:text-crown-text'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-crown-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-crown-text mb-1">
                  Your Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-crown-muted absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g., Prince"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-crown-input border border-crown-border text-sm text-crown-text focus:outline-none focus:border-crown-blue"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-crown-text mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-crown-muted absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-crown-input border border-crown-border text-sm text-crown-text focus:outline-none focus:border-crown-blue"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-crown-text mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-crown-muted absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-crown-input border border-crown-border text-sm text-crown-text focus:outline-none focus:border-crown-blue"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-crown-blue text-white text-sm font-bold shadow-xs hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>
                {loading
                  ? 'Signing in...'
                  : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
