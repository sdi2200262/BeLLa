import React from 'react';
import './Button.css';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'text' | 'action';
  effects?: ('underline' | 'slide' | 'scale')[];
  size?: 'normal' | 'large';
  isActive?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

// Button component
const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  variant = 'text',
  effects = [],
  size = 'normal',
  isActive = false,
  type,
  className = ''
}) => {

  // Get class name
  const getClassName = () => {
    const baseClass = variant === 'action' ? 'action_button' : 'button_just_text';
    const sizeClass = size === 'large' ? `${baseClass}_large` : '';
    const effectClasses = effects.map(effect => `${baseClass}_${effect}`);
    const activeClass = isActive ? 'active' : '';
    
    return [baseClass, sizeClass, ...effectClasses, activeClass, className]
      .filter(Boolean)
      .join(' ');
  };

  // Render button
  return (
    <button 
      className={getClassName()} 
      onClick={onClick} 
      type={type || 'button'}
    >
      {label}
    </button>
  );
};

export default Button;
