import { useState, useEffect } from 'react';
import { LandingPage, ComponentsShowcase } from './components-library';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', handleLocationChange);
    
    // Listen for our custom navigation events
    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  return (
    <>
      {currentPath === '/' && <LandingPage />}
      {currentPath === '/components' && <ComponentsShowcase />}
    </>
  );
}

export default App;
