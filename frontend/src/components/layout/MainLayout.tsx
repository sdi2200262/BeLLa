import { ReactNode, useState } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Footer } from './Footer'
import { Outlet } from "react-router-dom"

interface MainLayoutProps {
  children?: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} />
      <main className={`pt-16 flex-1 transition-all duration-200 ${isSidebarOpen ? 'blur-sm pointer-events-none' : ''}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
} 