import React, { forwardRef } from 'react';

interface PlayerProps {
  isJumping: boolean;
}

/**
 * Player component for the Dino game
 * Represents the player character that can jump over obstacles
 * 
 * @component
 * @see DinoGame.css for styling
 */
export const Player = forwardRef<HTMLDivElement, PlayerProps>(
  ({ isJumping }, ref) => (
    <div
      ref={ref}
      className={`player ${isJumping ? 'jump' : ''}`}
      aria-label="game-player"
    />
  )
);

Player.displayName = 'Player';