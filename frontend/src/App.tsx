import "./index.css"
import { useState } from "react"
import { Header } from "./components/layout/Header"
import { Sidebar } from "./components/layout/Sidebar"
import { LandingPage } from "./components/pages/LandingPage"

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen ">
      <Header />
      <Sidebar isOpen={sidebarOpen} />
      <LandingPage />
    </div>
  )
}

export default App 