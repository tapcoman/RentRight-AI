import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimationContainer } from './animation-container';

// Animation constants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

// Step item component
interface StepItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

const StepItem = ({ 
  icon, 
  title, 
  description, 
  color,
  index,
  isActive,
  onClick
}: StepItemProps) => {
  return (
    <motion.div
      variants={cardVariants}
      className={`relative cursor-pointer rounded-xl overflow-hidden transition-all duration-300 
        ${isActive ? 'shadow-md scale-102 z-10' : 'opacity-80 hover:opacity-95'}
      `}
      onClick={onClick}
    >
      <Card className={`p-5 border border-gray-200 ${isActive ? 'border-l-[3px]' : 'border-l-[2px]'} ${color}`}>
        <div className="flex items-start gap-4">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${color.replace('border-', 'bg-')}/10`}>
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <span className="font-medium text-sm text-gray-400 mr-2">0{index + 1}</span>
              <h3 className="font-semibold">{title}</h3>
            </div>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
      </Card>
      {isActive && (
        <motion.div 
          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2" 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <svg width="20" height="10" viewBox="0 0 20 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 10L0 0H20L10 10Z" fill="white" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
};

// Visual content for each step
const StepVisual = ({ step }: { step: number }) => {
  // Common animation properties
  const contentAnimProps = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.2, duration: 0.5 }
  };

  // Different content for each step
  const getVisualContent = () => {
    switch(step) {
      case 0: // Upload & Analysis
        return (
          <div className="h-full flex flex-col items-center justify-center p-4 text-center">
            <motion.div 
              className="relative mb-8"
              {...contentAnimProps}
            >
              <div className="w-24 h-32 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                <svg className="w-12 h-12 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div className="absolute top-0 right-0 -mr-4 -mt-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex items-center">
                <svg className="w-5 h-5 text-blue-500 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </motion.div>
            
            <motion.h3 
              className="text-lg font-semibold text-gray-800 mb-2"
              {...contentAnimProps}
              transition={{ delay: 0.3 }}
            >
              Easy Document Upload
            </motion.h3>
            <motion.p 
              className="text-sm text-gray-600 max-w-xs"
              {...contentAnimProps}
              transition={{ delay: 0.4 }}
            >
              Simply upload your tenancy agreement, and our AI starts working within minutes to analyze every clause.
            </motion.p>
          </div>
        );
        
      case 1: // Advanced Legal Analysis
        return (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <motion.div 
              className="bg-gray-50 rounded-xl p-5 border border-gray-100 max-w-sm shadow-sm mb-6"
              {...contentAnimProps}
            >
              <div className="flex items-start mb-3">
                <div className="flex-shrink-0 mr-3">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-slate-700 mb-1 text-sm">Possible Issue Detected</h4>
                  <p className="text-xs text-gray-600">Clause 8.3 - Repair Obligations</p>
                </div>
              </div>
              <div className="pl-11">
                <div className="text-sm bg-white p-3 rounded border border-gray-100 text-gray-600 mb-3">
                  "The tenant shall be responsible for all repairs to the property regardless of cause..."
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-100 text-sm">
                  <span className="font-medium text-slate-700 block mb-1">AI Analysis:</span>
                  <p className="text-xs text-gray-700">This clause unfairly assigns all repair responsibilities to the tenant, which is contrary to the Landlord and Tenant Act 1985 Section 11.</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-2 text-sm text-gray-500 mb-4"
              {...contentAnimProps}
              transition={{ delay: 0.4 }}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-3 w-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <span>AI-powered analysis identifies unfair terms</span>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-2 text-sm text-gray-500"
              {...contentAnimProps}
              transition={{ delay: 0.5 }}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                <svg className="h-3 w-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span>Precise legal references to support findings</span>
            </motion.div>
          </div>
        );
        
      case 2: // Risk Assessment
        return (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <motion.div 
              className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 max-w-sm mb-4"
              {...contentAnimProps}
            >
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-medium text-gray-800">Risk Assessment Summary</h3>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Overall Risk Level</span>
                    <span className="font-medium text-slate-600">Moderate</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-slate-400 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
                
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      <span className="text-gray-600">Areas of Concern</span>
                    </div>
                    <span className="font-medium">2</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-slate-500 rounded-full mr-2"></span>
                      <span className="text-gray-600">Unfair Terms</span>
                    </div>
                    <span className="font-medium">4</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <span className="text-gray-600">Compliant Clauses</span>
                    </div>
                    <span className="font-medium">12</span>
                  </li>
                </ul>
                
                <div className="bg-slate-50 p-3 rounded text-xs text-slate-800 border border-slate-100">
                  <p className="font-medium mb-1">Estimated Financial Risk:</p>
                  <p>Potential £1,800 in excessive charges and deposit disputes</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-2 text-sm text-gray-500"
              {...contentAnimProps}
              transition={{ delay: 0.4 }}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-3 w-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <span>Quantified financial risk assessment</span>
            </motion.div>
          </div>
        );
        
      case 3: // Solutions & Protection
        return (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <motion.div 
              className="mb-6 flex gap-3"
              {...contentAnimProps}
            >
              <motion.div 
                className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm flex-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-800 mb-1 text-sm">Lease Protection</h4>
                <p className="text-xs text-gray-600">Detailed recommendations for negotiating better terms</p>
              </motion.div>
              
              <motion.div 
                className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm flex-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-800 mb-1 text-sm">Fair Rewrite</h4>
                <p className="text-xs text-gray-600">Get a legally compliant tenant-friendly version</p>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="bg-blue-50 rounded-xl p-4 border border-blue-100 mb-4 max-w-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-blue-500 text-white p-1 rounded">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-9.618 5.04L3 8a9 9 0 009 9 9 9 0 009-9l-.382-.014z" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-800 text-sm">Financial Protection</h4>
              </div>
              <p className="text-xs text-gray-600">Our analysis saves tenants an average of £850 in deposit disputes and unfair charges.</p>
            </motion.div>
            
            <motion.div 
              className="flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button className="bg-blue-600 hover:bg-blue-700">Upgrade Now</Button>
              <p className="text-xs text-gray-500 mt-2">97% issue detection rate</p>
            </motion.div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-[340px] overflow-hidden">
      {getVisualContent()}
    </div>
  );
};

export function SolutionShowcase() {
  const [activeStep, setActiveStep] = useState(0);
  
  const steps = [
    {
      icon: (
        <svg className="w-4 h-4 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      title: "Upload & Analysis",
      description: "Upload your tenancy agreement and get professional AI-powered analysis within minutes",
      color: "border-sky-500"
    },
    {
      icon: (
        <svg className="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: "Advanced Legal Analysis",
      description: "Our AI identifies issues using the latest UK tenant law references",
      color: "border-indigo-500"
    },
    {
      icon: (
        <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      title: "Risk Assessment",
      description: "Quantify your financial and legal risks with clear metrics",
      color: "border-slate-500"
    },
    {
      icon: (
        <svg className="w-4 h-4 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-9.618 5.04L3 8a9 9 0 009 9 9 9 0 009-9l-.382-.014z" />
        </svg>
      ),
      title: "Solutions & Protection",
      description: "Get actionable recommendations to protect your rights and finances",
      color: "border-teal-500"
    }
  ];
  
  return (
    <div className="w-full max-w-4xl mx-auto py-12">
      {/* Section heading is now in the parent component (Home.tsx) */}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <motion.div 
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {steps.map((step, index) => (
              <StepItem 
                key={index}
                icon={step.icon}
                title={step.title}
                description={step.description}
                color={step.color}
                index={index}
                isActive={activeStep === index}
                onClick={() => setActiveStep(index)}
              />
            ))}
          </motion.div>
        </div>
        
        <div className="md:col-span-2">
          <StepVisual step={activeStep} />
          
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${activeStep === index ? 'bg-sky-500 w-8' : 'bg-gray-300'}`}
                  onClick={() => setActiveStep(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 text-center">
        <AnimationContainer delay={0.5}>
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl p-6 shadow-sm border border-sky-100 inline-block">
            <div className="flex items-center justify-center gap-2 mb-4">
              <svg className="w-5 h-5 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <h3 className="font-semibold text-gray-800">Protecting UK Tenants Daily</h3>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-sky-500">97%</div>
                <div className="text-sm text-gray-600">Issue Detection Rate</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-sky-500">£850+</div>
                <div className="text-sm text-gray-600">Average Savings</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-sky-500">4.9/5</div>
                <div className="text-sm text-gray-600">Customer Rating</div>
              </div>
            </div>
            
            <Button className="mt-6 bg-sky-500 hover:bg-sky-600">
              Try RentRight AI Now
            </Button>
          </div>
        </AnimationContainer>
      </div>
    </div>
  );
}