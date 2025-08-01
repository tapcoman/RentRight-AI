import React from 'react';
import { motion } from 'framer-motion';

interface AnimationContainerProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function AnimationContainer({ 
  children, 
  delay = 0, 
  duration = 0.5,
  className = '',
}: AnimationContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay, 
        duration,
        ease: 'easeOut'
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}