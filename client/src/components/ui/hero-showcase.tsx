import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Hero showcase component specifically optimized for hero section
export function HeroShowcase() {
  const [activeCard, setActiveCard] = useState(0);
  
  // Optimized animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };
  
  // Cards with key tenant protection points
  const cards = [
    {
      icon: (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-9.618 5.04L3 8a9 9 0 009 9 9 9 0 009-9l-.382-.014z" />
        </svg>
      ),
      title: "Unfair Terms Detected",
      description: "We found a clause that violates the Tenant Fees Act 2019",
      color: "bg-red-500",
      content: (
        <div className="mt-3 bg-white rounded-md p-3 text-xs text-gray-700 shadow-sm">
          <div className="border-l-2 border-red-500 pl-2 mb-2 text-sm font-medium text-gray-900">
            Illegal Fee Clause
          </div>
          <p className="mb-2">
            "Tenant shall pay a £300 admin fee for any lease renewal..."
          </p>
          <div className="bg-red-50 p-2 rounded border border-red-100 text-red-700 text-xs">
            Violates Tenant Fees Act 2019: Landlords cannot charge renewal fees.
          </div>
        </div>
      )
    },
    {
      icon: (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Repair Issues Identified",
      description: "This repair clause unfairly burdens you with costs",
      color: "bg-slate-500",
      content: (
        <div className="mt-3 bg-white rounded-md p-3 text-xs text-gray-700 shadow-sm">
          <div className="border-l-2 border-slate-500 pl-2 mb-2 text-sm font-medium text-gray-900">
            Unfair Repair Clause
          </div>
          <p className="mb-2">
            "Tenant responsible for all repairs regardless of cause..."
          </p>
          <div className="bg-slate-50 p-2 rounded border border-slate-100 text-slate-700 text-xs">
            Landlord must handle structural & exterior repairs per Landlord and Tenant Act 1985.
          </div>
        </div>
      )
    },
    {
      icon: (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Security Deposit Risk",
      description: "Your deposit exceeds legal limits by £450",
      color: "bg-blue-500",
      content: (
        <div className="mt-3 bg-white rounded-md p-3 text-xs text-gray-700 shadow-sm">
          <div className="border-l-2 border-blue-500 pl-2 mb-2 text-sm font-medium text-gray-900">
            Excessive Deposit
          </div>
          <p className="mb-2">
            "Tenant shall pay a deposit of 8 weeks' rent..."
          </p>
          <div className="bg-blue-50 p-2 rounded border border-blue-100 text-blue-700 text-xs">
            Tenant Fees Act limits deposits to 5 weeks' rent. You're entitled to a £450 refund.
          </div>
        </div>
      )
    }
  ];
  
  // Statistics to display
  const stats = [
    { value: "97%", label: "Issue Detection" },
    { value: "£850", label: "Avg. Savings" },
    { value: "4.9/5", label: "Rating" }
  ];
  
  // Auto-rotate cards
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % cards.length);
    }, 4000);
    
    return () => clearInterval(timer);
  }, [cards.length]);
  
  return (
    <div className="rounded-xl overflow-hidden border border-gray-700 bg-gray-800/90 backdrop-blur-sm shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-center bg-gray-900 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center">
          <div className="bg-sky-500 p-1 rounded mr-2">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="font-medium text-white text-sm">RentRight AI Protection</span>
        </div>
        <div className="px-2 py-1 bg-sky-500 rounded-full text-xs font-medium text-white">
          Live Demo
        </div>
      </div>
      
      {/* Content area */}
      <div className="p-4 relative">
        <div className="flex space-x-3 mb-4">
          {cards.map((card, index) => (
            <button
              key={index}
              onClick={() => setActiveCard(index)}
              className={`w-1/3 p-2 rounded-md border text-xs font-medium transition-all ${
                activeCard === index 
                  ? `border-${card.color.split('-')[1]}-400 bg-${card.color.split('-')[1]}-50 text-${card.color.split('-')[1]}-700` 
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center">
                <div className={`${card.color} rounded-full p-1 mr-2 flex-shrink-0`}>
                  {card.icon}
                </div>
                {card.title}
              </div>
            </button>
          ))}
        </div>
        
        {/* Card content with animation */}
        <div className="h-48 relative">
          <motion.div
            key={activeCard}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={cardVariants}
            className="absolute inset-0"
          >
            <div className="p-3 bg-gray-850 rounded-lg border border-gray-700">
              <div className="text-white text-sm mb-2">{cards[activeCard].description}</div>
              {cards[activeCard].content}
            </div>
          </motion.div>
        </div>
        
        {/* Stats bar */}
        <div className="mt-4 flex items-center justify-between bg-gray-900/60 rounded-md px-4 py-3 border border-gray-700">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-sky-400 font-bold text-lg">{stat.value}</div>
              <div className="text-gray-400 text-xs">{stat.label}</div>
            </div>
          ))}
        </div>
        
        {/* Action button */}
        <div className="mt-4 text-center">
          <Button className="bg-sky-500 hover:bg-sky-600 text-white w-full shadow-md">
            Scan My Lease Now
          </Button>
        </div>
      </div>
    </div>
  );
}