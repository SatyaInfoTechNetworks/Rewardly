"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameCanvas } from '../shared/GameCanvas';
import { InputManager } from '../engine/InputManager';
import { analytics } from '@/modules/analytics/tracker';
import styles from './FlappyGame.module.css';

interface FlappyGameProps {
  onGameOver: (score: number) => void;
  config?: any;
}

export function FlappyGame({ onGameOver, config }: FlappyGameProps) {
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const inputRef = useRef<InputManager | null>(null);
  
  // Game state refs (for the loop)
  const bird = useRef({ x: 50, y: 200, velocity: 0, radius: 12 });
  const pipes = useRef<any[]>([]);
  const frameCount = useRef(0);
  const currentScore = useRef(0);

  const GRAVITY = config?.gravity || 0.25;
  const JUMP_FORCE = config?.jumpForce || -5;
  const PIPE_SPEED = config?.pipeSpeed || 2;
  const PIPE_GAP = config?.pipeGap || 120;
  const PIPE_SPAWN_RATE = 100;

  useEffect(() => {
    inputRef.current = new InputManager();
    return () => inputRef.current?.dispose();
  }, []);

  const resetGame = () => {
    bird.current = { x: 50, y: 200, velocity: 0, radius: 12 };
    pipes.current = [];
    frameCount.current = 0;
    currentScore.current = 0;
    setScore(0);
    setGameState('playing');
  };

  const update = useCallback((dt: number) => {
    if (gameState !== 'playing') {
      if (inputRef.current?.getLastInputTime() && gameState === 'idle') {
        resetGame();
      } else if (inputRef.current?.getLastInputTime() && gameState === 'gameover') {
        // Debounce restart
        if (performance.now() - inputRef.current.getLastInputTime() < 500) {
           resetGame();
        }
      }
      return;
    }

    // Input
    if (inputRef.current?.getLastInputTime() && performance.now() - inputRef.current.getLastInputTime() < 20) {
      bird.current.velocity = JUMP_FORCE;
    }

    // Physics
    bird.current.velocity += GRAVITY;
    bird.current.y += bird.current.velocity;

    // Ground/Ceiling collision
    if (bird.current.y > 480 - bird.current.radius || bird.current.y < bird.current.radius) {
      endGame();
    }

    // Pipes
    frameCount.current++;
    if (frameCount.current % PIPE_SPAWN_RATE === 0) {
      const gapY = Math.random() * (480 - PIPE_GAP - 100) + 50;
      pipes.current.push({ x: 320, gapY, passed: false });
    }

    pipes.current.forEach((pipe, index) => {
      pipe.x -= PIPE_SPEED;

      // Collision
      if (
        bird.current.x + bird.current.radius > pipe.x &&
        bird.current.x - bird.current.radius < pipe.x + 50
      ) {
        if (bird.current.y - bird.current.radius < pipe.gapY || bird.current.y + bird.current.radius > pipe.gapY + PIPE_GAP) {
          endGame();
        }
      }

      // Score
      if (!pipe.passed && pipe.x < bird.current.x) {
        pipe.passed = true;
        currentScore.current++;
        setScore(currentScore.current);
      }
    });

    // Remove off-screen pipes
    if (pipes.current.length > 0 && pipes.current[0].x < -50) {
      pipes.current.shift();
    }
  }, [gameState, GRAVITY, JUMP_FORCE, PIPE_SPEED, PIPE_GAP]);

  const render = useCallback((ctx: CanvasRenderingContext2D, interpolation: number) => {
    // Draw Sky
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, 320, 480);

    // Draw Pipes
    ctx.fillStyle = '#2ecc71';
    pipes.current.forEach(pipe => {
      // Top pipe
      ctx.fillRect(pipe.x, 0, 50, pipe.gapY);
      // Bottom pipe
      ctx.fillRect(pipe.x, pipe.gapY + PIPE_GAP, 50, 480 - (pipe.gapY + PIPE_GAP));
      
      // Pipe caps
      ctx.fillStyle = '#27ae60';
      ctx.fillRect(pipe.x - 2, pipe.gapY - 20, 54, 20);
      ctx.fillRect(pipe.x - 2, pipe.gapY + PIPE_GAP, 54, 20);
      ctx.fillStyle = '#2ecc71';
    });

    // Draw Bird
    ctx.save();
    ctx.translate(bird.current.x, bird.current.y);
    ctx.rotate(Math.min(Math.PI / 4, Math.max(-Math.PI / 4, bird.current.velocity * 0.1)));
    
    // Body
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(0, 0, bird.current.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(6, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(8, -4, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Wing
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.ellipse(-4, 2, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();

    // UI Overlays
    if (gameState === 'idle') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,320,480);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FLAPPY BIRD', 160, 200);
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText('Tap to Start', 160, 240);
    }

    if (gameState === 'gameover') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,320,480);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 32px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', 160, 200);
      ctx.font = '24px Inter, sans-serif';
      ctx.fillText(`Score: ${currentScore.current}`, 160, 250);
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText('Tap to Restart', 160, 300);
    }
  }, [gameState, PIPE_GAP]);

  const endGame = () => {
    setGameState('gameover');
    analytics.track(analytics.events.GAME.CRASHED, {
      game_slug: 'flappy-bird',
      score: currentScore.current
    });
    onGameOver(currentScore.current);
  };

  return (
    <div className={styles.gameContainer}>
      <div className={styles.scoreBoard}>
        {score}
      </div>
      <GameCanvas 
        onUpdate={update} 
        onRender={render} 
        width={320} 
        height={480} 
      />
    </div>
  );
}
