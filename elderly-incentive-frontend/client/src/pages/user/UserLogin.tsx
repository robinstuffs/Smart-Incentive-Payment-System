import React, { useState } from 'react';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle, Lock, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function UserLogin() {
  const { login } = useUserAuth();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    try {
      await login(username, password);
      toast.success('Login successful! Redirecting to dashboard...');
      setLocation('/user/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Invalid credentials. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">

      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
      </div>


      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-900/30">
              <span className="text-xl font-bold text-white">SI</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Smart Incentive</h1>
          <p className="text-sm text-slate-400">User Portal</p>
        </div>

        {/* Card */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl shadow-black/40">
          <div className="p-8">
            <div className="mb-6">
                    {/* Back to home */}
      <button
        onClick={() => setLocation('/')}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-sm text-black hover:text-shadow-cyan-400 transition-colors z-20"
      >
        <ArrowLeft size={16} />
        Back to home
      </button>
              <h2 className="text-xl font-bold text-slate-900">Welcome back</h2>
              <p className="text-sm text-slate-500 mt-1">Sign in to your account to continue</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex gap-2.5">
                <AlertCircle className="text-rose-500 flex-shrink-0 mt-0.5" size={16} />
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="username" className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username or email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    className="pl-9 h-10 text-sm border-slate-200 focus:border-cyan-500 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-9 h-10 text-sm border-slate-200 focus:border-cyan-500 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 mt-2 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-cyan-900/20"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">
                Don't have an account?{' '}
                <button
                  onClick={() => setLocation('/user/register')}
                  className="text-cyan-600 hover:text-cyan-700 font-semibold transition-colors"
                >
                  Register now
                </button>
              </p>
            </div>
          </div>
        </Card>

        <p className="text-center text-slate-500 text-xs mt-6">
          Smart Incentive Payment System for Elderly Citizens
        </p>
      </div>
    </div>
  );
}