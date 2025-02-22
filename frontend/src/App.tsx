import "./index.css"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { MainLayout } from "./components/layout/MainLayout"
import { LandingPage } from "./components/pages/LandingPage"
import { Documentation } from "./components/pages/DocumentationPage"
import { HelpPage } from "./components/pages/HelpPage"
import LicensePage from "./components/pages/LicensePage"
import { ProjectsPage } from "./components/pages/ProjectsPage"
import { ProjectShowcasePage } from './components/pages/ProjectShowcasePage'


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="documentation" element={<Documentation />} />
          <Route path="license" element={<LicensePage />} />
          <Route path="help" element={<HelpPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:owner/:repoName" element={<ProjectShowcasePage />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App 