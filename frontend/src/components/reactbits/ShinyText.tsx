import React from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 4,
  className = '',
}) => {
  return (
    <span
      className={`inline-block font-semibold bg-clip-text text-transparent bg-gradient-to-r from-neutral-500 via-neutral-100 to-neutral-500 dark:from-neutral-400 dark:via-white dark:to-neutral-400 ${
        disabled ? '' : 'animate-shine'
      } ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(120deg, rgba(255, 255, 255, 0) 30%, rgba(255, 255, 255, 0.95) 50%, rgba(255, 255, 255, 0) 70%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        animationDuration: `${speed}s`,
      }}
    >
      {text}
    </span>
  );
};
