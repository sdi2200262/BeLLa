import React from 'react';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <nav className="nav">
        <a href="/" className="nav-link">Home</a>
        <a href="/components" className="nav-link">Components</a>
      </nav>
      <main className="main">
        {children}
      </main>
    </div>
  );
};

export default Layout;
