import "./index.css"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { MainLayout } from "./components/layout/MainLayout"
import { LandingPage } from "./components/pages/LandingPage"
import { Documentation } from "./components/pages/DocumentationPage"
import { HelpPage } from "./components/pages/HelpPage"
import LicensePage from "./components/pages/LicensePage"
import { ProjectsPage } from "./components/pages/ProjectsPage"
import { ProjectShowcasePage } from './components/pages/ProjectShowcase'
import { BeLLaMainShowcasePage } from './components/pages/BeLLaMainShowcase'
import { BeLLaNERTShowcasePage } from './components/pages/BeLLaNERTShowcase'
import { ComponentsShowcase } from './components/pages/ComponentsShowcase'
import { ProfilePage } from './components/pages/ProfilePage'
import { AuthProvider } from './contexts/AuthContext'
import { LikeProvider } from './contexts/LikeContext'
import LoginPage from './components/pages/LoginPage'

function App() {
  return (
    <AuthProvider>
      <LikeProvider>
        <Router>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="documentation" element={<Documentation />} />
              <Route path="license" element={<LicensePage />} />
              <Route path="help" element={<HelpPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/bella/main" element={<BeLLaMainShowcasePage />} />
              <Route path="projects/bella/nert" element={<BeLLaNERTShowcasePage />} />
              <Route path="projects/:owner/:repoName" element={<ProjectShowcasePage />} />
              <Route path="components" element={<ComponentsShowcase />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Routes>
        </Router>
      </LikeProvider>
    </AuthProvider>
  )
}

export default App 