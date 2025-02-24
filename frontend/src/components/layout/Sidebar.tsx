import { User2 } from 'lucide-react';
import { Button } from '../ui/button'
import { useNavigate, useLocation } from 'react-router-dom'
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

export function Sidebar({ isOpen }: { isOpen: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
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
          className="size-6 mr-4 rounded-full ring-1 ring-white/10 hover:ring-[#0066FF] transition-all duration-300"
        />
      );
    } else {
      return <User2 className="size-6 mr-4" />;
    }
  };

  return (
    <aside className={`fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-black/95 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 ease-out z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <nav className="p-4 flex flex-col gap-2">
        <div className="button-container side top-10">
          <Button 
            variant="ghost" 
            className="rounded-[15px] p-2 w-full justify-start text-xl text-white hover:text-white hover:bg-white/5 transition-colors duration-100" 
            onClick={() => handleNavigation('/projects')}
          >
            <img src="/svg/general/Code.svg" alt="Projects" className="size-6 mr-2" />
            Projects
          </Button>
        
          <Button 
            variant="ghost" 
            className="rounded-[15px] p-2 w-full justify-start text-xl text-white hover:text-white hover:bg-white/5 transition-colors duration-100"
            onClick={() => handleNavigation('/components')}
          >
            <img src="/svg/stack/React.svg" alt="Components" className="size-6 mr-2" />
            Components
          </Button>
          
          <Button 
            variant="ghost" 
            className="rounded-[15px] p-2 w-full justify-start text-xl text-white hover:text-white hover:bg-white/5 transition-colors duration-100"
            onClick={handleProfileClick}
          >
            {getProfileIcon()}
            Profile
          </Button>
           
          <div className="w-full h-[1px] bg-white/10 my-4"></div>
          
          <Button 
            variant="ghost" 
            className="rounded-[15px] p-2 w-full justify-start text-xl text-white hover:text-white hover:bg-white/5 transition-colors duration-100"
            onClick={() => handleNavigation('/help')}
          >
            <img src="/svg/general/Help_Circle.svg" alt="Help Circle" className="size-6 mr-2" />
            Help
          </Button>

          <Button 
            variant="ghost" 
            className="rounded-[15px] p-2 w-full justify-start text-xl text-white hover:text-white hover:bg-white/5 transition-colors duration-100"
            onClick={() => handleNavigation('/license')}
          >
            <img src="/svg/general/License.svg" alt="License" className="size-6 mr-2" />
            License
          </Button>

          <div className="w-full h-[1px] bg-white/10 my-4"></div>

          <img src="/svg/BeLLa/BeLLa-Logo.svg" alt="BeLLa Logo" className="BeLLa-Logo size-25" />
          <div className="text-white/40 text-sm">
            © {new Date().getFullYear()} BeLLa. All rights reserved.
          </div>
        </div>
      </nav>
    </aside>
  )
} 