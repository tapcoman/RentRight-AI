import { useParams, useLocation } from 'wouter';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Document } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import SimpleLoader from '@/components/SimpleLoader';

export default function DocumentProcessing() {
  const { id } = useParams<{ id: string }>();
  const documentId = parseInt(id);
  const [, setLocation] = useLocation();
  const [progress, setProgress] = useState(0);

  // Fetch document to check processing status
  const { 
    data: document, 
    isLoading, 
    error
  } = useQuery<Document>({
    queryKey: [`/api/documents/${documentId}`],
    enabled: !!documentId && !isNaN(documentId),
    refetchInterval: 2000, // Poll every 2 seconds
  });

  // Handle progress animation
  useEffect(() => {
    if (!document) return;

    if (document.processed) {
      // Document is fully processed - redirect immediately
      setLocation(`/analysis/${documentId}`);
    } else {
      // Animate progress while processing (4 minute total duration)
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 1.2, 85));
      }, 1000); // Update every second for smoother progress

      return () => clearInterval(interval);
    }
  }, [document, documentId, setLocation]);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFFAF5] to-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Error</h2>
          <p className="text-gray-600 mb-4">
            There was an issue processing your document. Please try uploading again.
          </p>
          <Button
            onClick={() => setLocation('/')}
            className="bg-[#EC7134] hover:bg-[#DC6327] text-white"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  // Loading or processing state
  return (
    <SimpleLoader
      title="Processing Your Document"
      message="Extracting text and preparing for analysis... This typically takes 3-4 minutes."
      showProgress={!isLoading}
      progress={progress}
    />
  );
}