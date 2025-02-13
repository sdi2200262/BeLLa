export function Sidebar({ isOpen }: { isOpen: boolean }) {
  return (
    <aside className={`fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-black border-r border-white/10 transform transition-transform duration-200 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <nav className="p-4">
        
      </nav>
    </aside>
  )
} 