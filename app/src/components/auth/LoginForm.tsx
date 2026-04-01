import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/contexts/AuthContext';
import { BRAND } from '@/lib/brand';
import { toast } from 'sonner';

interface LoginFormProps {
  onToggleMode: () => void;
}

export function LoginForm({ onToggleMode }: LoginFormProps) {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    try {
      await login(formData.email, formData.password);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setFieldError(msg);
    }
  };

  const handleGoogleLogin = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const auth = useAuth as any;
    if (typeof auth?.loginWithGoogle === 'function') {
      setGoogleLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (auth as any).loginWithGoogle();
      } catch {
        toast.error('Google login failed. Please try again.');
      } finally {
        setGoogleLoading(false);
      }
    } else {
      toast.info('Google OAuth coming soon');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">

        {/* Logo + wordmark */}
        <div className="flex flex-col items-center gap-3 mb-2">
          <img
            src={BRAND.logoSrc}
            alt={`${BRAND.name} logo`}
            className="h-14 w-auto max-w-[200px]"
          />
          <div className="text-center">
            <p className={`${BRAND.wordmarkFontClass} text-2xl leading-none tracking-[0.08em] text-gray-900 uppercase`}>
              {BRAND.name.toUpperCase()}
            </p>
            <p className="mt-1.5 text-xs text-gray-400 tracking-wide">
              Your autonomous AI marketer
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-5">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-semibold text-gray-900">Welcome back</h1>
            <p className="text-sm text-gray-500">Sign in to your account to continue</p>
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <span className="flex items-center gap-3">
                {/* Google G */}
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #4285F4 25%, #34A853 50%, #FBBC05 75%, #EA4335 100%)' }}
                >
                  G
                </span>
                Continue with Google
              </span>
            )}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">or</span>
            </div>
          </div>

          {/* Email + Password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm text-gray-700 font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="arjun@company.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, email: e.target.value }));
                  setFieldError(null);
                }}
                className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 transition-colors duration-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm text-gray-700 font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, password: e.target.value }));
                    setFieldError(null);
                  }}
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 transition-colors duration-200 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldError && (
                <p role="alert" className="text-xs text-red-500 mt-1">{fieldError}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white transition-colors duration-150 rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onToggleMode}
              className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
