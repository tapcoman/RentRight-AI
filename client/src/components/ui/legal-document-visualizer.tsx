import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedDocument } from './animated-document';

interface LegalDocumentVisualizerProps {
  documentId: string;
  insightCount: number;
  issueCount: number;
  complianceLevel: 'green' | 'gray' | 'red';
  totalPages?: number;
  className?: string;
}

export function LegalDocumentVisualizer({
  documentId,
  insightCount,
  issueCount,
  complianceLevel,
  totalPages = 5,
  className = '',
}: LegalDocumentVisualizerProps) {
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  
  // Auto-animate the analysis progress
  useEffect(() => {
    const timer1 = setTimeout(() => setShowOverlay(true), 1500);
    const timer2 = setTimeout(() => setIsAnalyzed(true), 3500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);
  
  // Determine the color scheme based on compliance level
  const statusColor = 
    complianceLevel === 'green' 
      ? '#48BB78' // green
      : complianceLevel === 'gray' 
        ? '#64748b' // slate gray
        : '#F56565'; // red
  
  const statusText = 
    complianceLevel === 'green' 
      ? 'Compliant' 
      : complianceLevel === 'gray' 
        ? 'Review Suggested' 
        : 'Issues Detected';
  
  return (
    <div className={`relative ${className}`}>
      {/* Document visualization */}
      <div className="relative">
        <AnimatedDocument documentId={documentId} totalPages={totalPages} />
        
        {/* Analysis overlay */}
        <AnimatePresence>
          {showOverlay && (
            <motion.div 
              className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
            >
              {!isAnalyzed ? (
                <motion.div 
                  className="text-white flex flex-col items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <svg className="w-12 h-12 mb-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="font-medium">Analyzing Document...</span>
                </motion.div>
              ) : (
                <motion.div 
                  className="bg-white/90 backdrop-blur-sm p-5 rounded-lg shadow-xl max-w-xs"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  {/* Status icon */}
                  <div className="mb-3 flex justify-center">
                    <motion.div 
                      className="rounded-full w-14 h-14 flex items-center justify-center"
                      style={{ backgroundColor: `${statusColor}20` }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                    >
                      {complianceLevel === 'green' && (
                        <svg className={`w-8 h-8 text-${statusColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      
                      {complianceLevel === 'gray' && (
                        <svg className={`w-8 h-8 text-${statusColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      )}
                      
                      {complianceLevel === 'red' && (
                        <svg className={`w-8 h-8 text-${statusColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </motion.div>
                  </div>
                  
                  <h3 className="text-center font-semibold text-gray-800 mb-1">
                    Analysis Complete
                  </h3>
                  
                  <p className="text-center text-sm text-gray-600 mb-4">
                    RentRight AI has identified key insights for your tenancy agreement.
                  </p>
                  
                  {/* Status badge */}
                  <div 
                    className="text-center py-1 px-3 rounded-full text-sm font-medium mb-3 mx-auto w-max"
                    style={{ 
                      backgroundColor: `${statusColor}20`,
                      color: statusColor
                    }}
                  >
                    {statusText}
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-gray-100 p-2 rounded">
                      <div className="text-lg font-semibold text-gray-800">{insightCount}</div>
                      <div className="text-xs text-gray-500">Key Insights</div>
                    </div>
                    <div className="bg-gray-100 p-2 rounded">
                      <div className="text-lg font-semibold text-gray-800">{issueCount}</div>
                      <div className="text-xs text-gray-500">Issues Found</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}