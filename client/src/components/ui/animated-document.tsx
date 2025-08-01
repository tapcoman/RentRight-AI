import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedDocumentProps {
  documentId: string;
  totalPages?: number;
}

export function AnimatedDocument({
  documentId,
  totalPages = 5
}: AnimatedDocumentProps) {
  const [hoveredPage, setHoveredPage] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);

  // Auto-animation for initial display
  useEffect(() => {
    const interval = setInterval(() => {
      setHoveredPage((prev) => {
        if (prev === null || prev >= totalPages - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, 2000);

    // Stop auto-animation after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setIsAnimating(false);
      setHoveredPage(null);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [totalPages]);

  // Generate an array of pages
  const pages = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <div className="relative w-full h-64 md:h-80 flex items-center justify-center perspective-800">
      <div 
        className="relative w-[200px] h-[280px] transform-style-3d"
        onMouseLeave={() => !isAnimating && setHoveredPage(null)}
      >
        {pages.map((pageIndex) => (
          <motion.div
            key={`page-${pageIndex}`}
            className="absolute top-0 left-0 w-full h-full bg-white rounded-md shadow-lg"
            style={{
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
              zIndex: totalPages - pageIndex,
            }}
            initial={{ 
              rotateY: 0,
              x: pageIndex * 2,
              y: pageIndex * 2
            }}
            animate={{ 
              rotateY: hoveredPage === pageIndex ? 20 : 0,
              x: hoveredPage === pageIndex 
                ? pageIndex * 10 + 40 
                : hoveredPage !== null && hoveredPage < pageIndex 
                  ? pageIndex * 2
                  : pageIndex * 2,
              y: pageIndex * 2,
              transition: { duration: 0.5 }
            }}
            onMouseEnter={() => !isAnimating && setHoveredPage(pageIndex)}
            whileHover={!isAnimating ? { scale: 1.02 } : {}}
          >
            {/* Document Content */}
            <div className="p-4 w-full h-full flex flex-col">
              {/* Header with document ID */}
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <div className="text-xs text-gray-500">RentRight AI</div>
                <div className="text-xs text-gray-500">ID: {String(documentId).substring(0, 6)}...</div>
              </div>
              
              {/* Fake content lines */}
              <div className="flex-grow flex flex-col space-y-2">
                {Array.from({ length: 8 }, (_, i) => (
                  <div 
                    key={`line-${i}`} 
                    className="h-2 rounded-full bg-gray-200"
                    style={{ width: `${Math.random() * 60 + 40}%` }}
                  />
                ))}
                
                {/* Page number */}
                <div className="mt-auto text-center text-xs text-gray-400">
                  Page {pageIndex + 1} of {totalPages}
                </div>
              </div>
            </div>
            
            {/* 3D page edge effect */}
            <div 
              className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-l from-gray-300 to-transparent"
              style={{ transform: "translateZ(0.5px)" }}
            />
          </motion.div>
        ))}
        
        {/* Interactive instructions */}
        <AnimatePresence>
          {!isAnimating && hoveredPage === null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-[110%] left-0 w-full text-center text-sm text-gray-500"
            >
              Hover over pages to interact
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function DocumentScanEffect({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.div
        className="absolute top-0 left-0 w-full h-8 bg-gradient-to-r from-transparent via-sky-400/30 to-transparent"
        initial={{ y: -20 }}
        animate={{ y: '100%' }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear"
        }}
      />
      {/* Content goes here */}
    </div>
  );
}