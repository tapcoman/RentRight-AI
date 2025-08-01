import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedProgressProps {
  percentage: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  label?: string;
  animate?: boolean;
  className?: string;
}

export function AnimatedProgress({
  percentage,
  color = '#38B2AC',
  backgroundColor = '#E2E8F0',
  height = 8,
  label,
  animate = true,
  className = '',
}: AnimatedProgressProps) {
  // Ensure percentage is between 0 and 100
  const safePercentage = Math.min(100, Math.max(0, percentage));
  
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm font-medium text-gray-700">{safePercentage}%</span>
        </div>
      )}
      <div 
        className="w-full rounded-full overflow-hidden"
        style={{ height: `${height}px`, backgroundColor }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${safePercentage}%` }}
          transition={{ 
            duration: animate ? 1 : 0,
            ease: "easeOut"
          }}
        />
      </div>
    </div>
  );
}

interface AnimatedRadialProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trailColor?: string;
  label?: string | React.ReactNode;
  animate?: boolean;
  className?: string;
}

export function AnimatedRadialProgress({
  percentage,
  size = 120,
  strokeWidth = 10,
  color = '#38B2AC',
  trailColor = '#E2E8F0',
  label,
  animate = true,
  className = '',
}: AnimatedRadialProgressProps) {
  // Ensure percentage is between 0 and 100
  const safePercentage = Math.min(100, Math.max(0, percentage));
  
  // Calculate radius and circumference
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;
  
  // Set animation variables
  const duration = animate ? 1.5 : 0;
  
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trailColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration, ease: "easeInOut" }}
          style={{ transformOrigin: '50% 50%', transform: 'rotate(-90deg)' }}
        />
      </svg>
      
      {/* Center label */}
      {label && (
        <div className="absolute inset-0 flex items-center justify-center">
          {typeof label === 'string' ? (
            <span className="text-xl font-semibold">{label}</span>
          ) : (
            label
          )}
        </div>
      )}
    </div>
  );
}

interface AnimatedScoreProps {
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function AnimatedScore({
  score,
  maxScore = 100,
  size = 'md',
  showLabel = true,
  className = '',
}: AnimatedScoreProps) {
  // Calculate percentage
  const percentage = (score / maxScore) * 100;
  
  // Determine color based on score
  let color = '#38B2AC'; // Default teal
  if (percentage < 40) {
    color = '#F56565'; // Red for low scores
  } else if (percentage < 70) {
    color = '#ED8936'; // Orange for medium scores
  }
  
  // Determine size
  let circleSize = 120;
  let strokeWidth = 10;
  let fontSize = 'text-2xl';
  
  if (size === 'sm') {
    circleSize = 80;
    strokeWidth = 8;
    fontSize = 'text-lg';
  } else if (size === 'lg') {
    circleSize = 160;
    strokeWidth = 12;
    fontSize = 'text-3xl';
  }
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <AnimatedRadialProgress
        percentage={percentage}
        size={circleSize}
        strokeWidth={strokeWidth}
        color={color}
        label={
          <motion.div
            className={`font-semibold ${fontSize}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            {score}
          </motion.div>
        }
      />
      {showLabel && (
        <motion.div
          className="mt-2 text-sm text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Out of {maxScore}
        </motion.div>
      )}
    </div>
  );
}