import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Home, Shield, FileText, AlertTriangle, ThumbsUp, Scale } from 'lucide-react';

interface AnimationStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  animation: object;
}

export default function TenantRightsAnimation() {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  const animationSteps: AnimationStep[] = [
    {
      id: 0,
      title: "Welcome to Your Tenant Rights Guide!",
      description: "Let's explore your key rights as a UK tenant through this interactive guide. Swipe through to learn about your protections!",
      icon: <Home className="w-16 h-16" />,
      color: "bg-sky-100 text-sky-600",
      animation: { opacity: 1, scale: 1, y: 0 }
    },
    {
      id: 1,
      title: "Deposit Protection",
      description: "Your landlord must protect your deposit in a government-approved scheme within 30 days and provide you with the scheme details.",
      icon: <Shield className="w-16 h-16" />,
      color: "bg-emerald-100 text-emerald-600",
      animation: { opacity: 1, scale: 1, y: 0 }
    },
    {
      id: 2,
      title: "Repairs & Maintenance",
      description: "Your landlord is responsible for structural repairs, heating, plumbing, electrical systems, and ensuring the property is safe.",
      icon: <FileText className="w-16 h-16" />,
      color: "bg-amber-100 text-amber-600",
      animation: { opacity: 1, scale: 1, y: 0 }
    },
    {
      id: 3,
      title: "Right to Quiet Enjoyment",
      description: "You have the right to live undisturbed. Landlords must give at least 24 hours' notice before visiting unless it's an emergency.",
      icon: <ThumbsUp className="w-16 h-16" />,
      color: "bg-indigo-100 text-indigo-600",
      animation: { opacity: 1, scale: 1, y: 0 }
    },
    {
      id: 4,
      title: "Protection from Unfair Eviction",
      description: "Your landlord must follow proper legal procedures for eviction, including valid notice periods and court orders.",
      icon: <Scale className="w-16 h-16" />,
      color: "bg-rose-100 text-rose-600",
      animation: { opacity: 1, scale: 1, y: 0 }
    },
    {
      id: 5,
      title: "Unfair Terms",
      description: "Certain tenancy terms may be unenforceable if they're deemed unfair, such as excessive penalty charges or restrictions on your rights.",
      icon: <AlertTriangle className="w-16 h-16" />,
      color: "bg-purple-100 text-purple-600",
      animation: { opacity: 1, scale: 1, y: 0 }
    }
  ];

  const nextStep = () => {
    setDirection(1);
    setCurrentStep((prev) => (prev >= animationSteps.length - 1 ? 0 : prev + 1));
  };

  const prevStep = () => {
    setDirection(-1);
    setCurrentStep((prev) => (prev <= 0 ? animationSteps.length - 1 : prev - 1));
  };

  // Ensure these functions are actually called when buttons are clicked
  const handleNextClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    nextStep();
  };

  const handlePrevClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    prevStep();
  };

  const variants = {
    enter: (direction: number) => {
      return {
        x: direction > 0 ? 1000 : -1000,
        opacity: 0,
        scale: 0.5,
      };
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => {
      return {
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0,
        scale: 0.5,
      };
    }
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <div className="my-12 px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-sky-600">Interactive Tenant Rights Guide</h2>
        <p className="text-gray-600 mt-2">Swipe or use the arrows to navigate through your key rights</p>
      </div>

      <div className="relative overflow-hidden rounded-xl shadow-md bg-white max-w-3xl mx-auto h-[350px] sm:h-[400px]">
        {/* Progress indicators */}
        <div className="absolute top-3 left-0 right-0 z-10 flex justify-center gap-1.5">
          {animationSteps.map((step, index) => (
            <motion.div
              key={`step-${index}`}
              className={`h-1.5 rounded-full ${currentStep === index ? 'bg-sky-500 w-6' : 'bg-gray-200 w-3'}`}
              animate={{ width: currentStep === index ? 24 : 12 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentStep}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                nextStep();
              } else if (swipe > swipeConfidenceThreshold) {
                prevStep();
              }
            }}
            className="absolute w-full h-full flex flex-col items-center justify-center px-6 sm:px-12"
          >
            <div className={`p-4 rounded-full ${animationSteps[currentStep].color} mb-6`}>
              {animationSteps[currentStep].icon}
            </div>
            
            <motion.h3 
              className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              {animationSteps[currentStep].title}
            </motion.h3>
            
            <motion.p 
              className="text-gray-600 text-center max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {animationSteps[currentStep].description}
            </motion.p>

            {currentStep === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-6"
              >
                <Button 
                  onClick={handleNextClick}
                  className="bg-sky-500 hover:bg-sky-600 text-white"
                >
                  Start Learning <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        <div className="absolute inset-y-0 left-2 sm:left-4 flex items-center z-20">
          <Button
            onClick={handlePrevClick}
            variant="outline"
            size="icon"
            className="rounded-full bg-white/70 backdrop-blur-sm hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="absolute inset-y-0 right-2 sm:right-4 flex items-center z-20">
          <Button
            onClick={handleNextClick}
            variant="outline"
            size="icon"
            className="rounded-full bg-white/70 backdrop-blur-sm hover:bg-white"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="text-center mt-6 text-sm text-gray-500">
        <p>Swipe or tap the arrows to navigate through your rights</p>
      </div>
    </div>
  );
}