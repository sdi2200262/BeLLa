export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-black border-b border-white/10 ">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-6">
          <button className="header-interactive text-white/60 hover:text-white/90">
            <MenuIcon className="w-10 h-10 text-white hover:opacity-80" />
          </button>
          <a href="/" className="header-interactive">
            <img 
              src="/svg/BeLLa/BeLLa-Monogram.svg" 
              alt="BeLLa Logo" 
              className="h-8 hover:opacity-80" 
            />
          </a>
        </div>
        
        <nav className="flex items-center gap-8 ">
          <a href="/projects" className="header-interactive text-lg text-white/90 hover:underline">Projects</a>
          <a href="/contact" className="header-interactive text-lg text-white/90 hover:underline">Contact</a>
          <a href="/docs" className="header-interactive text-lg text-white/90 hover:underline">Docs</a>
          <a href="/profile" className="header-interactive">
            <img 
              src="/svg/general/Avatar.svg" 
              alt="Profile" 
              className="w-14 h-14 hover:opacity-80" 
            />
          </a>
        </nav>
      </div>
    </header>
  )
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
} 