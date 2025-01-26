import React, { useState, useEffect } from 'react';
import './Pages.css';
import Button from '../Buttons/Button';
import Modal from '../Modal/Modal';
import Breadcrumb from '../Navigation/Breadcrumb';
import DinoGame from '../Games/DinoGame/DinoGame';
import UploadForm from '../Forms/UploadForm';

// Types
type Effect = 'underline' | 'slide' | 'scale';

interface EffectButtonStates {
  underline: boolean;
  slide: boolean;
  scale: boolean;
}

// Component
const ComponentsShowcase: React.FC = () => {

  // State management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [activeEffects, setActiveEffects] = useState<Effect[]>([]);
  const [effectButtonStates, setEffectButtonStates] = useState<EffectButtonStates>({
    underline: false,
    slide: false,
    scale: false
  });
  const [showForm, setShowForm] = useState(false);

  // Effect handlers
  const toggleEffect = (effect: Effect) => {
    setEffectButtonStates(prev => ({
      ...prev,
      [effect]: !prev[effect]
    }));

    setActiveEffects(prev => 
      prev.includes(effect) 
        ? prev.filter(e => e !== effect)
        : [...prev, effect]
    );
  };

  const toggleGame = () => {
    setShowGame(prev => !prev);
  };

  // Space key handler for game
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showGame && e.code === 'Space') {
        e.preventDefault(); // Prevent page scrolling
      }
    };

    // Setup and cleanup scroll lock
    if (showGame) {
      window.addEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'auto';
    };
  }, [showGame]);

  // Render helpers
  const renderButtonShowcase = () => (
    <div className="showcase-item">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}> 
        <Button 
          label="Text Button" 
          onClick={() => setIsModalOpen(true)} 
          variant="text"
          effects={activeEffects}
          size="large"
        />
      </div>
      <p className="component-description">
        Select an effect, you can select multiple to combine them:
      </p>
      <div className="effect-selector">
        {renderEffectButtons()}
      </div>
    </div>
  );

  const renderEffectButtons = () => (
    <>
      {['underline', 'slide', 'scale'].map((effect) => (
        <Button 
          key={effect}
          label={effect.charAt(0).toUpperCase() + effect.slice(1)} 
          onClick={() => toggleEffect(effect as Effect)} 
          variant="action"
          isActive={effectButtonStates[effect as keyof EffectButtonStates]}
        />
      ))}
    </>
  );

  const renderGameShowcase = () => (
    <div className={`showcase-item ${showGame ? 'game-active' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Button 
          label="Action Button" 
          onClick={() => setIsModalOpen(true)} 
          variant="action"
          size="large"
        />
      </div>
      <p className="component-description">
        A standard action button with a hover effect. No special effects, but here is a minigame:
      </p>
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <Button
          label={showGame ? "Close Game" : "Play a Game"}
          onClick={toggleGame}
          variant="text"
          effects={['slide']}
        />
      </div>
      <div className={`game-container ${showGame ? 'fade-in' : 'fade-out'}`}>
        {showGame && <DinoGame useSpacebar />}
      </div>
    </div>
  );

  const renderFormsShowcase = () => (
    <div className={`showcase-item ${showForm ? 'form-active' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <Button
          label={showForm ? "Hide Upload Form" : "View Upload Form"}
          onClick={() => setShowForm(!showForm)}
          variant="action"
          size="large"
        />
      </div>
        <p className="component-description"> The form wouldnt fit inside this container...</p>
      <div className={`form-container ${showForm ? 'visible' : ''}`}>
        <UploadForm />
      </div>
      <p className="component-description">The form is still squeezed into the container, but it works!</p>
    </div>
  );

  return (
    <div className="page">
      <Breadcrumb items={[
        { label: '/home', href: '/' },
        { label: '/components', href: '/components' }
      ]} />
      <h1>Components Library</h1>
      
      <section className="showcase-section">
        <h2>Buttons</h2>
        <div className="showcase-grid">
          {renderButtonShowcase()}
          {renderGameShowcase()}
        </div>
      </section>

      <section className="showcase-section">
        <h2>Forms</h2>
        <div className="showcase-grid">
          {renderFormsShowcase()}
        </div>
      </section>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Modal Title"
      >
        <p>This is a minimal modal window that follows the design language of the application.</p>
      </Modal>
    </div>
  );
};

export default ComponentsShowcase;

