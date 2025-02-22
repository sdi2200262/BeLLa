import { Button } from '../ui/button'
import { useNavigate } from 'react-router-dom'

export function Sidebar({ isOpen }: { isOpen: boolean }) {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
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
            <img src="/svg/general/Code.svg" alt="Code" className="size-6 mr-2" />
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