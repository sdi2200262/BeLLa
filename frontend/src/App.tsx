import { Layout, LandingPage, ComponentsShowcase } from './components-library';

function App() {
  const currentPath = window.location.pathname;

  return (
    <Layout>
      {currentPath === '/' && <LandingPage />}
      {currentPath === '/components' && <ComponentsShowcase />}
    </Layout>
  );
}

export default App;
