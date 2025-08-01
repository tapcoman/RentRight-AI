import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  rotating?: boolean;
  maxRotation?: number;
  glowIntensity?: number;
}

export function AnimatedCard({
  children,
  className = "",
  glowColor = "#38B2AC",
  rotating = false,
  maxRotation = 10,
  glowIntensity = 0.3,
}: AnimatedCardProps) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  // Calculate rotation based on mouse position
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    
    // Get mouse position relative to card
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate rotation
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Convert to percentage (-0.5 to 0.5) then multiply by max rotation
    const rotX = ((y - centerY) / centerY) * -maxRotation;
    const rotY = ((x - centerX) / centerX) * maxRotation;
    
    setRotateX(rotX);
    setRotateY(rotY);
    
    // For glow effect
    setMouseX(x / rect.width);
    setMouseY(y / rect.height);
  };

  const handleMouseLeave = () => {
    // Reset rotation when mouse leaves
    controls.start({
      rotateX: 0,
      rotateY: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    });
  };

  // Automatic rotation animation
  useEffect(() => {
    if (rotating) {
      const interval = setInterval(() => {
        controls.start({
          rotateY: [0, 3, 0, -3, 0],
          transition: {
            duration: 5,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "mirror"
          }
        });
      }, 0);
      return () => clearInterval(interval);
    }
  }, [rotating, controls]);

  return (
    <motion.div
      ref={cardRef}
      className={`relative overflow-hidden rounded-xl ${className}`}
      animate={controls}
      style={{
        perspective: "1200px",
        transformStyle: "preserve-3d"
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }}
    >
      <motion.div
        className="w-full h-full"
        style={{
          rotateX: rotateX,
          rotateY: rotateY,
          transformStyle: "preserve-3d"
        }}
      >
        {/* Glow effect */}
        <div
          className="absolute w-full h-full rounded-xl opacity-30 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${mouseX * 100}% ${mouseY * 100}%, ${glowColor}, transparent 70%)`,
            opacity: glowIntensity,
            mixBlendMode: "overlay"
          }}
        />
        
        {/* Card Content */}
        <div className="card-content relative z-10">
          {children}
        </div>
        
        {/* Card edge highlight effect */}
        <div 
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.1)`,
            background: "linear-gradient(to bottom right, rgba(255,255,255,0.05), transparent)",
          }}
        />
      </motion.div>
    </motion.div>
  );
}

export function AnimatedPulse({ 
  children, 
  className = "", 
  pulseDuration = 2 
}: { 
  children: React.ReactNode; 
  className?: string;
  pulseDuration?: number;
}) {
  return (
    <motion.div
      className={className}
      animate={{
        scale: [1, 1.03, 1],
        opacity: [0.9, 1, 0.9]
      }}
      transition={{
        duration: pulseDuration,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "mirror"
      }}
    >
      {children}
    </motion.div>
  );
}

export function AnimationContainer({ 
  children, 
  className = "",
  delay = 0
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delay }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedBadge({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }}
    >
      {children}
    </motion.div>
  );
}