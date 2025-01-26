import React, { forwardRef } from 'react';

interface ObstacleProps {
  gameOver: boolean;
}

/**
 * Obstacle component for the Dino game
 * Represents moving obstacles that the player must avoid
 * 
 * @component
 * @see DinoGame.css for animation and styling
 */
export const Obstacle = forwardRef<HTMLDivElement, ObstacleProps>(
  ({ gameOver }, ref) => (
    <div
      ref={ref}
      className={`obstacle ${gameOver ? 'stopped' : ''}`}
      aria-label="game-obstacle"
    />
  )
);

Obstacle.displayName = 'Obstacle';