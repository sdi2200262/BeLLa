import { Github as GithubIcon } from 'lucide-react';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;

export function GithubLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      login(code)
        .then(() => {
          navigate('/profile');
        })
        .catch((error) => {
          console.error('Login failed:', error);
          navigate('/');
        });
    }
  }, [login, navigate]);

  const handleLogin = () => {
    const redirectUri = 'http://localhost:5173/login';
    window.location.href = `https://github.com/login/oauth/authorize?` + 
      `client_id=${GITHUB_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=user`;
  };

  const handleGuestAccess = () => {
    navigate('/projects');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-black">
      <Card className="w-[400px] bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Sign in to BeLLa</CardTitle>
          <CardDescription className="text-white/60">
            Connect your GitHub account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 bg-[#24292F] text-white hover:bg-[#24292F]/90 px-4 py-3 rounded-lg transition-colors"
          >
            <GithubIcon className="w-5 h-5" />
            Continue with GitHub
          </button>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t border-white/10 pt-4">
          <div className="text-white/60 text-sm text-center">
            Or continue without signing in
          </div>
          <Button
            variant="outline"
            onClick={handleGuestAccess}
            className="w-full bg-transparent border-white/20 text-white hover:bg-white/5"
          >
            Continue as Guest
          </Button>
          <div className="text-white/40 text-xs text-center">
            Note: Some features may be limited in guest mode
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 