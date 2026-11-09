import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const containerSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  return (
    <div className={`relative flex items-center justify-center bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden ${containerSizes[size]} ${className}`}>
      <img 
        src="/logo.png" 
        alt="Rupasinghe Capital HR" 
        className="w-full h-full object-contain p-1"
      />
    </div>
  );
}
