import React from 'react';
import Button from '../Buttons/Button';
import './Pages.css';

const ComponentsShowcase: React.FC = () => {
  return (
    <div className="page">
      <h1>Components Library</h1>
      
      <section className="showcase-section">
        <h2>Buttons</h2>
        <div className="showcase-item">
          <Button 
            label="Click me!" 
            onClick={() => alert('Button clicked!')} 
          />
        </div>
      </section>
    </div>
  );
};

export default ComponentsShowcase;

