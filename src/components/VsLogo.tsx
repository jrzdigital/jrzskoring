import React from 'react';

interface VsLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  alt?: string;
  style?: React.CSSProperties;
}

const sizeClasses = {
  xs: 'h-3.5 w-auto object-contain inline-block drop-shadow-sm select-none',
  sm: 'h-5 w-auto object-contain inline-block drop-shadow-sm select-none',
  md: 'h-8 w-auto object-contain inline-block drop-shadow-md select-none',
  lg: 'h-12 w-auto object-contain inline-block drop-shadow-lg select-none',
  xl: 'h-16 w-auto object-contain inline-block drop-shadow-xl select-none',
  custom: 'select-none',
};

export const VsLogo: React.FC<VsLogoProps> = ({
  className = '',
  size = 'sm',
  alt = 'VS',
  style,
}) => {
  return (
    <img
      src="/vs.png"
      alt={alt}
      className={`${sizeClasses[size]} ${className}`}
      style={style}
      loading="lazy"
      draggable={false}
    />
  );
};

export default VsLogo;
