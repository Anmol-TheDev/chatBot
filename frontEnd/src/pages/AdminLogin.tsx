import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';
import apiClient from '../lib/axios';

export function AdminLogin() {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiClient.post('/admin/login', { email, password });
      
      if (response.data.status === 'success' || response.data.token) {
        setSuccess('Login successful! Redirecting...');
        localStorage.setItem('adminToken', response.data.token);
        
        // Redirect to dashboard
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center relative overflow-hidden bg-background px-4">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('/background2.png')] bg-cover bg-center bg-no-repeat opacity-20 dark:opacity-10" />
      <div className="absolute inset-0 hero-gradient pointer-events-none" />
      
      {/* Form Container */}
      <div className="relative z-10 w-full max-w-md mx-auto p-8 rounded-2xl bg-card/70 backdrop-blur-xl border border-border shadow-xl">
        {/* Back button */}
        <button 
          onClick={() => navigate('/')} 
          className="absolute top-4 left-4 p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-secondary-foreground"
          aria-label="Go back to home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-8 mt-2">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-card-foreground mb-1">
            Admin Portal
          </h1>
          <p className="text-muted-foreground text-sm">
            Sign in to manage the platform
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}
          
          {/* Success Message */}
          {success && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm">
              {success}
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-card-foreground ml-1 block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 rounded-lg bg-input border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors text-foreground placeholder:text-muted-foreground"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-card-foreground ml-1 block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 rounded-lg bg-input border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors text-foreground placeholder:text-muted-foreground"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
