import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// Types for the loading state
type AnalysisStage = 'document-processing' | 'analysis' | 'report-generation';
type AnalysisStatus = 'waiting' | 'active' | 'completed' | 'failed';

// Interface for the loading steps
interface AnalysisStep {
  id: AnalysisStage;
  label: string;
  description: string;
  status: AnalysisStatus;
}

// Props for the LoadingState component
interface LoadingStateProps {
  // Core properties
  title?: string;
  stage?: AnalysisStage;
  progress?: number;
  isPremium?: boolean;
  
  // Error handling
  error?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  
  // Animation customization
  animateProgress?: boolean;
  speedMultiplier?: number;
}

export default function LoadingState({
  title = "Analyzing Your Lease Agreement",
  stage = 'document-processing',
  progress = 0,
  isPremium = false,
  error = false,
  errorMessage = "An unexpected error occurred during processing.",
  onRetry,
  animateProgress = true,
  speedMultiplier = 1
}: LoadingStateProps) {
  // Router integration for navigation
  const [_, setLocation] = useLocation();
  
  // Progress animation state
  const [displayedProgress, setDisplayedProgress] = useState(0);
  
  // Analysis steps configuration
  const analysisSteps: AnalysisStep[] = [
    {
      id: 'document-processing',
      label: 'Document Processing',
      description: 'Extracting text and structure from your document',
      status: stage === 'document-processing' 
        ? 'active' 
        : (stage === 'analysis' || stage === 'report-generation') 
          ? 'completed' 
          : 'waiting'
    },
    {
      id: 'analysis',
      label: isPremium ? 'Premium Analysis' : 'Legal Analysis',
      description: isPremium 
        ? 'Deep analysis of clauses and terms with legal insights' 
        : 'Basic analysis of common lease clauses',
      status: stage === 'analysis' 
        ? 'active' 
        : stage === 'report-generation' 
          ? 'completed' 
          : 'waiting'
    },
    {
      id: 'report-generation',
      label: 'Report Generation',
      description: 'Creating your detailed analysis report',
      status: stage === 'report-generation' ? 'active' : 'waiting'
    }
  ];
  
  // If in error state, mark the current step as failed
  if (error) {
    const currentStepIndex = analysisSteps.findIndex(step => step.id === stage);
    if (currentStepIndex >= 0) {
      analysisSteps[currentStepIndex].status = 'failed';
    }
  }
  
  // Status message handling based on stage
  const getStatusMessage = () => {
    const currentStep = analysisSteps.find(step => step.id === stage);
    
    if (error) {
      return errorMessage;
    }
    
    return currentStep?.description || 'Processing your document...';
  };
  
  // Animated progress bar effect
  useEffect(() => {
    if (!animateProgress || error) return;
    
    // Only animate up to 95% of the actual progress to prevent jumping to 100%
    const targetProgress = Math.min(progress, 95);
    
    // If we're already past the target, don't animate backwards
    if (displayedProgress >= targetProgress) return;
    
    const interval = setInterval(() => {
      setDisplayedProgress(current => {
        // Calculate how quickly to increase based on current progress
        let increment = 0.4 * speedMultiplier;
        
        // Slow down as we approach target
        if (current > targetProgress * 0.7) {
          increment = 0.2 * speedMultiplier;
        }
        
        const newProgress = Math.min(current + increment, targetProgress);
        
        // Stop the interval if we've reached the target
        if (newProgress >= targetProgress) {
          clearInterval(interval);
        }
        
        return newProgress;
      });
    }, 50);
    
    return () => clearInterval(interval);
  }, [progress, animateProgress, error, speedMultiplier, displayedProgress]);
  
  // When we reach 100%, show the actual 100%
  useEffect(() => {
    if (progress >= 100) {
      setDisplayedProgress(100);
    }
  }, [progress]);
  
  // Dynamic background based on the current stage
  const getBackgroundStyle = () => {
    if (error) {
      return "bg-gradient-to-b from-red-900/90 to-slate-900";
    }
    
    if (isPremium) {
      return "bg-gradient-to-b from-indigo-900/90 to-slate-900";
    }
    
    return "bg-gradient-to-b from-sky-900/90 to-slate-900";
  };
  
  // Rotating messages about the process
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = [
    "Scanning through lease clauses for legal issues...",
    "Identifying tenant rights and obligations...",
    "Evaluating deposit protection compliance...",
    "Checking for unfair terms in your agreement...",
    "Analyzing renewal and termination conditions...",
    "Evaluating rent increase provisions...",
    "Checking maintenance and repair obligations..."
  ];
  
  // Rotate through messages every few seconds
  useEffect(() => {
    if (error) return;
    
    const messageInterval = setInterval(() => {
      setMessageIndex(current => (current + 1) % messages.length);
    }, 3500);
    
    return () => clearInterval(messageInterval);
  }, [error, messages.length]);
  
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${getBackgroundStyle()}`}>
      <div className="max-w-xl w-full mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-xl p-8"
        >
          {/* Premium badge if applicable */}
          {isPremium && !error && (
            <div className="mb-6">
              <span className="inline-flex items-center rounded-full bg-indigo-100/10 px-3 py-1 text-sm font-medium text-indigo-300 border border-indigo-700/30">
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
                Premium Analysis
              </span>
            </div>
          )}
          
          {/* Error state */}
          {error ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </div>
              
              <h2 className="text-2xl font-semibold text-white mb-4">{title || "Analysis Error"}</h2>
              <p className="text-red-200/80 mb-6">{errorMessage}</p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => setLocation('/')}
                  className="bg-transparent border-white/20 text-white hover:bg-white/10"
                >
                  Return to Homepage
                </Button>
                
                {onRetry && (
                  <Button 
                    onClick={onRetry}
                    className="bg-red-600 hover:bg-red-700 text-white border-none"
                  >
                    Try Again
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            <>
              {/* Main content for the loading state */}
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 relative">
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.9, 1, 0.9],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                    className="w-20 h-20 mx-auto"
                  >
                    {stage === 'document-processing' && (
                      <svg className="text-sky-400 w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <line x1="10" y1="9" x2="8" y2="9"></line>
                      </svg>
                    )}
                    
                    {stage === 'analysis' && (
                      <svg className={`${isPremium ? 'text-indigo-400' : 'text-sky-400'} w-full h-full`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                    )}
                    
                    {stage === 'report-generation' && (
                      <svg className={`${isPremium ? 'text-indigo-400' : 'text-sky-400'} w-full h-full`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                        <path d="M14 2v6h6"></path>
                        <path d="M16 13H8"></path>
                        <path d="M16 17H8"></path>
                        <path d="M10 9H8"></path>
                      </svg>
                    )}
                  </motion.div>
                  
                  {/* Animated particles around the icon */}
                  <AnimatePresence>
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ 
                          opacity: 0,
                          scale: 0,
                          x: 0, 
                          y: 0 
                        }}
                        animate={{ 
                          opacity: [0, 0.8, 0],
                          scale: [0, 1, 0.5],
                          x: Math.sin(i * 60 * (Math.PI / 180)) * 30, 
                          y: Math.cos(i * 60 * (Math.PI / 180)) * 30 
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "loop",
                          delay: i * 0.2,
                        }}
                        className={`absolute top-1/2 left-1/2 w-2 h-2 rounded-full ${
                          isPremium ? 'bg-indigo-400/40' : 'bg-sky-400/40'
                        }`}
                      />
                    ))}
                  </AnimatePresence>
                </div>
                
                <h2 className="text-2xl font-semibold text-white mb-2">
                  {title}
                </h2>
                
                <p className="text-gray-300/80 text-sm mb-6">
                  {getStatusMessage()}
                </p>
                
                {/* Rotating message display */}
                <motion.div
                  key={messageIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className={`${isPremium ? 'bg-indigo-900/30' : 'bg-sky-900/30'} rounded-md p-4 border ${
                    isPremium ? 'border-indigo-800/50' : 'border-sky-800/50'
                  } mb-6 text-white/90 text-sm min-h-[60px] flex items-center w-full`}
                >
                  <div className="flex items-center w-full">
                    <svg className={`w-4 h-4 ${isPremium ? 'text-indigo-300' : 'text-sky-300'} mr-2 flex-shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                    </svg>
                    <span className="flex-1 text-left">
                      {messages[messageIndex]}
                    </span>
                  </div>
                </motion.div>
              </div>
              
              {/* Progress indicators */}
              <div className="mt-2 mb-8">
                <div className="flex justify-between mb-2 items-center">
                  <div className={`text-sm ${isPremium ? 'text-indigo-200/70' : 'text-sky-200/70'}`}>
                    {stage === 'document-processing' ? 'Processing' : 
                     stage === 'analysis' ? 'Analyzing' : 'Generating'}
                  </div>
                  <div className={`text-sm font-medium ${isPremium ? 'text-indigo-300' : 'text-sky-300'}`}>
                    {Math.round(displayedProgress)}%
                  </div>
                </div>
                
                <Progress 
                  value={displayedProgress} 
                  className={`h-2 ${isPremium ? 'bg-indigo-950/50' : 'bg-sky-950/50'} border ${
                    isPremium ? 'border-indigo-900/50' : 'border-sky-900/50'
                  }`}
                  indicatorClassName={`${
                    isPremium 
                      ? 'bg-gradient-to-r from-indigo-400 to-indigo-500' 
                      : 'bg-gradient-to-r from-sky-400 to-sky-500'
                  }`}
                />
                
                {/* Step indicators */}
                <div className="flex justify-between mt-6">
                  {analysisSteps.map((step, index) => (
                    <div key={step.id} className="flex flex-col items-center relative">
                      {/* Line connector */}
                      {index < analysisSteps.length - 1 && (
                        <div className={`absolute top-[10px] left-6 h-[2px] w-[calc(8rem-12px)] ${
                          step.status === 'completed' 
                            ? isPremium ? 'bg-indigo-500' : 'bg-sky-500' 
                            : 'bg-gray-700'
                        }`} />
                      )}
                      
                      {/* Step indicator */}
                      <div className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center ${
                        step.status === 'completed' 
                          ? isPremium ? 'bg-indigo-500 ring-2 ring-indigo-400/20' : 'bg-sky-500 ring-2 ring-sky-400/20'
                          : step.status === 'active'
                            ? isPremium ? 'bg-indigo-400 animate-pulse' : 'bg-sky-400 animate-pulse'
                            : step.status === 'failed'
                              ? 'bg-red-500'
                              : 'bg-gray-700'
                      }`}>
                        {step.status === 'completed' && (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                        {step.status === 'failed' && (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        )}
                      </div>
                      
                      {/* Step label */}
                      <div className="mt-2 text-xs text-center">
                        <span className={
                          step.status === 'completed' 
                            ? 'text-white font-medium'
                            : step.status === 'active'
                              ? isPremium ? 'text-indigo-300 font-medium' : 'text-sky-300 font-medium'
                              : step.status === 'failed'
                                ? 'text-red-400 font-medium'
                                : 'text-gray-500'
                        }>
                          {step.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Legal compliance notice */}
              <div className="mt-4 text-xs text-gray-400/60 text-center">
                <p>Your document is processed in compliance with UK GDPR. All data is encrypted.</p>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}