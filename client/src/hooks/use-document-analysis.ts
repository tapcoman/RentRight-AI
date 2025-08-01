import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Document, Analysis, AnalysisResults } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export function useDocumentAnalysis(documentId: number) {
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch document
  const {
    data: document,
    isLoading: isDocumentLoading,
    error: documentError,
  } = useQuery({
    queryKey: [`/api/documents/${documentId}`],
    enabled: !!documentId && !isNaN(documentId),
    retry: 3, // Retry up to 3 times in case of network errors
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000), // Exponential backoff
  });

  // Fetch analysis if it exists
  const {
    data: analysis,
    isLoading: isAnalysisLoading,
    error: analysisError,
    refetch: refetchAnalysis,
  } = useQuery({
    queryKey: [`/api/documents/${documentId}/analysis`],
    enabled: !!documentId && !isNaN(documentId),
    retry: 3, // Retry up to 3 times
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000), // Exponential backoff
    // Completely suppress errors for this query since no analysis is expected for new docs
    throwOnError: false,
    onSuccess: (data) => {
      console.log('Analysis data fetched:', {
        hasData: !!data,
        hasResults: !!data?.results,
        hasInsights: !!data?.results?.insights,
        insightsCount: data?.results?.insights?.length || 0
      });
    },
    onError: (error) => {
      console.log('⚠️ Analysis fetch error (expected for new docs):', error);
    }
  });



  // Start real analysis mutation (after payment)
  const fullAnalysisMutation = useMutation({
    mutationFn: async (params: { paymentIntentId: string, serviceType?: string, customerEmail?: string }) => {
      // Make sure we're sending a valid object with defined properties
      const validParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined)
      );
      return apiRequest("POST", `/api/documents/${documentId}/analyze`, validParams);
    },
    onSuccess: async () => {
      console.log('Analysis mutation successful, updating state...');
      
      // Update the progress to 100% when the analysis is complete
      setProgress(100);
      
      // Invalidate and refetch the analysis data immediately
      await queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}/analysis`] });
      
      // Also invalidate the document query to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}`] });
      
      // Force refetch of analysis to ensure we have the latest data immediately
      await refetchAnalysis();
      
      // Small delay to ensure the new data is loaded before removing loading screen
      setTimeout(() => {
        setIsAnalyzing(false);
        console.log('Analysis complete, loading screen removed');
      }, 1500); // Slightly longer delay to ensure data is available
      
      toast({
        title: "Analysis Complete",
        description: "Your document has been fully analyzed. You can now view all lease issues and download your report.",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
    onError: (error) => {
      console.error('Analysis mutation failed:', error);
      // Reset the analyzing state
      setIsAnalyzing(false);
      setProgress(0);
      
      toast({
        title: "Analysis Failed",
        description: error.message || "There was a problem with your analysis. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Report generation function - generates PDF without redirecting away from analysis
  const generateReport = async (isPaid: boolean = false, paymentIntentId?: string) => {
    if (!isPaid) return;
    
    try {
      const response = await fetch(`/api/documents/${documentId}/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: paymentIntentId || undefined,
          format: 'pdf'
        }),
      });

      if (response.ok) {
        // Trigger PDF download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tenancy-analysis-report-${documentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Report Generated",
          description: "Your PDF report has been downloaded.",
        });
        
        // Also offer option to view HTML report in new tab
        const viewReportButton = document.createElement('button');
        viewReportButton.textContent = 'View Full Report';
        viewReportButton.onclick = () => window.open(`/analysis/${documentId}/report`, '_blank');
        
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Enhanced progress animation for both preview and premium analysis
  useEffect(() => {
    if (isAnalyzing) {
      // Use a reference to maintain progress state within the interval
      const progressRef = { current: progress };
      const maxProgress = 95; // Only go to 95% automatically, the final update comes from the API response
      
      const interval = setInterval(() => {
        if (progressRef.current >= maxProgress) {
          clearInterval(interval);
          return;
        }
        
        // Dynamic progress increases simulating analysis stages
        if (progressRef.current < 30) {
          // Document processing stage
          progressRef.current += 2.5;
        } else if (progressRef.current < 60) {
          // Structure analysis stage
          progressRef.current += 1.5;
        } else if (progressRef.current < 80) {
          // Insight generation stage
          progressRef.current += 1;
        } else {
          // Final stage preparation
          progressRef.current += 0.5;
        }
        
        // Apply the updated progress
        setProgress(progressRef.current);
      }, 600); // Faster interval for smoother animation

      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  // URL cleanup after payment flow
  useEffect(() => {
    try {
      // Check if we're coming from a payment flow
      const url = new URL(window.location.href);
      const paymentIntent = url.searchParams.get('payment_intent');
      const paymentIntentStatus = url.searchParams.get('redirect_status');
      
      // Clean up the URL if we detect payment parameters
      if (paymentIntent && paymentIntentStatus === 'succeeded') {
        // Remove all query parameters from URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch (error) {
      // Just log any errors and continue
      console.error('Error handling URL params:', error);
    }
  }, []);

  // Handle errors - filter out expected 404 for analysis
  useEffect(() => {
    if (documentError) {
      toast({
        title: "Error loading document",
        description: "There was a problem loading your document.",
        variant: "destructive",
      });
    }

    // Only show the toast for analysis errors that are NOT 404 (Analysis not found)
    // This is expected for new documents
    const is404Error = 
      (analysisError as any)?.status === 404 || 
      ((analysisError as any)?.message && (analysisError as any).message.includes('Analysis not found'));
    
    if (analysisError && !is404Error) {
      toast({
        title: "Error loading analysis",
        description: "There was a problem loading your analysis.",
        variant: "destructive",
      });
    }
  }, [documentError, analysisError, toast]);



  // Start the full analysis after payment
  const performPaidAnalysis = (paymentIntentId: string, serviceType?: string, email?: string) => {
    console.log('Starting paid analysis with:', { paymentIntentId, serviceType, email });
    
    // Set analyzing state to true immediately so we show loading screen with premium messaging
    setIsAnalyzing(true);
    setProgress(10); // Start with some progress already
    
    // Basic email validation to prevent obvious errors
    let validatedEmail = email;
    if (email) {
      if (typeof email !== 'string' || !email.includes('@')) {
        console.error(`Invalid email format received: "${email}"`);
        toast({
          title: "Email Error",
          description: "The email address format is invalid. Your analysis will proceed but you may not receive an email report.",
          variant: "destructive"
        });
        validatedEmail = undefined; // Don't send invalid emails to the API
      } else {
        console.log(`Using valid email for analysis: ${email}`);
      }
    } else {
      console.warn('No email provided for premium analysis');
    }
    
    // Timeout to allow the loading screen to appear before making the request
    setTimeout(() => {
      // Make sure all parameters are explicitly passed to satisfy TypeScript
      const params: { 
        paymentIntentId: string;
        serviceType?: string;
        customerEmail?: string;
      } = { paymentIntentId };
      
      if (serviceType) params.serviceType = serviceType;
      if (validatedEmail) params.customerEmail = validatedEmail;
      
      console.log('Sending analysis request with params:', JSON.stringify(params));
      fullAnalysisMutation.mutate(params);
    }, 1000); // Increased delay to ensure UI is ready
  };

  // Type assertion to handle isPaid property
  const typedAnalysis = analysis as Analysis | null;
  
  // Define the return type explicitly to fix TypeScript error
  return {
    document: document as Document | null,
    analysis: typedAnalysis,
    isLoading: isDocumentLoading || isAnalysisLoading,
    isAnalysisComplete: !!typedAnalysis && !isAnalyzing && !!typedAnalysis.results,
    isFullAnalysisComplete: !!typedAnalysis && typedAnalysis.isPaid === true && !isAnalyzing && !!typedAnalysis.results,
    isAnalyzing,
    progress,
    performPaidAnalysis,
    generateReport,
    documentError,
    analysisError,
  };
}