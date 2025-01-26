import React, { useEffect, useRef, useState } from 'react';
import './DinoGame.css';
import { Player } from './Player';
import { Obstacle } from './Obstacle';
import { useGameLoop } from './useGameLoop';

interface DinoGameProps {
  useSpacebar?: boolean;
}

/**
 * Main DinoGame component
 * A simple jumping game where player must avoid obstacles
 */
const DinoGame: React.FC<DinoGameProps> = ({ useSpacebar = false }) => {
  const [isJumping, setIsJumping] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isCollided, setIsCollided] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const obstacleRef = useRef<HTMLDivElement>(null);

  /**
   * Handles the jump action
   */
  const handleJump = () => {
    if (!isJumping && !gameOver) {
      setIsJumping(true);
      setTimeout(() => setIsJumping(false), 500);
    }
  };

  /**
   * Resets the game state
   */
  const resetGame = () => {
    setGameOver(false);
    setScore(0);
    setIsJumping(false);
    setIsCollided(false);
    
    // Reset obstacle position by removing and re-adding the animation
    if (obstacleRef.current) {
      obstacleRef.current.style.animation = 'none';
      obstacleRef.current.offsetHeight; // Trigger reflow
      obstacleRef.current.style.animation = 'moveLeft 2s linear infinite';
    }
  };

  /**
   * Handles key presses for jumping
   */
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((useSpacebar && e.code === 'Space') || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [useSpacebar, isJumping, gameOver]);

  /**
   * Checks for collision between player and obstacle
   */
  const checkCollision = () => {
    if (playerRef.current && obstacleRef.current) {
      const player = playerRef.current.getBoundingClientRect();
      const obstacle = obstacleRef.current.getBoundingClientRect();

      return !(
        player.right < obstacle.left ||
        player.left > obstacle.right ||
        player.bottom < obstacle.top ||
        player.top > obstacle.bottom
      );
    }
    return false;
  };

  /**
   * Game loop for updating game state
   */
  useGameLoop(() => {
    if (!gameOver && !isCollided) {
      if (checkCollision()) {
        setIsCollided(true);
        setGameOver(true);
        
        // Freeze obstacle at collision point
        if (obstacleRef.current) {
          const currentPosition = obstacleRef.current.getBoundingClientRect();
          obstacleRef.current.style.animation = 'none';
          obstacleRef.current.style.right = `${window.innerWidth - currentPosition.right}px`;
        }
      } else {
        setScore(prev => prev + 1);
      }
    }
  });

  /**
   * Renders the game UI
   */
  return (
    <div className="game-wrapper">
      <div 
        className="game-area" 
        ref={gameRef}
        onClick={handleJump}
      >
        <div className="score">Score: {Math.floor(score / 10)}</div>
        <Player ref={playerRef} isJumping={isJumping} />
        <Obstacle ref={obstacleRef} gameOver={gameOver} />
      </div>
      {gameOver && (
        <div className="game-over-container">
          <div className="game-over-text">Game Over!</div>
          <button 
            className="retry-button"
            onClick={resetGame}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default DinoGame;