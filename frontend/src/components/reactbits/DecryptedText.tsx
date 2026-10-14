import React, { useEffect, useState } from 'react';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: 'start' | 'end' | 'center';
  className?: string;
  characters?: string;
}

export const DecryptedText: React.FC<DecryptedTextProps> = ({
  text,
  speed = 40,
  maxIterations = 10,
  className = '',
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()',
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [isHovered, setIsHovered] = useState(false);

  const decrypt = () => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) {
              return text[index];
            }
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join('')
      );

      if (iteration >= text.length) {
        clearInterval(interval);
      }
      iteration += 1 / (maxIterations / text.length || 1);
    }, speed);

    return () => clearInterval(interval);
  };

  useEffect(() => {
    const cleanup = decrypt();
    return cleanup;
  }, [text]);

  const handleMouseEnter = () => {
    if (!isHovered) {
      setIsHovered(true);
      decrypt();
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <span
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`inline-block font-mono tracking-tight cursor-default select-none ${className}`}
    >
      {displayText}
    </span>
  );
};
