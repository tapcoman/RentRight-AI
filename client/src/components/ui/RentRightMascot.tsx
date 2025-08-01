import React, { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface RentRightMascotProps extends HTMLAttributes<HTMLDivElement> {
  waving?: boolean;
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export function RentRightMascot({ 
  waving = false, 
  size = 'md', 
  message,
  className,
  ...props 
}: RentRightMascotProps) {
  // Size mappings
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };
  
  // Message bubble size based on mascot size
  const messageBubbleSizes = {
    sm: 'max-w-[120px] text-xs',
    md: 'max-w-[180px] text-sm',
    lg: 'max-w-[240px] text-base',
  };

  return (
    <div className={cn("relative flex flex-col items-center", className)} {...props}>
      {/* Speech bubble - conditional rendering */}
      {message && (
        <div className={cn(
          "bg-white p-3 rounded-lg shadow-md mb-2 relative z-10",
          messageBubbleSizes[size]
        )}>
          <p className="text-gray-700">{message}</p>
          {/* Little pointer at the bottom of speech bubble */}
          <div className="absolute w-3 h-3 bg-white transform rotate-45 -bottom-1.5 left-1/2 -translate-x-1/2"></div>
        </div>
      )}
      
      <div className="relative">
        {/* Mascot container - softer gradient and border */}
        <div className={cn(
          "relative bg-gradient-to-br from-[#5EB2FF] to-[#3875B5] rounded-full flex items-center justify-center shadow-lg border-2 border-white",
          sizeClasses[size]
        )}>
          {/* Mascot face - much cuter design */}
          <div className="absolute inset-[15%] bg-white rounded-full flex items-center justify-center overflow-hidden">
            {/* Super cute eyes - larger and rounder with bigger shine */}
            <div className="absolute top-[25%] left-[25%] w-[18%] h-[18%] bg-black rounded-full">
              <div className="absolute top-[15%] left-[15%] w-[40%] h-[40%] bg-white rounded-full"></div>
              <div className="absolute bottom-[20%] right-[15%] w-[25%] h-[25%] bg-white rounded-full opacity-70"></div>
            </div>
            <div className="absolute top-[25%] right-[25%] w-[18%] h-[18%] bg-black rounded-full">
              <div className="absolute top-[15%] left-[15%] w-[40%] h-[40%] bg-white rounded-full"></div>
              <div className="absolute bottom-[20%] right-[15%] w-[25%] h-[25%] bg-white rounded-full opacity-70"></div>
            </div>
            
            {/* Cute smile - curvier and more pronounced */}
            <div className="absolute bottom-[30%] left-1/2 transform -translate-x-1/2 w-[50%] h-[16%]">
              <svg viewBox="0 0 100 50" className="w-full h-full">
                <path d="M10,20 Q50,50 90,20" stroke="black" strokeWidth="5" fill="none" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          
          {/* Waving arm - cute and round with more defined animation */}
          {waving && (
            <div className="absolute -right-2 top-[40%] origin-left">
              <div className="w-[60%] h-[10px] bg-white rounded-full animate-wave">
                {/* Cute little hand with better definition */}
                <div className="absolute right-[-10px] top-[-8px] w-[20px] h-[20px] bg-white rounded-full border border-gray-300 shadow"></div>
              </div>
            </div>
          )}
          
          {/* Static arm if not waving */}
          {!waving && (
            <div className="absolute -right-1 top-1/2">
              <div className="w-[40%] h-[10px] bg-white rounded-full">
                {/* Cute little hand */}
                <div className="absolute right-[-8px] top-[-6px] w-[18px] h-[18px] bg-white rounded-full border border-gray-200 shadow-sm"></div>
              </div>
            </div>
          )}
          
          {/* Left arm */}
          <div className="absolute -left-1 top-1/2">
            <div className="w-[40%] h-[10px] bg-white rounded-full">
              {/* Cute little hand */}
              <div className="absolute left-[-8px] top-[-6px] w-[18px] h-[18px] bg-white rounded-full border border-gray-200 shadow-sm"></div>
            </div>
          </div>
        </div>
        
        {/* RentRight tag under mascot */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-[#EC7134] text-white text-xs px-2 py-0.5 rounded-full shadow-md">
          RentRight
        </div>
      </div>
    </div>
  );
}