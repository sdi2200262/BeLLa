import React from 'react';
import './LandingPage.css';
import NavTree from '../Navigation/NavTree';
import Button from '../Buttons/Button';

// Landing page
const LandingPage: React.FC = () => {
  return (
    <div className="page">
      <h1>Welcome to BeLLa</h1>
      <p className="subtitle">
        An open-source project for LLM dataset management
      </p>
      
      {/* Navigation Tree */}
      <NavTree items={[
        { label: '/home', href: '/' },
        { label: '/components', href: '/components', indent: true },
        { label: '/progress', href: '/progress', indent: true }
      ]} />
    </div>
  );
};

export default LandingPage;

