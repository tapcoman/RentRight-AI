import { useParams, useLocation } from 'wouter';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AnalysisPanel from '@/components/AnalysisPanel';
import SimpleLoader from '@/components/SimpleLoader';
import PaymentModal from '@/components/PaymentModal';
import { useDocumentAnalysis } from '@/hooks/use-document-analysis';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Mascot } from '@/components/ui/mascot';
import { 
  AlertCircle, 
  ChevronLeft, 
  ShieldCheck, 
  FileText, 
  Check, 
  LucideShieldAlert, 
  LucideScale,
  LucideFileSearch,
  LucideFileCheck,
  LucideSearchX,
  LucideSearch,
  LucideFileWarning,
  Download
} from 'lucide-react';

export default function DocumentAnalysis() {
  const { id } = useParams<{ id: string }>();
  const documentId = parseInt(id);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [retryCount, setRetryCount] = useState(0);
  
  // Track when we should show animation effects
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  // Timer for staggered animations
  useEffect(() => {
    if (isFirstLoad) {
      const timer = setTimeout(() => {
        setIsFirstLoad(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isFirstLoad]);
  
  const { 
    isLoading, 
    document, 
    analysis,
    isAnalysisComplete,
    isFullAnalysisComplete,
    isAnalyzing,
    progress,
    performPaidAnalysis,
    generateReport,
    documentError,
    analysisError
  } = useDocumentAnalysis(documentId);
  
  // Debug logging for development
  useEffect(() => {
    console.log('DocumentAnalysis state:', {
      documentId,
      hasDocument: !!document,
      hasAnalysis: !!analysis,
      hasAnalysisResults: !!analysis?.results,
      hasInsights: !!analysis?.results?.insights,
      insightsCount: analysis?.results?.insights?.length || 0,
      isLoading,
      isAnalyzing
    });
  }, [documentId, document, analysis, isLoading, isAnalyzing]);
  
  // Handle payment success from Stripe redirect
  useEffect(() => {
    const url = new URL(window.location.href);
    const paymentIntent = url.searchParams.get('payment_intent');
    const paymentIntentStatus = url.searchParams.get('redirect_status');
    const serviceType = url.searchParams.get('service_type');
    const email = url.searchParams.get('email');
    
    if (paymentIntent && paymentIntentStatus === 'succeeded') {
      console.log('Processing payment success redirect:', { paymentIntent, serviceType, email });
      
      const serviceMessage = serviceType === 'combined' 
        ? "Your payment was successful. Starting premium analysis with tenancy agreement rewrite..."
        : "Your payment was successful. Starting premium analysis...";
      
      toast({
        title: "Payment Successful",
        description: serviceMessage,
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      // Clean up the URL immediately to prevent duplicate processing
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, 'RentRight AI - Document Analysis', cleanUrl);
      
      // Add a delay to ensure URL cleanup and state changes have propagated
      const timer = setTimeout(() => {
        console.log('Triggering paid analysis with:', { paymentIntent, serviceType, email });
        // Trigger analysis with payment intent and service type
        performPaidAnalysis(paymentIntent, serviceType || undefined, email || undefined);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [location, performPaidAnalysis, toast]);

  // Remove auto-redirect - let users manually navigate to report view

  // No loading state - document should be ready when we arrive here from processing

  // Analysis in-progress state
  if (isAnalyzing) {
    return <SimpleLoader 
      title={isFullAnalysisComplete ? "Preparing Premium Analysis" : "Analyzing Your Tenancy Agreement"} 
      message={isFullAnalysisComplete ? "Generating your detailed report..." : "Examining clauses and legal compliance..."}
      showProgress={true}
      progress={progress} 
    />;
  }
  
  // Error state for document not found
  if (documentError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Document Not Found</h2>
          <p className="text-gray-600 mb-4">
            We couldn't find the document you're looking for. It may have been deleted or the URL might be incorrect.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-[#EC7134] hover:bg-[#DC6327] text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  // Filter out expected 404 errors for analysis
  const is404Error = 
    (analysisError as any)?.status === 404 || 
    (analysisError as any)?.message?.includes('Analysis not found');
    
  if (analysisError && !isLoading && !is404Error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Analysis Error</h2>
          <p className="text-gray-600 mb-4">
            There was a problem analyzing your document. Please try again or upload a different document.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-[#EC7134] hover:bg-[#DC6327] text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Features array that shows what the analysis includes
  const features = [
    {
      icon: <LucideFileSearch className="w-5 h-5 text-[#EC7134]" />,
      title: "Tenancy Term Analysis",
      description: "Identifies critical terms such as rent increases, maintenance responsibilities, and termination conditions"
    },
    {
      icon: <LucideShieldAlert className="w-5 h-5 text-[#EC7134]" />,
      title: "Legal Compliance Check",
      description: "Evaluates your agreement against current UK housing law requirements and tenant rights protections"
    },
    {
      icon: <LucideScale className="w-5 h-5 text-[#EC7134]" />,
      title: "Fairness Assessment",
      description: "Highlights potentially unfair terms that may disadvantage you as a tenant"
    },
    {
      icon: <LucideFileCheck className="w-5 h-5 text-[#EC7134]" />,
      title: "Actionable Insights",
      description: "Provides clear explanations and recommendations for protecting your interests"
    }
  ];

  // Analysis display or start analysis prompt
  // Handle payment completion
  const handlePaymentComplete = (success: boolean, serviceType: string, email?: string) => {
    setIsPaymentModalOpen(false);
    
    if (success) {
      console.log('Payment completed successfully:', { serviceType, email });
      
      toast({
        title: "Payment Successful",
        description: "Your premium analysis is being generated.",
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      // Generate a simulated payment intent for testing
      // In production, this would come from Stripe
      const paymentIntent = "pi_simulated_" + Date.now();
      
      // Start the paid analysis immediately
      performPaidAnalysis(paymentIntent, serviceType, email);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full">
          {/* Payment Modal */}
          <PaymentModal 
            isOpen={isPaymentModalOpen} 
            onClose={() => setIsPaymentModalOpen(false)}
            documentId={documentId}
            onSuccess={(paymentIntentId, serviceType, email) => {
              // Make sure we pass the email to the payment complete handler
              console.log("Payment modal success with email:", email);
              handlePaymentComplete(true, serviceType, email);
            }}
          />
          {analysis ? (
            <div className="space-y-8">
              {/* Analysis Results */}
              <AnalysisPanel
                analysis={analysis}
                isPaidAnalysis={analysis.isPaid}
                isPreviewMode={false}
                onGenerateReport={(isPaid, paymentIntentId) => generateReport(isPaid, paymentIntentId)}
              />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
            >
              {/* Document preview header with gradient */}
              <div className="bg-gradient-to-r from-[#EC7134] to-[#E35F1E] text-white p-6 sm:p-8">
                <div className="flex items-center justify-center">
                  <div className="p-3 bg-white/20 rounded-full mr-4">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {document?.filename || "Your Tenancy Agreement"}
                    </h2>
                    <p className="text-orange-100 mt-1">
                      Uploaded {document?.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 sm:p-8">
                {/* Main content */}
                <div className="max-w-3xl mx-auto">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center">
                      <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                        Professional Tenancy Agreement Analysis
                      </h3>
                      <div className="ml-3 -mt-3">
                        <Mascot size="sm" withKey={false} withMagnifier={true} />
                      </div>
                    </div>
                    
                    <p className="text-gray-600 max-w-2xl mx-auto mb-4">
                      Don't sign a tenancy agreement that could cost you thousands later. Our AI-powered legal analysis 
                      identifies hidden clauses, unfair terms, and potential violations that 9 out of 10 tenants miss.
                    </p>
                    <div className="flex justify-center items-center gap-4 text-sm text-gray-500 mb-2">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                        <span>AI-powered legal analysis</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-blue-500 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 12l2 2 4-4"></path>
                          <circle cx="12" cy="12" r="10"></circle>
                        </svg>
                        <span>UK housing law compliant</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Professional Analysis Option */}
                  <div className="mb-10 max-w-2xl mx-auto">
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-[#EC7134] rounded-xl p-6 relative shadow-md"
                    >
                      <div className="absolute top-0 right-0 bg-[#EC7134] text-white rounded-bl-xl px-3 py-1 text-xs font-medium">
                        £29
                      </div>
                      
                      <div className="absolute top-3 left-3">
                        <div className="relative h-10 w-10">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EC7134]/20 opacity-75"></span>
                          <span className="relative inline-flex rounded-full bg-[#EC7134]/30 p-2">
                            <svg className="h-6 w-6 text-[#EC7134]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                          </span>
                        </div>
                      </div>
                      
                      <h4 className="text-xl font-semibold text-gray-900 mb-2 mt-4 ml-14">Complete Legal Protection</h4>
                      <p className="text-sm text-gray-600 mb-4 ml-14">Everything you need to avoid costly tenancy mistakes</p>
                      
                      <ul className="space-y-3 mb-6">
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-[#EC7134] mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 11 12 14 22 4"></polyline>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                          </svg>
                          <span className="text-gray-900 font-medium">Detect unfair deposit terms</span>
                          <span className="text-xs text-gray-500 block">Could save you £500+ in unlawful deductions</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-[#EC7134] mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 11 12 14 22 4"></polyline>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h11"></path>
                          </svg>
                          <span className="text-gray-900 font-medium">Identify prohibited tenant fees</span>
                          <span className="text-xs text-gray-500 block">Banned fees that many landlords still charge</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-[#EC7134] mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 11 12 14 22 4"></polyline>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                          </svg>
                          <span className="text-gray-900 font-medium">Flag excessive repair obligations</span>
                          <span className="text-xs text-gray-500 block">Protect yourself from costly maintenance liability</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-[#EC7134] mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 11 12 14 22 4"></polyline>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h11"></path>
                          </svg>
                          <span className="text-gray-900 font-medium">Negotiate with confidence</span>
                          <span className="text-xs text-gray-500 block">Exact talking points to improve your agreement</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-[#EC7134] mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 11 12 14 22 4"></polyline>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h11"></path>
                          </svg>
                          <span className="text-gray-900 font-medium">Professional report delivered quickly</span>
                          <span className="text-xs text-gray-500 block">Comprehensive PDF emailed within 4 minutes</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-[#EC7134] mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 11 12 14 22 4"></polyline>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                          </svg>
                          <span className="text-gray-900 font-medium">FREE landlord response templates</span>
                          <span className="text-xs text-gray-500 block">Pre-written emails for challenging unfair terms</span>
                        </li>
                      </ul>
                      
                      <div className="text-center mb-6">
                        <div className="mb-2">
                          <span className="text-lg text-gray-500 line-through mr-2">£99</span>
                          <span className="text-3xl font-bold text-[#EC7134]">£29</span>
                          <span className="text-gray-600 ml-1">one-time fee</span>
                        </div>
                        <div className="inline-block bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">
                          Professional Legal Analysis
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Compare to £300+ for a solicitor consultation</p>
                      </div>
                      
                      <Button
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="w-full bg-gradient-to-r from-[#EC7134] to-[#E35F1E] hover:from-[#E35F1E] hover:to-[#D54F0A] text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                        Get My Legal Protection Now
                      </Button>
                      <p className="text-xs text-center text-gray-500 mt-3">
                        ✓ 30-day money-back guarantee • ✓ Instant delivery • ✓ Secure payment
                      </p>
                    </motion.div>
                  </div>
                  
                  {/* Value Proposition */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-gradient-to-r from-orange-50/50 to-slate-50/70 rounded-xl p-6 mb-8 relative border border-slate-200"
                  >
                    <div className="text-center">
                      <h5 className="text-lg font-semibold text-gray-900 mb-3">Why Professional Legal Analysis Matters</h5>
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600 mb-1">73%</div>
                          <p className="text-gray-600">of UK tenancy agreements contain at least one unfair term according to housing charities</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#EC7134] mb-1">£500+</div>
                          <p className="text-gray-600">average amount tenants lose to unlawful deposit deductions annually</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 mb-1">90%</div>
                          <p className="text-gray-600">of tenants don't know their rights under current UK housing law</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-4">Sources: Citizens Advice, Shelter Housing Charity, UK Government Housing Survey</p>
                    </div>
                  </motion.div>
                  
                  {/* Service Assurance */}
                  <div className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-6 mb-3">
                      <div className="flex items-center text-blue-700 text-sm font-medium">
                        <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 12l2 2 4-4"></path>
                          <circle cx="12" cy="12" r="10"></circle>
                        </svg>
                        <span>Professional legal analysis</span>
                      </div>
                      <div className="flex items-center text-green-700 text-sm font-medium">
                        <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                        <span>UK housing law expertise</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">Comprehensive AI-powered analysis of your tenancy agreement</p>
                  </div>
                  
                  {/* Legal Disclaimer */}
                  <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-600">
                    <h6 className="font-semibold text-gray-800 mb-2">Important Legal Disclaimer</h6>
                    <div className="space-y-2 leading-relaxed">
                      <p>
                        <strong>Not Legal Advice:</strong> This AI-powered analysis is for informational purposes only and does not constitute legal advice. 
                        The analysis is based on general UK housing law principles and may not reflect recent legislative changes or case law developments.
                      </p>
                      <p>
                        <strong>Professional Consultation:</strong> For specific legal advice regarding your tenancy agreement, you should consult with a qualified 
                        solicitor or legal professional who can assess your individual circumstances and provide tailored guidance.
                      </p>
                      <p>
                        <strong>Accuracy Limitations:</strong> While we strive for accuracy, AI analysis may contain errors, omissions, or misinterpretations. 
                        We do not guarantee the completeness or accuracy of the analysis and accept no liability for any decisions made based on this information.
                      </p>
                      <p>
                        <strong>No Liability:</strong> RentRight AI, its operators, and AI systems shall not be held liable for any losses, damages, or legal 
                        consequences arising from the use of this analysis or any actions taken based upon it.
                      </p>
                      <p>
                        <strong>Data Processing:</strong> Your document is processed securely and automatically deleted after 30 days in accordance with our privacy policy. 
                        We comply with UK GDPR requirements for data protection.
                      </p>
                    </div>
                  </div>
                  
                  {/* Trust badges */}
                  <div className="mt-6 flex items-center justify-center space-x-6">
                    <div className="flex items-center text-gray-500 text-xs">
                      <svg className="w-4 h-4 mr-1 text-[#EC7134]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      Secure Processing
                    </div>
                    <div className="flex items-center text-gray-500 text-xs">
                      <svg className="w-4 h-4 mr-1 text-[#EC7134]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                      GDPR Compliant
                    </div>
                    <div className="flex items-center text-gray-500 text-xs">
                      <svg className="w-4 h-4 mr-1 text-[#EC7134]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <polyline points="1 20 1 14 7 14"></polyline>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                      </svg>
                      30-Day Auto Delete
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}