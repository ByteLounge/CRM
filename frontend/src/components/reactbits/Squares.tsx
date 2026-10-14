import React, { useEffect, useRef } from 'react';

interface SquaresProps {
  direction?: 'diagonal' | 'up' | 'right' | 'down' | 'left';
  speed?: number;
  borderColor?: string;
  squareSize?: number;
  hoverFillColor?: string;
  className?: string;
}

export const Squares: React.FC<SquaresProps> = ({
  direction = 'diagonal',
  speed = 0.5,
  borderColor = 'rgba(99, 102, 241, 0.08)',
  squareSize = 40,
  hoverFillColor = 'rgba(99, 102, 241, 0.15)',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridOffset = useRef({ x: 0, y: 0 });
  const hoveredSquare = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const numCols = Math.ceil(canvas.width / squareSize) + 2;
      const numRows = Math.ceil(canvas.height / squareSize) + 2;

      ctx.lineWidth = 0.5;
      ctx.strokeStyle = borderColor;

      for (let col = -1; col < numCols; col++) {
        for (let row = -1; row < numRows; row++) {
          const x = col * squareSize + (gridOffset.current.x % squareSize);
          const y = row * squareSize + (gridOffset.current.y % squareSize);

          if (
            hoveredSquare.current &&
            hoveredSquare.current.x === col &&
            hoveredSquare.current.y === row
          ) {
            ctx.fillStyle = hoverFillColor;
            ctx.fillRect(x, y, squareSize, squareSize);
          }

          ctx.strokeRect(x, y, squareSize, squareSize);
        }
      }

      // Update grid offset
      switch (direction) {
        case 'diagonal':
          gridOffset.current.x += speed;
          gridOffset.current.y += speed;
          break;
        case 'up':
          gridOffset.current.y -= speed;
          break;
        case 'down':
          gridOffset.current.y += speed;
          break;
        case 'left':
          gridOffset.current.x -= speed;
          break;
        case 'right':
          gridOffset.current.x += speed;
          break;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const col = Math.floor((mouseX - (gridOffset.current.x % squareSize)) / squareSize);
      const row = Math.floor((mouseY - (gridOffset.current.y % squareSize)) / squareSize);

      hoveredSquare.current = { x: col, y: row };
    };

    const handleMouseLeave = () => {
      hoveredSquare.current = null;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [direction, speed, borderColor, squareSize, hoverFillColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-auto ${className}`}
    />
  );
};
