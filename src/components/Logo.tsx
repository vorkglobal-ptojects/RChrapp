import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const containerSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const logoUrl = "https://xtmzwvoloilxjcjgbgfx.supabase.co/storage/v1/object/public/branding/logo.png";

  return (
    <div className={`relative flex items-center justify-center bg-black rounded-full shadow-lg overflow-hidden ${containerSizes[size]} ${className}`}>
      <img 
        src={logoUrl} 
        alt="HR Pulse" 
        className="w-full h-full object-cover"
        style={{ filter: 'brightness(1.1)' }}
      />
    </div>
  );
}
