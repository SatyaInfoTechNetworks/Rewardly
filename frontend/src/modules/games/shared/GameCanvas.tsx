import React, { useRef, useEffect } from 'react';

interface GameCanvasProps {
  onUpdate: (dt: number) => void;
  onRender: (ctx: CanvasRenderingContext2D, interpolation: number) => void;
  width?: number;
  height?: number;
}

export function GameCanvas({ onUpdate, onRender, width = 320, height = 480 }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = performance.now();
    let accumulator = 0;
    const step = 1 / 60;

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.25);
      lastTime = currentTime;
      accumulator += dt;

      while (accumulator >= step) {
        onUpdate(step);
        accumulator -= step;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onRender(ctx, accumulator / step);
      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [onUpdate, onRender]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      style={{ 
        width: '100%', 
        height: '100%', 
        objectFit: 'contain',
        background: '#70c5ce',
        borderRadius: '12px',
        touchAction: 'none'
      }} 
    />
  );
}
