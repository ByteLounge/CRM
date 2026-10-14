import React, { useEffect, useState } from 'react';

interface CountUpProps {
  to: number;
  from?: number;
  direction?: 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  to,
  from = 0,
  delay = 0,
  duration = 1.6,
  className = '',
  startWhen = true,
  separator = ',',
  decimals = 0,
  prefix = '',
  suffix = '',
}) => {
  const [count, setCount] = useState(from);

  useEffect(() => {
    if (!startWhen) return;
    let startTime: number | null = null;
    let animationFrameId: number;

    const timeoutId = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        // Exponential ease out
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const currentCount = from + (to - from) * ease;
        setCount(currentCount);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setCount(to);
        }
      };
      animationFrameId = requestAnimationFrame(step);
    }, delay * 1000);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrameId);
    };
  }, [to, from, duration, delay, startWhen]);

  const formattedCount = Number(count).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={className}>
      {prefix}
      {separator !== ',' ? formattedCount.replace(/,/g, separator) : formattedCount}
      {suffix}
    </span>
  );
};
