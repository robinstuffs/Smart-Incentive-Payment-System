import React, { useState } from 'react';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Lock, User, Mail, ArrowRight, AtSign, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function UserRegister() {
  const { register } = useUserAuth();
  const [, setLocation] = useLocation();
  const [surname, setSurname] = useState('');
  const [firstname, setFirstname] = useState('');
  const [middlename, setMiddlename] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!surname.trim() || !firstname.trim() || !username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('All required fields must be filled');
      return false;
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await register(surname, firstname, middlename, username, email, password);
      toast.success('Registration successful! Redirecting to login...');
      setTimeout(() => setLocation('/user/login'), 1500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'pl-10 h-10 text-sm border-slate-200 bg-slate-50 focus:bg-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-lg transition-all duration-150';

  const sectionLabel = (text: string) => (
    <div className="flex items-center gap-2 my-4">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
        {text}
      </span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-16 right-16 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-16 left-16 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-[460px]">
        {/* Logo */}
        <div className="text-center mb-7">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-teal-600 rounded-[14px] flex items-center justify-center shadow-lg">
              <span className="text-xl font-bold tracking-tight text-white">SI</span>
            </div>
          </div>
          <h1 className="text-[22px] font-semibold text-white mb-1">Smart Incentive</h1>
          <p className="text-sm text-slate-400">Create your account to get started</p>
        </div>

        {/* Card */}
        <div className="bg-white/97 backdrop-blur-sm rounded-[18px] shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
          {/* Card header */}
          <div className="px-7 pt-6 pb-0">
            <h2 className="text-lg font-semibold text-slate-900 mb-0.5">Register</h2>
            <p className="text-[13px] text-slate-500">
              Fill in your details. Fields marked <span className="inline-flex items-center text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded px-1.5 py-px tracking-wide uppercase ml-0.5">optional</span> can be skipped.
            </p>
          </div>

          <div className="mx-7 mt-4 h-px bg-slate-100" />

          {/* Card body */}
          <div className="px-7 pt-4 pb-6">
            {/* Error */}
            {error && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex gap-3 items-start">
                <AlertCircle className="text-rose-500 flex-shrink-0 mt-0.5" size={17} />
                <p className="text-[13px] text-rose-700 leading-snug">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-0">
              {sectionLabel('Personal details')}

              {/* Surname + Firstname row */}
              <div className="grid grid-cols-2 gap-3 mb-3.5">
                <div className="space-y-1.5">
                  <label htmlFor="surname" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Surname
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <Input id="surname" type="text" placeholder="e.g. Adeyemi" value={surname}
                      onChange={(e) => setSurname(e.target.value)} disabled={isLoading} className={inputClass} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="firstname" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    First name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <Input id="firstname" type="text" placeholder="e.g. Busayo" value={firstname}
                      onChange={(e) => setFirstname(e.target.value)} disabled={isLoading} className={inputClass} />
                  </div>
                </div>
              </div>

              {/* Middle name */}
              <div className="space-y-1.5 mb-0">
                <label htmlFor="middlename" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Middle name{' '}
                  <span className="inline-flex items-center text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded px-1.5 py-px tracking-wide uppercase">
                    optional
                  </span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <Input id="middlename" type="text" placeholder="Enter middle name if applicable" value={middlename}
                    onChange={(e) => setMiddlename(e.target.value)} disabled={isLoading} className={inputClass} />
                </div>
              </div>

              {sectionLabel('Account details')}

              {/* Username */}
              <div className="space-y-1.5 mb-3.5">
                <label htmlFor="username" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <Input id="username" type="text" placeholder="Choose a username" value={username}
                    onChange={(e) => setUsername(e.target.value)} disabled={isLoading} className={inputClass} />
                </div>
                <p className="text-[11px] text-slate-400">At least 3 characters</p>
              </div>

              {/* Email */}
              <div className="space-y-1.5 mb-0">
                <label htmlFor="email" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <Input id="email" type="email" placeholder="your@email.com" value={email}
                    onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className={inputClass} />
                </div>
              </div>

              {sectionLabel('Security')}

              {/* Password + Confirm row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <Input id="password" type="password" placeholder="Min. 6 characters" value={password}
                      onChange={(e) => setPassword(e.target.value)} disabled={isLoading} className={inputClass} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Confirm
                  </label>
                  <div className="relative">
                    <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <Input id="confirmPassword" type="password" placeholder="Repeat password" value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} className={inputClass} />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 mt-6 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-px"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create account <ArrowRight size={16} />
                  </span>
                )}
              </Button>
            </form>
          </div>

          {/* Card footer */}
          <div className="px-7 py-4 border-t border-slate-100 text-center">
            <p className="text-[13px] text-slate-500">
              Already have an account?{' '}
              <button onClick={() => setLocation('/user/login')}
                className="text-cyan-600 hover:text-cyan-700 font-semibold transition">
                Sign in
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-5">
          By registering, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}