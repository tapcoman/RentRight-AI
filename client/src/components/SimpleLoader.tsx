import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

interface SimpleLoaderProps {
  title: string;
  message?: string;
  showProgress?: boolean;
  progress?: number;
}

export default function SimpleLoader({ 
  title, 
  message = "Processing your document...", 
  showProgress = false,
  progress = 0 
}: SimpleLoaderProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFAF5] to-white flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-20 h-20 mx-auto mb-6 bg-[#EC7134] bg-opacity-10 rounded-full flex items-center justify-center"
        >
          <FileText className="w-10 h-10 text-[#EC7134] animate-pulse" />
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {title}
        </h1>
        
        <p className="text-gray-600 mb-8">
          {message}
        </p>

        {showProgress && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-[#EC7134] h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        <div className="text-sm text-gray-500">
          Your document is encrypted and secure
        </div>
      </div>
    </div>
  );
}