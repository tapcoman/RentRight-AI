import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  textColor?: string;
  accentColor?: string;
  withBackground?: boolean;
  as?: 'div' | 'span' | 'h1' | 'h2';
}

export function Logo({ 
  size = 'md', 
  textColor = 'text-white', 
  accentColor = 'text-[#EC7134]',
  withBackground = true,
  as = 'div'
}: LogoProps) {
  
  // Font size based on size prop
  const fontSizeClass = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  }[size];
  
  // Badge size based on size prop
  const badgeSizeClass = {
    sm: 'text-[9px] px-1 py-0.5',
    md: 'text-xs px-1.5 py-0.5',
    lg: 'text-sm px-2 py-0.5'
  }[size];
  
  // Badge margin based on size prop
  const badgeMarginClass = {
    sm: 'ml-0.5',
    md: 'ml-1',
    lg: 'ml-1.5'
  }[size];
  
  const Container = as;
  
  return (
    <Container className="flex items-center">
      <span className={`${fontSizeClass} font-bold tracking-tighter ${textColor}`}>
        Rent<span className={accentColor}>Right</span>
      </span>
      {withBackground ? (
        <span className={`${badgeMarginClass} inline-flex items-center justify-center rounded-full bg-[#EC7134] ${badgeSizeClass} font-medium text-white`}>
          AI
        </span>
      ) : (
        <span className={`${badgeMarginClass} inline-flex items-center justify-center ${badgeSizeClass} font-medium ${accentColor}`}>
          AI
        </span>
      )}
    </Container>
  );
}