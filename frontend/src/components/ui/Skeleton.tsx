import React from 'react';

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`animate-pulse rounded-md bg-muted/70 ${className}`} {...props} />
);
