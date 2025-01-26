import React, { useState, useEffect } from 'react';
import './ComponentsShowcase.css';
import Button from '../Buttons/Button';
import Modal from '../Modal/Modal';
import Breadcrumb from '../Navigation/Breadcrumb';
import DinoGame from '../Games/DinoGame/DinoGame';
import UploadForm from '../Forms/UploadForm';
import ReadmeViewer from '../ReadmeViewer/ReadmeViewer';
import FileContainer from '../FileContainer/FileContainer';

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
  const [showReadme, setShowReadme] = useState(false);
  const [visibleSection, setVisibleSection] = useState<string | null>(null);
  const [showFileContainer, setShowFileContainer] = useState(false);

  // Sample README content
  const sampleReadme = `# Markdown Rendering Demo

## Overview
The markdown Rendering has been customized to match the website's theme.

### Text Formatting Examples
You can write text in **bold**, *italic*, or ***both***. You can also use ~~strikethrough~~ text.

### Lists and Quotes
Here's a nested list:
- Main item 1
  - Sub item A
  - Sub item B
- Main item 2
  - Sub item X
  - Sub item Y

> This is a blockquote that demonstrates the themed styling.
> It uses a subtle border and muted text color.

### Code Examples
Inline code like \`const x = 123\` is styled consistently.

\`\`\`typescript
// Code blocks have syntax highlighting
interface Theme {
  background: string;
  text: string;
  accent: string;
}

const darkTheme: Theme = {
  background: '#000',
  text: 'rgba(255,255,255,0.9)',
  accent: '#007AFF'
};
\`\`\`

### Links and References
[Links are styled](https://example.com) with the site's accent color and hover effects.

---

The markdown renderer automatically adjusts colors and contrasts based on the system theme preference.`;

  // Sample files for the showcase
  const sampleFiles = [
    {
      name: "documentation.md",
      onClick: () => console.log("Documentation clicked")
    },
    {
      name: "project-requirements.txt",
      onClick: () => console.log("Requirements clicked")
    },
    {
      name: "very-long-filename-that-needs-truncating.tsx",
      onClick: () => console.log("Long filename clicked")
    }
  ];

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

  // Add toggle function for sections
  const toggleSection = (section: string) => {
    setVisibleSection(visibleSection === section ? null : section);
  };

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
      <Button
        label={showGame ? "Close Game" : "Play a Game"}
        onClick={toggleGame}
        variant="text"
        effects={['slide']}
      />
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
        <p className="component-description"> The form wouldn't fit inside this container...</p>
      <div className={`form-container ${showForm ? 'visible' : ''}`}>
        <UploadForm />
        <p className="component-description">The form is still squeezed into the container, but it works!</p>
      </div>
    </div>
  );

  const renderReadmeViewerShowcase = () => (
    <div className={`showcase-item ${showReadme ? 'readme-active' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <Button
          label={showReadme ? "Close Viewer" : "Open Viewer"}
          onClick={() => setShowReadme(!showReadme)}
          variant="action"
          effects={['scale']}
          size="large"
        />
      </div>
      <p className="component-description">
        A markdown viewer component with expand/collapse functionality:
      </p>
      <ReadmeViewer
        content={sampleReadme}
        isExpanded={showReadme}
        onToggle={() => setShowReadme(!showReadme)}
      />
    </div>
  );

  const renderFileContainerShowcase = () => (
    <div className={`showcase-item ${showFileContainer ? 'file-container-active' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <Button
          label={showFileContainer ? "Close Container" : "View File Container"}
          onClick={() => setShowFileContainer(!showFileContainer)}
          variant="action"
          effects={['scale']}
          size="large"
        />
      </div>
      <p className="component-description">
        A file container component with truncated filenames and hover effects:
      </p>
      <div className={`file-container-wrapper ${showFileContainer ? 'visible' : ''}`}>
        <FileContainer files={sampleFiles} maxNameLength={20} />
      </div>
    </div>
  );

  return (
    <div className="page">
      <Breadcrumb items={[
        { label: '/home', href: '/' },
        { label: '/components', href: '/components' }
      ]} />
      <h1>Components Library</h1>
      <p>This is a showcase of the components library. Each component is scaled down to fit the component container. I've added CSS variables to make their size customizable.</p>
      <div className="section-buttons-container">
        <Button
          label="Buttons"
          onClick={() => toggleSection('buttons')}
          variant="text"
          effects={['scale', 'underline']}
          size="large"
          isActive={visibleSection === 'buttons'}
        />
        <Button
          label="Forms"
          onClick={() => toggleSection('forms')}
          variant="text"
          effects={['scale', 'underline']}
          size="large"
          isActive={visibleSection === 'forms'}
        />
        <Button
          label="Files"
          onClick={() => toggleSection('files')}
          variant="text"
          effects={['scale', 'underline']}
          size="large"
          isActive={visibleSection === 'files'}
        />
      </div>

      <div className="showcase-container">
        <div className={`showcase-grid ${visibleSection === 'buttons' ? 'visible' : ''}`}>
          {renderButtonShowcase()}
          {renderGameShowcase()}
        </div>

        <div className={`showcase-grid ${visibleSection === 'forms' ? 'visible' : ''}`}>
          {renderFormsShowcase()}
        </div>

        <div className={`showcase-grid ${visibleSection === 'files' ? 'visible' : ''}`}>
          {renderReadmeViewerShowcase()}
          {renderFileContainerShowcase()}
        </div>
      </div>

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Modal Title">
          <p>This is the modal component.</p>
        </Modal>
      )}
    </div>
  );
};

export default ComponentsShowcase;

