import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Analysis, Document } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Printer, Mail, Download, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sendAnalysisEmail } from '@/lib/api';
import LeaseRewritePaymentModal from '@/components/LeaseRewritePaymentModal';
import ResponseTemplates from '@/components/ResponseTemplates';

export default function ReportView() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showRewriteModal, setShowRewriteModal] = useState(false);

  // Extract the document ID from the URL
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const idFromPath = parseInt(pathParts[pathParts.length - 2]);
    if (!isNaN(idFromPath)) {
      setDocumentId(idFromPath);
    }
  }, []);

  // Fetch the document and analysis
  const { data: document } = useQuery<Document>({
    queryKey: [`/api/documents/${documentId}`],
    enabled: !!documentId && !isNaN(documentId),
  });

  const { data: analysis, isLoading: isLoadingAnalysis } = useQuery<Analysis>({
    queryKey: [`/api/documents/${documentId}/analysis`],
    enabled: !!documentId && !isNaN(documentId),
    staleTime: 0, // Always get the latest data
    refetchOnMount: true,
  });

  // Check if user already paid for combined service
  const { data: payments } = useQuery<any[]>({
    queryKey: [`/api/documents/${documentId}/payments`],
    enabled: !!documentId && !isNaN(documentId),
  });

  // Parse analysis results
  const analysisResults = analysis?.results ? 
    (typeof analysis.results === 'string' ? 
      JSON.parse(analysis.results) : analysis.results) : null;
      
  // For debugging - log the analysis results to console
  useEffect(() => {
    if (analysisResults) {
      console.log('Analysis results:', analysisResults);
    }
  }, [analysisResults]);

  // Calculate compliance information
  const getComplianceInfo = () => {
    if (!analysisResults) return { score: 0, level: 'unknown', label: 'Unknown', color: '#888888' };
    
    // Extract insights by type
    const insights = analysisResults.insights || [];
    const warningInsights = insights.filter((insight: any) => insight.type === 'warning').length;
    const accentInsights = insights.filter((insight: any) => insight.type === 'accent').length;
    
    // Count only insights that are not already marked as fair or good protection
    const relevantInsights = insights.filter((insight: any) => {
      const hasRating = insight.rating !== undefined && typeof insight.rating?.value === 'number';
      const ratingValue = hasRating && insight.rating ? insight.rating.value : 50;
      
      // Only include insights with ratings below 60 (exclude good or fair protections)
      return !hasRating || ratingValue < 60;
    });
    
    // Use the filtered count or 1 to avoid division by zero
    const totalInsightCount = relevantInsights.length || 1;
    
    // Identify severe legal issues based on pattern matching in content
    let seriousLegalIssues = 0;
    let moderateLegalIssues = 0;
    
    // Count serious legal issues, but exclude ones with good or fair protection ratings
    insights.forEach((insight: any) => {
      const content = (insight.content || '').toLowerCase();
      const title = (insight.title || '').toLowerCase();
      const hasRating = insight.rating !== undefined && typeof insight.rating?.value === 'number';
      const ratingValue = hasRating && insight.rating ? insight.rating.value : 50;
      
      // Skip insights with good or fair protection ratings (60 or above)
      if (hasRating && ratingValue >= 60) {
        return;
      }
      
      // Check if it's a warning type insight (red flag)
      if (insight.type === 'warning') {
        seriousLegalIssues++;
      }
      // Check if it's an accent type insight (yellow flag)
      else if (insight.type === 'accent') {
        moderateLegalIssues++;
      }
    });
    
    // Calculate compliance percentage as in AnalysisPanel
    // If there are no issues, we should have 100% compliance
    const compliancePercentage = totalInsightCount > 0 
      ? Math.round((totalInsightCount - seriousLegalIssues - moderateLegalIssues) / totalInsightCount * 100)
      : 100;
    
    // Get the specific type of the warning insight if there's only one
    const rentWithholdingIssue = insights.some((insight: any) => 
      insight.type === 'warning' && 
      (insight.title || '').toLowerCase().includes('rent withholding')
    );
    
    // Determine compliance level using the same logic as AnalysisPanel
    let complianceLevel = 'green';
    let complianceText = 'This agreement appears to comply with UK housing laws.';
    let score = 100;
    let color = '#34D399'; // Green
    
    if (seriousLegalIssues >= 3) {
      // RED: Multiple serious issues
      complianceLevel = 'red';
      complianceText = 'This agreement has significant issues with UK housing law compliance.';
      score = 25;
      color = '#EF4444'; // Red
    } 
    else if (seriousLegalIssues === 2) {
      // YELLOW: Two serious issues
      complianceLevel = 'yellow';
      complianceText = 'This agreement has some potential compliance concerns with UK housing laws.';
      score = 50;
      color = '#F2B705'; // Amber/Yellow
    }
    else if (seriousLegalIssues === 1) {
      // YELLOW: One serious issue
      complianceLevel = 'yellow';
      complianceText = 'This agreement generally complies with UK housing laws, with one area requiring attention.';
      score = 65;
      color = '#F2B705'; // Amber/Yellow
    }
    else if (moderateLegalIssues >= 2) {
      // YELLOW: Multiple moderate issues but no serious issues
      complianceLevel = 'yellow';
      complianceText = 'This agreement generally complies with UK housing laws, with a few consideration points.';
      score = 75;
      color = '#F2B705'; // Amber/Yellow
    }
    else {
      // GREEN: No serious issues and at most one moderate issue
      complianceLevel = 'green';
      if (moderateLegalIssues === 1) {
        complianceText = 'This agreement generally complies with UK housing laws, with one minor note.';
        score = 90;
      } else {
        complianceText = 'This agreement appears to comply with UK housing laws.';
        score = 100;
      }
      color = '#34D399'; // Green
    }
    
    // Override with exact score if provided in the analysis results
    if (analysisResults.complianceScore !== undefined) {
      score = analysisResults.complianceScore;
    } else if (analysisResults.compliance?.score !== undefined) {
      score = analysisResults.compliance.score;
    } else if (analysisResults.score !== undefined) {
      score = analysisResults.score;
    }
    
    return { 
      score, 
      level: complianceLevel, 
      label: complianceText, 
      color 
    };
  };

  const complianceInfo = getComplianceInfo();

  // Print the report
  const handlePrint = () => {
    window.print();
  };

  // Send report via email
  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive'
      });
      return;
    }

    if (!documentId || !analysis) return;

    try {
      setSendingEmail(true);
      await sendAnalysisEmail(documentId, email);
      setShowEmailForm(false);
      toast({
        title: 'Email Sent',
        description: 'The analysis report has been sent to your email.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was an error sending the email. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSendingEmail(false);
    }
  };

  // Handle lease rewrite payment success
  const handleRewriteSuccess = async (paymentIntentId: string, serviceType: string, email?: string) => {
    setShowRewriteModal(false);
    
    try {
      // Call the rewrite generation API
      const response = await fetch(`/api/documents/${documentId}/generate-rewrite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          serviceType,
          format: 'docx',
          email: email || undefined
        }),
      });

      if (response.ok) {
        // Trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = `tenant-friendly-lease-${documentId}.docx`;
        window.document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        window.document.body.removeChild(a);

        toast({
          title: "Lease rewrite complete!",
          description: email 
            ? "Your tenant-friendly lease has been downloaded and emailed to you."
            : "Your tenant-friendly lease has been downloaded.",
        });
      } else {
        throw new Error('Failed to generate rewrite');
      }
    } catch (error) {
      toast({
        title: "Error generating rewrite",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  // Handle back button
  const handleBack = () => {
    if (documentId) {
      setLocation(`/analysis/${documentId}`);
    } else {
      setLocation('/');
    }
  };

  if (isLoadingAnalysis || !analysis || !document) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Loading Report...</h1>
          <Button variant="outline" onClick={handleBack}><ArrowLeft className="mr-2" size={16} /> Back</Button>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Group insights by type for the report
  const warningInsights = analysisResults?.insights?.filter((insight: any) => {
    // Type must be warning but exclude insights with good protection ratings
    const hasRating = insight.rating !== undefined && typeof insight.rating?.value === 'number';
    const ratingValue = hasRating && insight.rating ? insight.rating.value : 50;
    
    // If it's a good or fair protection rating (>= 60), don't include in serious issues
    if (hasRating && ratingValue >= 60) {
      return false;
    }
    
    return insight.type === 'warning';
  }) || [];
  const accentInsights = analysisResults?.insights?.filter((insight: any) => {
    // Type must be accent but exclude insights with good protection ratings
    const hasRating = insight.rating !== undefined && typeof insight.rating?.value === 'number';
    const ratingValue = hasRating && insight.rating ? insight.rating.value : 50;
    
    // If it's a good or fair protection rating (>= 60), don't include in areas of concern
    if (hasRating && ratingValue >= 60) {
      return false;
    }
    
    return insight.type === 'accent';
  }) || [];
  // Create a specific collection for good protection insights
  const goodProtectionInsights = analysisResults?.insights?.filter((insight: any) => {
    const hasRating = insight.rating !== undefined && typeof insight.rating?.value === 'number';
    const ratingValue = hasRating && insight.rating ? insight.rating.value : 50;
    
    // If it has a high rating (>= 80), include it in good protection
    return hasRating && ratingValue >= 80 && (insight.type === 'warning' || insight.type === 'accent');
  }) || [];
  
  // Create a specific collection for fair protection insights (rated 60-79)
  const fairProtectionInsights = analysisResults?.insights?.filter((insight: any) => {
    const hasRating = insight.rating !== undefined && typeof insight.rating?.value === 'number';
    const ratingValue = hasRating && insight.rating ? insight.rating.value : 50;
    
    // If it has a fair rating (60-79), include it in fair protection
    return hasRating && ratingValue >= 60 && ratingValue < 80 && (insight.type === 'warning' || insight.type === 'accent');
  }) || [];
  
  const standardInsights = analysisResults?.insights?.filter((insight: any) => 
    insight.type !== 'warning' && insight.type !== 'accent') || [];

  return (
    <div className="container mx-auto py-6 sm:py-8 px-3 sm:px-4 print:py-2 max-w-4xl">
      {/* Header with actions - hide on print */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
        <h1 className="text-2xl sm:text-3xl font-bold">Lease Analysis Report</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleBack} className="text-xs sm:text-sm flex-1 sm:flex-none">
            <ArrowLeft className="mr-1 sm:mr-2" size={14} /> Back
          </Button>
          <Button variant="outline" onClick={handlePrint} className="text-xs sm:text-sm flex-1 sm:flex-none">
            <Printer className="mr-1 sm:mr-2" size={14} /> Print
          </Button>
          <Button variant="outline" onClick={() => setShowEmailForm(!showEmailForm)} className="text-xs sm:text-sm flex-1 sm:flex-none">
            <Mail className="mr-1 sm:mr-2" size={14} /> Email
          </Button>
        </div>
      </div>

      {/* Email form */}
      {showEmailForm && (
        <Card className="mb-6 p-4 print:hidden">
          <h3 className="text-lg font-medium mb-3">Send Report via Email</h3>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <Label htmlFor="email" className="mb-1.5">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="your@email.com"
              />
            </div>
            <Button 
              onClick={handleSendEmail} 
              disabled={sendingEmail}
              className="w-full sm:w-auto whitespace-nowrap"
            >
              {sendingEmail ? 'Sending...' : 'Send Report'}
            </Button>
          </div>
        </Card>
      )}

      {/* Report header - visible in print */}
      <div className="print:block print:mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-blue-800 print:text-3xl">RentRight AI</h1>
          <p className="text-gray-500 print:text-sm">
            Report generated on {new Date().toLocaleDateString()}
          </p>
        </div>
        <p className="text-blue-600 text-xl print:text-lg">AI-Powered Lease Analysis</p>
      </div>

      {/* Document info */}
      <Card className="mb-6 p-4 sm:p-6 print:shadow-none print:border-none relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-gray-500"></div>
        <div className="relative z-10">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold print:text-xl">Document Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-600 text-sm mb-1">Document Name</p>
              <p className="font-medium text-gray-900">{document.filename}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-600 text-sm mb-1">Analysis Date</p>
              <p className="font-medium text-gray-900">
                {new Date(analysis.completedAt || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Compliance score - updated styling to match analysis panel */}
      <Card className="mb-6 p-4 sm:p-6 print:shadow-none print:border-none relative overflow-hidden">
        <div className={`absolute inset-0 opacity-10 ${
          complianceInfo.level === 'green' ? 'bg-green-500' :
          complianceInfo.level === 'yellow' ? 'bg-amber-500' : 'bg-red-500'
        }`}></div>
        
        <div className="relative z-10">
          <div className="flex items-center mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
              complianceInfo.level === 'green' ? 'bg-green-100' :
              complianceInfo.level === 'yellow' ? 'bg-amber-100' : 'bg-red-100'
            }`}>
              <svg className={`w-5 h-5 ${
                complianceInfo.level === 'green' ? 'text-green-600' :
                complianceInfo.level === 'yellow' ? 'text-amber-600' : 'text-red-600'
              }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d={complianceInfo.level === 'green' 
                    ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                    : complianceInfo.level === 'yellow'
                    ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  } 
                />
              </svg>
            </div>
            <h2 className={`text-2xl font-bold print:text-xl ${
              complianceInfo.level === 'green' ? 'text-green-600' :
              complianceInfo.level === 'yellow' ? 'text-amber-600' : 'text-red-600'
            }`}>Compliance Assessment</h2>
          </div>
          
          <div className="flex items-center">
            <div className="relative w-full max-w-sm h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  complianceInfo.level === 'green' ? 'bg-gradient-to-r from-green-400 to-green-500' :
                  complianceInfo.level === 'yellow' ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                  'bg-gradient-to-r from-red-400 to-red-500'
                }`}
                style={{ width: `${complianceInfo.score}%` }}
              ></div>
            </div>
            <div className="ml-4">
              <span className={`text-xl font-bold ${
                complianceInfo.level === 'green' ? 'text-green-500' :
                complianceInfo.level === 'yellow' ? 'text-amber-500' :
                'text-red-500'
              }`}>
                {complianceInfo.score}%
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              complianceInfo.level === 'green' ? 'bg-green-100 text-green-800' :
              complianceInfo.level === 'yellow' ? 'bg-amber-100 text-amber-800' :
              'bg-red-100 text-red-800'
            }`}>
              {complianceInfo.level === 'green' ? 'Good - Generally Fair Agreement' :
               complianceInfo.level === 'yellow' ? 'Attention Required' :
               'Multiple Serious Issues'}
            </div>
          </div>
          
          <p className="mt-3 text-gray-700 dark:text-gray-300">
            {complianceInfo.label}
          </p>
        </div>
      </Card>
      
      {/* Lease Rewrite Section - only show if analysis indicates issues */}
      {complianceInfo.score < 80 && (
        <Card className="mb-6 p-4 sm:p-6 print:hidden relative overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <div className="absolute inset-0 opacity-5 bg-orange-500"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-orange-700">Get Your Lease Rewritten</h2>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <p className="text-gray-700 mb-4">
                Based on your analysis results showing <span className="font-semibold text-orange-600">{complianceInfo.score}% compliance</span>, 
                you could benefit from a tenant-friendly rewrite of your lease agreement.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">What You'll Get:</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      More balanced tenant rights
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Clearer terms and responsibilities
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      UK housing law compliance
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Professional Word document format
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Common Improvements:</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
                      </svg>
                      Fair deposit protection terms
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
                      </svg>
                      Reasonable break clause conditions
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
                      </svg>
                      Clear maintenance responsibilities
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
                      </svg>
                      Balanced notice periods
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-gray-50 rounded-lg p-3">
                <div>
                  <p className="font-semibold text-gray-900">Tenant-Friendly Lease Rewrite</p>
                  <p className="text-sm text-gray-600">Complete rewritten agreement delivered within minutes</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">£19</p>
                  {analysis?.isPaid ? (() => {
                    // Check if user already paid for combined service
                    const hasCombinedPayment = payments?.some(payment => 
                      payment.serviceType === 'combined' && payment.status === 'succeeded'
                    );
                    
                    if (hasCombinedPayment) {
                      // User already paid for combined - offer free rewrite generation
                      return (
                        <div className="mt-2">
                          <Button 
                            className="bg-green-600 hover:bg-green-700 text-white mt-2"
                            onClick={() => handleRewriteSuccess("already_paid", "combined")}
                          >
                            Generate Rewrite
                          </Button>
                          <p className="text-xs text-green-600 mt-1 text-right">
                            Included in your package
                          </p>
                        </div>
                      );
                    } else {
                      // User needs to pay for standalone rewrite
                      return (
                        <Button 
                          className="bg-orange-600 hover:bg-orange-700 text-white mt-2"
                          onClick={() => setShowRewriteModal(true)}
                        >
                          Get Rewrite
                        </Button>
                      );
                    }
                  })() : (
                    <div className="mt-2">
                      <Button 
                        disabled 
                        className="bg-gray-400 cursor-not-allowed text-white mt-2 opacity-60"
                      >
                        Get Rewrite
                      </Button>
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        Complete paid analysis first
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
      
      {/* Lease Terms Summary */}
      <Card className="mb-6 p-4 sm:p-6 print:shadow-none print:border-none relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-blue-500"></div>
        <div className="relative z-10">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold print:text-xl text-blue-700">Key Lease Terms</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            {/* Lease Period */}
            {(analysisResults?.tenancyPeriod || analysisResults?.leasePeriod) && (  // Support both field names for compatibility
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/50 hover:bg-blue-50 transition-colors">
                <h3 className="font-semibold text-blue-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Tenancy Period
                </h3>
                <div className="space-y-1">
                  {(analysisResults.tenancyPeriod?.startDate || analysisResults.leasePeriod?.startDate) && (
                    <p className="text-sm"><span className="font-medium">Start Date:</span> {analysisResults.tenancyPeriod?.startDate || analysisResults.leasePeriod?.startDate}</p>
                  )}
                  {(analysisResults.tenancyPeriod?.endDate || analysisResults.leasePeriod?.endDate) && (
                    <p className="text-sm"><span className="font-medium">End Date:</span> {analysisResults.tenancyPeriod?.endDate || analysisResults.leasePeriod?.endDate}</p>
                  )}
                  {(analysisResults.tenancyPeriod?.term || analysisResults.leasePeriod?.term) && (
                    <p className="text-sm"><span className="font-medium">Term:</span> {analysisResults.tenancyPeriod?.term || analysisResults.leasePeriod?.term}</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Financial Terms */}
            {analysisResults?.financialTerms && (
              <div className="border border-green-200 rounded-lg p-4 bg-green-50/50 hover:bg-green-50 transition-colors">
                <h3 className="font-semibold text-green-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Financial Terms
                </h3>
                <div className="space-y-1">
                  {analysisResults.financialTerms.rent && (
                    <p className="text-sm"><span className="font-medium">Rent:</span> {analysisResults.financialTerms.rent}</p>
                  )}
                  {analysisResults.financialTerms.deposit && (
                    <p className="text-sm"><span className="font-medium">Deposit:</span> {analysisResults.financialTerms.deposit}</p>
                  )}
                  {analysisResults.financialTerms.paymentMethod && (
                    <p className="text-sm"><span className="font-medium">Payment Method:</span> {analysisResults.financialTerms.paymentMethod}</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Property Details */}
            {analysisResults?.propertyDetails && (
              <div className="border border-sky-200 rounded-lg p-4 bg-sky-50/50 hover:bg-sky-50 transition-colors">
                <h3 className="font-semibold text-sky-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Property Details
                </h3>
                <div className="space-y-1">
                  {analysisResults.propertyDetails.address && (
                    <p className="text-sm"><span className="font-medium">Address:</span> {analysisResults.propertyDetails.address}</p>
                  )}
                  {analysisResults.propertyDetails.propertyType && (
                    <p className="text-sm"><span className="font-medium">Type:</span> {analysisResults.propertyDetails.propertyType}</p>
                  )}
                  {analysisResults.propertyDetails.size && (
                    <p className="text-sm"><span className="font-medium">Size:</span> {analysisResults.propertyDetails.size}</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Parties */}
            {analysisResults?.parties && (
              <div className="border border-purple-200 rounded-lg p-4 bg-purple-50/50 hover:bg-purple-50 transition-colors">
                <h3 className="font-semibold text-purple-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Parties
                </h3>
                <div className="space-y-1">
                  {analysisResults.parties.landlord && (
                    <p className="text-sm"><span className="font-medium">Landlord:</span> {analysisResults.parties.landlord}</p>
                  )}
                  {analysisResults.parties.tenant && (
                    <p className="text-sm"><span className="font-medium">Tenant:</span> {analysisResults.parties.tenant}</p>
                  )}
                  {analysisResults.parties.agent && (
                    <p className="text-sm"><span className="font-medium">Agent:</span> {analysisResults.parties.agent}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Key issues */}
      {warningInsights.length > 0 && (
        <Card className="mb-6 p-4 sm:p-6 print:shadow-none print:border-none relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-red-500"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold print:text-xl text-red-600">Key Issues Identified</h2>
            </div>
            <ul className="space-y-4 mt-5">
              {warningInsights.map((insight: any, index: number) => (
                <li key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-bold text-lg text-red-700 mb-2">{insight.title}</h3>
                  <p className="text-gray-700">{insight.content}</p>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {/* Concerns */}
      {accentInsights.length > 0 && (
        <Card className="mb-6 p-4 sm:p-6 print:shadow-none print:border-none relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-amber-500"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold print:text-xl text-amber-600">Areas of Concern</h2>
            </div>
            <ul className="space-y-4 mt-5">
              {accentInsights.map((insight: any, index: number) => {
                // Determine color intensity based on rating
                const hasRating = insight.rating && typeof insight.rating.value === 'number';
                const ratingValue = hasRating ? insight.rating.value : 50;
                const ratingLabel = hasRating ? insight.rating.label : 'Moderate Protection';
                
                // Determine UI styling based on rating
                let borderClass = "border-amber-200";
                let bgClass = "bg-amber-50";
                let headingClass = "text-amber-700";
                
                // Higher ratings (better protection) get lighter amber shades
                if (ratingValue >= 80) {
                  borderClass = "border-amber-100";
                  bgClass = "bg-amber-50/60";
                  headingClass = "text-amber-600";
                } 
                // Lower ratings (worse protection) get deeper amber shades
                else if (ratingValue < 60) {
                  borderClass = "border-amber-300";
                  bgClass = "bg-amber-100";
                  headingClass = "text-amber-800";
                }
                
                return (
                  <li key={index} className={`${bgClass} border ${borderClass} rounded-lg p-4`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-bold text-lg ${headingClass}`}>
                        {insight.title}
                      </h3>
                      {hasRating && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          ratingValue >= 80 ? "bg-green-50 text-green-700 border border-green-200" :
                          ratingValue >= 70 ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          "bg-orange-50 text-orange-700 border border-orange-200"
                        }`}>
                          {ratingValue >= 80 ? "Review Required" :
                           ratingValue >= 70 ? "Further Investigation" :
                           "Needs Attention"}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700">{insight.content}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </Card>
      )}

      {/* Standard insights */}
      {/* Good Protection Sections */}
      {goodProtectionInsights.length > 0 && (
        <Card className="mb-6 p-4 sm:p-6 print:shadow-none print:border-none relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-green-500"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold print:text-xl text-green-600">Good Protections</h2>
            </div>
            <ul className="space-y-4 mt-5">
              {goodProtectionInsights.map((insight: any, index: number) => {
                return (
                  <li key={index} className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <h3 className="text-lg font-medium text-green-700 mb-2">{insight.title}</h3>
                    <p className="text-gray-700">{insight.content}</p>
                    {insight.indicators && insight.indicators.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {insight.indicators.map((indicator: string, i: number) => (
                          <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {indicator}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </Card>
      )}
      
      {/* Fair Protection Sections */}
      {fairProtectionInsights.length > 0 && (
        <Card className="mb-6 p-4 sm:p-6 print:shadow-none print:border-none relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-amber-500"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold print:text-xl text-amber-600">Fair Protections</h2>
            </div>
            <ul className="space-y-4 mt-5">
              {fairProtectionInsights.map((insight: any, index: number) => {
                return (
                  <li key={index} className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                    <h3 className="text-lg font-medium text-amber-700 mb-2">{insight.title}</h3>
                    <p className="text-gray-700">{insight.content}</p>
                    {insight.indicators && insight.indicators.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {insight.indicators.map((indicator: string, i: number) => (
                          <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            {indicator}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </Card>
      )}

      {/* Standard insights - informational elements about the agreement */}
      {standardInsights.length > 0 && (
        <Card className="mb-6 p-4 sm:p-6 print:shadow-none print:border-none relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-blue-500"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold print:text-xl text-blue-600">Additional Information</h2>
            </div>
            <ul className="space-y-4 mt-5">
              {standardInsights.map((insight: any, index: number) => (
                <li key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-lg text-blue-700 mb-2">{insight.title}</h3>
                  <p className="text-gray-700">{insight.content}</p>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}
      
      {/* Tenant Recommendations */}
      {analysisResults?.recommendations && analysisResults.recommendations.length > 0 && (
        <Card className="mb-6 p-4 sm:p-6 print:shadow-none print:border-none relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-green-500"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold print:text-xl text-green-600">Tenant Recommendations</h2>
            </div>
            <ul className="space-y-4 mt-5">
              {analysisResults.recommendations.map((recommendation: any, index: number) => (
                <li key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-bold text-lg text-green-700 mb-2">Recommendation {index + 1}</h3>
                  <p className="text-gray-700">{recommendation.content}</p>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {/* Legal disclaimer */}
      <div className="mt-8 text-sm text-gray-500 print:text-xs">
        <p className="font-bold">DISCLAIMER:</p>
        <p>
          This analysis is generated using artificial intelligence and is provided for informational purposes only.
          It does not constitute legal advice. The analysis may not be comprehensive or fully accurate in all circumstances.
          You should consult with a qualified legal professional before making any decisions based on this report.
          RentRight AI does not guarantee the accuracy or completeness of this report and accepts no liability for decisions made based on its contents.
        </p>
      </div>

      {/* Response Templates Section */}
      {documentId && analysisResults && (
        <div className="mt-12 print:hidden">
          <Separator className="my-8" />
          <ResponseTemplates 
            documentId={documentId}
            analysisResults={analysisResults}
          />
        </div>
      )}

      {/* Footer - for print only */}
      <div className="hidden print:block mt-8 pt-4 border-t text-center text-xs text-gray-400">
        <p>RentRight AI Analysis Report | Page 1 of 1 | {new Date().toLocaleDateString()}</p>
      </div>

      {/* Print styles - hidden in normal view */}
      <style type="text/css" media="print">{`
        @page {
          size: A4;
          margin: 1.5cm;
        }
        body {
          font-size: 12pt;
          color: #000;
        }
        .container {
          width: 100% !important;
          max-width: none !important;
        }
      `}</style>

      {/* Lease Rewrite Payment Modal */}
      {showRewriteModal && documentId && (
        <LeaseRewritePaymentModal
          isOpen={showRewriteModal}
          onClose={() => setShowRewriteModal(false)}
          onSuccess={handleRewriteSuccess}
          documentId={documentId}
        />
      )}
    </div>
  );
}