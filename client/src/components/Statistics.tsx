import React from 'react';

interface StatisticsProps {
  className?: string;
  variant?: 'dark' | 'light';
}

/**
 * Statistics component displaying key metrics
 * Can be rendered with dark or light background variants
 */
export function Statistics({ className = '', variant = 'dark' }: StatisticsProps) {
  const isDark = variant === 'dark';
  
  const containerClass = isDark 
    ? 'bg-gray-800/50 text-white' 
    : 'bg-white/90 text-gray-900 shadow-sm';
  
  const labelClass = isDark
    ? 'text-xs text-gray-400'
    : 'text-xs text-gray-500';

  return (
    <div className={`flex items-center justify-between py-3 px-4 rounded-md ${containerClass} ${className}`}>
      <div className="text-center">
        <p className="text-lg md:text-xl font-bold mb-0">97%</p>
        <p className={labelClass}>Issue detection rate</p>
      </div>
      <div className="text-center">
        <p className="text-lg md:text-xl font-bold mb-0">£850+</p>
        <p className={labelClass}>Avg. savings per tenant</p>
      </div>
      <div className="text-center">
        <p className="text-lg md:text-xl font-bold mb-0">4.9/5</p>
        <p className={labelClass}>Customer rating</p>
      </div>
    </div>
  );
}

export default Statistics;