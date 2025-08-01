import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mascotImage from '../../assets/mascot.png';

interface MascotProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl'; // Added XXL size option
  withKey?: boolean; // Keep this for backward compatibility but ignore it
  withMagnifier?: boolean;
  glowing?: boolean;
  className?: string;
  withBadges?: boolean; // New option to show decorative badges
}

export function Mascot({ 
  size = 'md',
  withKey = false, // ignored parameter kept for backward compatibility
  withMagnifier = true,
  glowing = false,
  className = '',
  withBadges = false
}: MascotProps) {
  // State for magnifying glass animation
  const [magnifierState, setMagnifierState] = useState<'hidden' | 'hover' | 'shrink'>('hidden');
  
  // State for badge animation
  const [activeBadge, setActiveBadge] = useState<number>(0);
  
  // Badge cycler
  useEffect(() => {
    if (!withBadges) return;
    
    const badgeInterval = setInterval(() => {
      setActiveBadge(prev => (prev + 1) % 4); // Rotate through 4 badges
    }, 3000); // Change badges every 3 seconds
    
    return () => clearInterval(badgeInterval);
  }, [withBadges]);
  
  // Loop animation for magnifying glass
  useEffect(() => {
    if (!withMagnifier) return;
    
    let timeoutId: NodeJS.Timeout;
    
    // Animation sequence function that can be called recursively
    const animateSequence = () => {
      // Step 1: Begin with hidden state (wait 1s)
      timeoutId = setTimeout(() => {
        // Step 2: Show magnifier hovering over document
        setMagnifierState('hover');
        
        timeoutId = setTimeout(() => {
          // Step 3: Begin shrinking and moving away
          setMagnifierState('shrink');
          
          timeoutId = setTimeout(() => {
            // Step 4: Hide completely and restart sequence
            setMagnifierState('hidden');
            animateSequence(); // Restart the animation loop
          }, 1000);
        }, 2000); // Hover for 2 seconds
      }, 1000);
    };
    
    // Start the animation loop
    animateSequence();
    
    // Cleanup function to clear any pending timeouts
    return () => {
      clearTimeout(timeoutId);
    };
  }, [withMagnifier]); // Only re-run if withMagnifier changes
  
  // Size mapping
  const sizeMap = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-36 h-36',
    xl: 'w-64 h-64', // Increased XL size
    xxl: 'w-80 h-80' // Even larger XXL size
  };

  const sizeClass = sizeMap[size] || 'w-64 h-64'; // Fallback to xl size if invalid size provided
  
  return (
    <div className={`relative ${sizeClass} ${className}`}>
      {/* Document image with enhanced shadow */}
      <div className={`relative ${glowing ? 'drop-shadow-[0_0_20px_rgba(236,113,52,0.25)]' : ''}`}>
        <img 
          src={mascotImage} 
          alt="Document Mascot" 
          className="w-full h-full object-contain"
        />
      </div>
      
      {/* Rotating persuasive badges - only shown when withBadges is true */}
      {withBadges && (
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex justify-center min-h-[36px] w-full">
          <AnimatePresence mode="wait">
            {activeBadge === 0 && (
              <motion.div 
                key="badge1"
                className="bg-[#EC7134] text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg whitespace-nowrap absolute"
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-9.618 5.04L3 8a9 9 0 009 9 9 9 0 009-9l-.382-.014z" />
                  </svg>
                  Save £1000s in landlord disputes
                </span>
              </motion.div>
            )}
            
            {activeBadge === 1 && (
              <motion.div 
                key="badge2"
                className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg whitespace-nowrap absolute"
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Protect against unfair eviction
                </span>
              </motion.div>
            )}
            
            {activeBadge === 2 && (
              <motion.div 
                key="badge3"
                className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg whitespace-nowrap absolute"
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M3 3h18v18H3zM9 9l6 6M15 9l-6 6" />
                  </svg>
                  Stop illegal fees & charges
                </span>
              </motion.div>
            )}
            
            {activeBadge === 3 && (
              <motion.div 
                key="badge4"
                className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg whitespace-nowrap absolute"
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Know your deposit rights
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      
      {/* Animated magnifying glass */}
      {withMagnifier && (
        <AnimatePresence>
          {magnifierState !== 'hidden' && (
            <motion.div
              initial={magnifierState === 'hover' ? 
                { opacity: 0, x: 50, y: 20, scale: 0.3, rotate: 12 } : 
                { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }
              }
              animate={magnifierState === 'hover' ? 
                { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 } : 
                { opacity: 0, x: 30, y: -30, scale: 0.2, rotate: -12 }
              }
              exit={{ opacity: 0, scale: 0, rotate: -45 }}
              transition={{ 
                duration: 0.5, 
                ease: "easeInOut",
                scale: { type: "spring", stiffness: 200 }
              }}
              className="absolute"
              style={{
                left: magnifierState === 'hover' ? '60%' : 'auto',
                right: magnifierState === 'hover' ? 'auto' : '-36px',
                top: magnifierState === 'hover' ? '40%' : 'auto',
                bottom: magnifierState === 'hover' ? 'auto' : '-10px',
                zIndex: 10
              }}
            >
              <svg viewBox="0 0 100 100" className="w-2/5 md:w-1/2 h-2/5 md:h-1/2 drop-shadow-md">
                <circle cx="40" cy="40" r="25" fill="#E0F7FA" stroke="#424242" strokeWidth="8" />
                <rect 
                  x="55" 
                  y="55" 
                  width="45" 
                  height="12" 
                  rx="6" 
                  transform="rotate(45, 60, 60)"
                  fill="#424242"
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}