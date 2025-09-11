import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Brain } from 'lucide-react';

interface LoginFormProps {
  onToggleMode: () => void;
}

export function LoginForm({ onToggleMode }: LoginFormProps) {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
      toast.success('Welcome back! 🎉');
    } catch (error) {
      toast.error('Login failed. Please try again.');
    }
  };

  const handleDemoLogin = async () => {
    try {
      await login('demo@example.com', 'demo123');
      toast.success('Welcome to the demo! 🚀');
    } catch (error) {
      toast.error('Demo login failed. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Logo */}
      <div className="flex items-center justify-center space-x-2 animate-in fade-in-50 slide-in-from-top-5 duration-700">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-700 opacity-80"></div>
          <div className="relative">
            <div className="w-6 h-6 relative">
              <div className="absolute top-0 left-0 w-3 h-3 bg-white rounded-full opacity-90"></div>
              <div className="absolute top-1 right-0 w-2 h-2 bg-white rounded-full opacity-70"></div>
              <div className="absolute bottom-0 left-1 w-2.5 h-2.5 bg-white rounded-full opacity-80"></div>
              <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-white rounded-full opacity-60"></div>
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
          Torqq AI
        </h1>
      </div>
      
      <Card className="animate-in fade-in-50 slide-in-from-bottom-5 duration-700">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
          Welcome Back
        </CardTitle>
        <CardDescription>
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="transition-all duration-200 focus:scale-[1.01]"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="transition-all duration-200 focus:scale-[1.01]"
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-orange-500 hover:bg-orange-600 transition-all duration-200 hover:scale-[1.02]" 
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner size="sm" /> : 'Sign In'}
          </Button>
        </form>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full transition-all duration-200 hover:scale-[1.02] hover:border-orange-500"
          onClick={handleDemoLogin}
          disabled={isLoading}
        >
          Try Demo Account
        </Button>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Button variant="link" className="p-0 h-auto text-orange-600 hover:text-orange-700" onClick={onToggleMode}>
            Sign up
          </Button>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}