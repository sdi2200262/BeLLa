import { useState } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Footer } from './Footer'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} />
      <main className={`pt-16 flex-1 transition-all duration-200 ${isSidebarOpen ? 'blur-sm pointer-events-none' : ''}`}>
        {children}
      </main>
      <Footer />
    </div>
  )
} 