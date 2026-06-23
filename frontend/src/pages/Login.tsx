import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { motion } from 'framer-motion';
import { GraduationCap, Users, Calendar, Lock, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const tempErrors: typeof errors = {};
    if (!email) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Email address is invalid';
    }
    
    if (!password) {
      tempErrors.password = 'Password is required';
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await login(email, password);
      success('Welcome Back!', 'Logged in successfully.');
    } catch (err: any) {
      toastError('Login Failed', err.message || 'Incorrect credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    success('Reset Link Sent', 'A password reset link has been sent to your email.');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-zinc-50 dark:bg-[#09090b]">
      {/* Left Column: Branding & Features (Hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white flex-col justify-between p-12">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-10 left-10 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-300 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Logo & Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-200">
            Aegis FMS
          </span>
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl lg:text-5xl font-extrabold tracking-tight font-display leading-[1.1]"
          >
            Manage Academy Workflows Effortlessly.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-white/80 text-base leading-relaxed"
          >
            A high-performance SaaS console for college deans and faculty members. Real-time scheduling, department workloads, and attendance audits.
          </motion.p>

          {/* Quick Statistics Highlights Grid */}
          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Users className="w-5 h-5 text-blue-300 mb-2" />
              <div className="text-2xl font-bold font-display">180+</div>
              <div className="text-xs text-white/60">Faculty Members</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Calendar className="w-5 h-5 text-indigo-300 mb-2" />
              <div className="text-2xl font-bold font-display">98.5%</div>
              <div className="text-xs text-white/60">Attendance Health</div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex justify-between text-xs text-white/60">
          <span>Enterprise Faculty ERP</span>
          <span>© 2026 Aegis Ltd.</span>
        </div>
      </div>

      {/* Right Column: Login Card */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
        {/* Subtle decorative mesh for dark/light backgrounds */}
        <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-blue-500/5 dark:bg-blue-500/2 filter blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile logo */}
          <div className="md:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold font-display tracking-tight text-zinc-950 dark:text-zinc-50">
              Aegis FMS
            </span>
          </div>

          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-bold font-display tracking-tight text-zinc-950 dark:text-zinc-50">
              Sign in to your account
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
              Enter your credentials to access the FMS dashboard.
            </p>
          </div>

          {/* Glassmorphic Login Card */}
          <div className="glass p-6 md:p-8 rounded-2xl shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-200 dark:border-zinc-800">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Input
                  ref={undefined}
                  label="Campus Email Address"
                  type="email"
                  placeholder="name@college.edu"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  error={errors.email}
                  className="pl-9"
                />
                <div className="relative">
                  <Mail className="absolute left-3.5 top-9.5 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                </div>
              </div>

              <div className="space-y-1 relative">
                <Input
                  ref={undefined}
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  error={errors.password}
                  className="pl-9"
                />
                <Lock className="absolute left-3.5 top-9.5 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-800 text-blue-600 focus:ring-blue-500 bg-white dark:bg-zinc-950 accent-blue-600"
                  />
                  <span>Remember me</span>
                </label>
                <a
                  href="#forgot"
                  onClick={handleForgotPassword}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors cursor-pointer"
                >
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                Sign In
              </Button>
            </form>
          </div>

          {/* Quick Demo Credentials Help */}
          <div className="mt-8 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Quick Access Credentials:</span>
            <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1">
              <div>Dean: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">dean@college.edu</code> / <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">password123</code></div>
              <div>Faculty: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">amit.cse@college.edu</code> / <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">password123</code></div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
