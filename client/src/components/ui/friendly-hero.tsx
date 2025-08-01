import React from 'react';
import { Button } from '@/components/ui/button';
import { Mascot } from '@/components/ui/mascot';
import { motion } from 'framer-motion';

export function FriendlyHero() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="py-12 px-6 md:py-16 md:px-10 bg-[#FBF8F2] rounded-2xl shadow-sm border border-[#F3EEE4]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Text content */}
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-[#1E293B]">
              Check Your Tenancy Agreement with Confidence
            </h1>
            
            <p className="text-lg text-gray-700 mb-8">
              Upload your tenancy agreement & get professional analysis within minutes — in plain English.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button 
                className="bg-[#EC7134] hover:bg-[#E35F1E] text-white font-medium px-6 py-3 text-lg rounded-xl shadow-sm"
              >
                Upload Your Agreement
              </Button>
              
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 px-6 py-3 text-lg rounded-xl"
              >
                How It Works
              </Button>
            </div>
            
            <div className="mt-8 flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <span className="bg-[#F9FAFB] p-1 rounded-full mr-2">
                  <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>100% Private & Secure</span>
              </div>
              
              <div className="flex items-center">
                <span className="bg-[#F9FAFB] p-1 rounded-full mr-2">
                  <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>UK Tenancy Law Checked</span>
              </div>
            </div>
          </div>
          
          {/* Mascot illustration */}
          <div className="flex justify-center">
            <div className="relative">
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 2, 0, -2, 0]
                }}
                transition={{ 
                  duration: 5, 
                  repeat: Infinity,
                  repeatType: "reverse" 
                }}
                className="relative z-10"
              >
                {/* Use consistent sizing on mobile and desktop */}
                <Mascot size="xl" withKey={false} withMagnifier={true} glowing={true} />
              </motion.div>
              
              {/* Shadow effect */}
              <div className="w-48 h-8 bg-gray-200 rounded-full absolute bottom-0 left-1/2 transform -translate-x-1/2 blur-md opacity-30 z-0"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}