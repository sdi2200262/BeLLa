import "./index.css"
import { MainLayout } from "./components/layout/MainLayout"
import { LandingPage } from "./components/pages/LandingPage"

function App() {
  return (
    <MainLayout>
      <LandingPage />
    </MainLayout>
  )
}

export default App 