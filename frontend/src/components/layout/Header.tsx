import { useLocation, useNavigate } from 'react-router-dom';
import { useCallback, useTransition } from 'react';
import { User2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description?: string;
  visibility: string;
  owner: {
    avatar_url: string;
  };
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  repos?: GitHubRepo[];
}

export function Header({ isSidebarOpen, setIsSidebarOpen }: 
  { isSidebarOpen: boolean; setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>> }) {
  
  const location = useLocation();
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const isLandingPage = location.pathname === '/';
  const { user } = useAuth();

  // Memoized navigation handler
  const handleNavigation = useCallback((path: string) => {
    if (isLandingPage && path === '/') {
      // If we're on landing page and clicking home, scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      startTransition(() => {
        navigate(path);
      });
    }
  }, [navigate, isLandingPage]);

  const scrollToSection = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    const section = document.getElementById(sectionId);
    if (section) {
      const headerHeight = 64;
      const targetPosition = section.getBoundingClientRect().top + window.scrollY - headerHeight;
      window.scrollTo({top: targetPosition, behavior: 'smooth'});
    }
  };

  const handleProfileClick = () => {
    if (!user) {
      navigate('/login');
    } else {
      navigate('/profile');
    }
  };

  const getProfileIcon = () => {
    if (user) {
      return (
        <img 
          src={`https://github.com/${user.username}.png`}
          alt={user.username}
          className="w-8 h-8 rounded-full hover:opacity-80 ring-1 ring-white/10 hover:ring-[#0066FF] transition-all duration-300"
        />
      );
    } else {
      return <User2 className="size-6 mr-4 hover:opacity-80" />;
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-black border-b border-white/10 z-50">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-6">
          <button 
            className="header-interactive text-white/60 hover:text-white/90 relative overflow-hidden" 
            onClick={() => setIsSidebarOpen(prev => !prev)}
          >
            <MenuIcon className={`w-10 h-10 text-white hover:opacity-80 transition-all duration-300 ${isSidebarOpen ? 'scale-x-[6.5] origin-left' : 'scale-x-100'}`} />
          </button>
          
          <button 
            onClick={() => handleNavigation('/')} 
            className="header-interactive hover:opacity-80"
          >
            <img src="/svg/BeLLa/BeLLa-Monogram.svg" alt="BeLLa Logo" className="h-8" />
          </button>
        </div>
        
        <nav className="flex items-center gap-8">
          {isLandingPage && (
            <>
              <a href="#team-section" onClick={(e) => scrollToSection(e, 'team-section')} className="header-interactive text-lg text-white/90 hover:underline">
                Team
              </a>
              <a href="#blog-section" onClick={(e) => scrollToSection(e, 'blog-section')} className="header-interactive text-lg text-white/90 hover:underline">
                Blog
              </a>
            </>
          )}
          
          <button 
            onClick={() => handleNavigation('/documentation')}
            className={`header-interactive text-lg text-white/90 hover:underline ${isPending ? 'opacity-70' : ''}`}
          >
            Docs
          </button>
          
          <button 
            onClick={handleProfileClick}
            className="header-interactive"
          >
            {getProfileIcon()}
          </button>
        </nav>
      </div>
    </header>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}