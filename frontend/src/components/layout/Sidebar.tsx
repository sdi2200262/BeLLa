import { Button } from '../ui/button'

export function Sidebar({ isOpen }: { isOpen: boolean }) {
  return (
    <aside className={`fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-black border-r border-white/10 transform transition-transform duration-200 z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      
      <nav className="p-4 flex flex-col gap-2">
        <div className="button-container side top-10">

          <Button variant="ghost" className="rounded-[15px] p-2 w-full justify-start text-xl hover:bg-white/5 transition-colors duration-100">
            <img src="/svg/general/Code.svg" alt="Code" className="size-6 mr-2" />
            Projects
          </Button>
        
          <Button variant="ghost" className="rounded-[15px] p-2 w-full justify-start text-xl hover:bg-white/5 transition-colors duration-100">
            <img src="/svg/general/Add_Circle.svg" alt="Add Circle" className="size-6 mr-2" />
            Contribute
          </Button>
           
          <div className="w-full h-[1px] bg-white/10 my-4"></div>
          
          <Button variant="ghost" className="rounded-[15px] p-2 w-full justify-start text-xl hover:bg-white/5 transition-colors duration-100">
            <img src="/svg/general/Help_Circle.svg" alt="Help Circle" className="size-6 mr-2" />
            Help
          </Button>

          <Button variant="ghost" className="rounded-[15px] p-2 w-full justify-start text-xl hover:bg-white/5 transition-colors duration-100" onClick={() => (window.location.href = "/license")}>
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