import { Github as GithubIcon, User2, Loader2 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { APIError } from '@/config/api';

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeProcessed = useRef(false);

  useEffect(() => {
    // If user is already logged in, redirect to profile
    if (user) {
      navigate('/profile');
      return;
    }

    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    const oauthError = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    if (oauthError) {
      console.error('GitHub OAuth Error:', oauthError, errorDescription);
      setError(errorDescription || 'Failed to authenticate with GitHub');
      setIsLoading(false);
      navigate('/login', { replace: true });
      return;
    }

    // Only process the code once
    if (code && !codeProcessed.current) {
      codeProcessed.current = true;
      setIsLoading(true);
      setError(null);
      
      login(code)
        .then(() => {
          navigate('/profile');
        })
        .catch((error: Error | APIError) => {
          console.error('Login failed:', error);
          setError(error instanceof APIError ? error.message : 'Authentication failed');
          // Clear the code from URL to prevent future attempts
          navigate('/login', { replace: true });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [login, navigate, location.search, user]);

  const handleLogin = () => {
    if (!GITHUB_CLIENT_ID) {
      setError('GitHub Client ID is not configured');
      return;
    }

    const redirectUri = `${window.location.origin}/login`;
    const state = crypto.randomUUID(); // Add state parameter for security
    const scope = 'read:user user:email'; // Request minimal required scopes
    
    const githubAuthUrl = `https://github.com/login/oauth/authorize?` + 
      `client_id=${GITHUB_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}` +
      `&scope=${encodeURIComponent(scope)}`;

    // Store state for verification when GitHub redirects back
    sessionStorage.setItem('oauth_state', state);
    window.location.href = githubAuthUrl;
  };

  const handleGuestAccess = () => {
    navigate('/projects');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-white/40 animate-spin mx-auto" />
          <p className="text-white/60">Connecting to GitHub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">Authentication</h1>
          <div className="flex items-center gap-1 text-sm text-white/60">
            Using Github's <a href="https://docs.github.com/en/apps/oauth-apps" target="_blank" className="underline hover:text-white hover:underline">OAuth</a> Authentication System
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Left section: Login card */}
          <div className="w-full md:w-1/2">
            <Card className="bg-black/40 border-white/10 backdrop-blur-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl text-white">Sign in to BeLLa</CardTitle>
                <CardDescription className="text-white/60">
                  Connect your GitHub account to continue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                    {error}
                  </div>
                )}
                <Button
                  variant="default"
                  onClick={handleLogin}
                  className="text-lg w-full flex items-center justify-center gap-2 bg-[#0066FF] text-white hover:bg-[#0066FF]/60 px-4 py-3 rounded-lg transition-all duration-300"
                >
                  <GithubIcon className="w-5 h-5" />
                  Continue with GitHub
                </Button>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 border-t border-white/10 pt-4">
                <div className="text-white/60 text-sm text-center">
                  Or continue without signing in
                </div>
                <Button
                  variant="outline"
                  onClick={handleGuestAccess}
                  className="w-full bg-black text-white hover:text-white hover:bg-white/10 transition-all duration-300"
                >
                  Continue as Guest
                </Button>
                <div className="text-white/40 text-xs text-center">
                  Note: Some features may be limited in guest mode
                </div>
              </CardFooter>
            </Card>

            <img src="/svg/BeLLa/CobuterMan.svg" alt="BeLLa Logo" className="mt-10 size-40 mx-auto" />
          </div>

          {/* Right section: Access description */}
          <div className="w-full md:w-1/2">
            <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-xl text-white">Access Levels</CardTitle>
                <CardDescription className="text-white/60">
                  Choose the access level that suits your needs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* GitHub Users Section */}
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-[#0066FF]/10 p-2 rounded-lg">
                      <GithubIcon className="text-[#0066FF] w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">GitHub Users</h3>
                      <p className="text-sm text-white/60">Full platform access</p>
                    </div>
                  </div>
                  <div className="pl-4 border-l border-white/10">
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0066FF] group-hover:scale-110 transition-all duration-300" />
                        <span className="text-white/80 group-hover:text-white transition-colors duration-300">
                          Personalized profile management
                        </span>
                      </li>
                      <li className="flex items-center gap-3 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0066FF] group-hover:scale-110 transition-all duration-300" />
                        <span className="text-white/80 group-hover:text-white transition-colors duration-300">
                          Project submission and editing
                        </span>
                      </li>
                      <li className="flex items-center gap-3 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0066FF] group-hover:scale-110 transition-all duration-300" />
                        <span className="text-white/80 group-hover:text-white transition-colors duration-300">
                          Community interactions
                        </span>
                      </li>
                      <li className="flex items-center gap-3 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0066FF] group-hover:scale-110 transition-all duration-300" />
                        <span className="text-white/80 group-hover:text-white transition-colors duration-300">
                          All Guest Features
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Guest Access Section */}
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white/10 p-2 rounded-lg">
                      <User2 className="text-white/80 w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Guest Access</h3>
                      <p className="text-sm text-white/60">Limited platform access</p>
                    </div>
                  </div>
                  <div className="pl-4 border-l border-white/10">
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/60 group-hover:scale-110 transition-all duration-300" />
                        <span className="text-white/80 group-hover:text-white transition-colors duration-300">
                          Browse Projects
                        </span>
                      </li>
                      <li className="flex items-center gap-3 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/60 group-hover:scale-110 transition-all duration-300" />
                        <span className="text-white/80 group-hover:text-white transition-colors duration-300">
                          Browse Component Library
                        </span>
                      </li>
                      <li className="flex items-center gap-3 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/60 group-hover:scale-110 transition-all duration-300" />
                        <span className="text-white/80 group-hover:text-white transition-colors duration-300">
                          View Documentation
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 