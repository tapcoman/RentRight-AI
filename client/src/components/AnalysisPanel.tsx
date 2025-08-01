import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import PaymentModal from './PaymentModal';
import { useToast } from '@/hooks/use-toast';

interface Analysis {
  id: number;
  documentId: number;
  isPaid: boolean;
  results?: any;
}

interface AnalysisPanelProps {
  analysis: Analysis;
  isPaidAnalysis?: boolean;
  isPreviewMode?: boolean;
  onPaidAnalysisComplete?: (paymentIntentId: string, serviceType?: string, email?: string) => void;
  onGenerateReport: (isPaid?: boolean, paymentIntentId?: string) => void;
}

export default function AnalysisPanel({ 
  analysis, 
  isPaidAnalysis = false, 
  isPreviewMode = false,
  onPaidAnalysisComplete,
  onGenerateReport
}: AnalysisPanelProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [lastPaymentId, setLastPaymentId] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const { toast } = useToast();

  // Enhanced result processing to handle both string and object formats
  const results = (() => {
    const rawResults = analysis?.results;
    
    if (!rawResults) {
      console.log('🔍 No raw results found');
      return null;
    }
    
    // If results is already an object, use it directly
    if (typeof rawResults === 'object') {
      console.log('🔍 Results is already an object:', {
        hasInsights: !!rawResults.insights,
        insightsCount: rawResults.insights?.length || 0
      });
      return rawResults;
    }
    
    // If results is a string, try to parse it
    if (typeof rawResults === 'string') {
      try {
        const parsed = JSON.parse(rawResults);
        console.log('🔍 Successfully parsed string results:', {
          hasInsights: !!parsed.insights,
          insightsCount: parsed.insights?.length || 0
        });
        return parsed;
      } catch (error) {
        console.error('🔍 Failed to parse results string:', error);
        return null;
      }
    }
    
    console.log('🔍 Unknown results format:', typeof rawResults);
    return null;
  })();
  
  // CRITICAL ENHANCED debug logging for analysis panel
  console.log('🔍 CRITICAL AnalysisPanel Debug:', {
    hasAnalysis: !!analysis,
    isPaidAnalysis,
    hasResults: !!results,
    hasInsights: !!results?.insights,
    insightsCount: results?.insights?.length || 0,
    analysisStructure: results ? Object.keys(results) : [],
    analysisId: analysis?.id,
    documentId: analysis?.documentId,
    analysisIsPaid: analysis?.isPaid,
    resultsType: typeof results,
    insightsType: typeof results?.insights,
    isInsightsArray: Array.isArray(results?.insights),
    firstInsight: results?.insights?.[0],
    
    // RAW DATA INSPECTION
    rawAnalysisResults: analysis?.results,
    rawAnalysisResultsType: typeof analysis?.results,
    rawAnalysisResultsKeys: analysis?.results ? Object.keys(analysis.results) : [],
    processedResultsObject: results,
    processedResultsKeys: results ? Object.keys(results) : [],
  });
  
  // SEPARATE DETAILED LOGS
  console.log('🔍 RAW ANALYSIS OBJECT:', analysis);
  console.log('🔍 RAW ANALYSIS RESULTS:', analysis?.results);
  console.log('🔍 PROCESSED RESULTS OBJECT:', results);
  
  if (results?.insights) {
    console.log('🔍 INSIGHTS DETAILED:', {
      insights: results.insights,
      insightsType: typeof results.insights,
      isArray: Array.isArray(results.insights),
      length: results.insights.length
    });
    
    if (Array.isArray(results.insights)) {
      results.insights.forEach((insight, index) => {
        console.log(`🔍 INSIGHT ${index}:`, insight);
      });
    }
  } else {
    console.log('❌ NO INSIGHTS IN PROCESSED RESULTS');
  }

  const handleShowPaymentModal = () => {
    try {
      setShowPaymentModal(true);
    } catch (error) {
      console.error('Error opening payment modal:', error);
      toast({
        title: 'Payment Error',
        description: 'Unable to open payment modal. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handlePaidAnalysisComplete = (paymentIntentId: string, serviceType?: string, email?: string) => {
    try {
      setLastPaymentId(paymentIntentId);
      setShowPaymentModal(false);
      onPaidAnalysisComplete?.(paymentIntentId, serviceType, email);
      
      toast({
        title: 'Payment Successful',
        description: 'Your premium analysis is being generated.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error completing payment:', error);
      toast({
        title: 'Payment Processing Error',
        description: 'Payment succeeded but there was an issue processing your analysis.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#EC7134]/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#EC7134]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <path d="M14 2v6h6"/>
                  <path d="M16 13H8"/>
                  <path d="M16 17H8"/>
                  <path d="M10 9H8"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Tenancy Agreement Analysis
              </h2>
            </div>
            {isPreviewMode && (
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                Basic Preview
              </Badge>
            )}
          </div>
          
          {!isPaidAnalysis && (
            <Button 
              onClick={handleShowPaymentModal}
              disabled={showPaymentModal}
              size="lg"
              className="font-semibold whitespace-nowrap"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Upgrade to Premium
            </Button>
          )}
        </div>
      </div>

      {/* Clean upgrade prompt for non-paid users */}
      {!isPaidAnalysis && (
        <div className="mx-6 mb-6">
          <div className="bg-gradient-to-br from-slate-50 to-orange-50 rounded-xl border border-[#EC7134]/20 p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#EC7134]/10 rounded-full mb-4">
                <svg className="w-6 h-6 text-[#EC7134]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                We've found <span className="text-[#EC7134]">potential issues</span> in your lease
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                Upgrade to premium analysis to see detailed findings, legal explanations, and actionable recommendations to protect your rights.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
                <Button 
                  onClick={handleShowPaymentModal}
                  disabled={showPaymentModal}
                  size="lg"
                  className="font-semibold px-6 py-3"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                  Unlock Full Analysis (£29)
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleShowPaymentModal}
                  disabled={showPaymentModal}
                  size="lg"
                  className="font-semibold px-6 py-3"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <path d="M14 2v6h6"/>
                  </svg>
                  Add Lease Rewrite (+£19)
                </Button>
              </div>
              
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                  Secure Payment
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  Instant Access
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Money-back Guarantee
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ALWAYS SHOW ANALYSIS CONTENT FOR DEBUGGING */}
      <div className="px-6 pb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-yellow-800 mb-2">🔍 Debug: Analysis Panel Content Check</h4>
          <div className="text-sm space-y-1">
            <div><strong>Has Results:</strong> {results ? 'YES' : 'NO'}</div>
            <div><strong>Results Type:</strong> {typeof results}</div>
            <div><strong>Has Insights:</strong> {results?.insights ? 'YES' : 'NO'}</div>
            <div><strong>Insights Type:</strong> {typeof results?.insights}</div>
            <div><strong>Is Insights Array:</strong> {Array.isArray(results?.insights) ? 'YES' : 'NO'}</div>
            <div><strong>Insights Length:</strong> {Array.isArray(results?.insights) ? results.insights.length : 'N/A'}</div>
            {results && (
              <details className="mt-2">
                <summary className="cursor-pointer">Show Raw Results</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>

        {(() => {
          const hasInsights = results?.insights && Array.isArray(results.insights) && results.insights.length > 0;
          
          console.log('🎯 Render condition check:', {
            hasResults: !!results,
            hasInsights,
            insightsCount: results?.insights?.length || 0,
            isPaidAnalysis,
            resultsType: typeof results
          });
          
          return hasInsights;
        })() ? (
          <div className="space-y-4">
            {(results?.insights || []).map((insight: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      insight.severity === 'high' || insight.type === 'warning' 
                        ? 'bg-red-100'
                        : insight.severity === 'medium' 
                        ? 'bg-slate-100'
                        : 'bg-green-100'
                    }`}>
                      <svg className={`w-4 h-4 ${
                        insight.severity === 'high' || insight.type === 'warning' 
                          ? 'text-red-600'
                          : insight.severity === 'medium' 
                          ? 'text-slate-600'
                          : 'text-green-600'
                      }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {insight.severity === 'high' || insight.type === 'warning' ? (
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        ) : insight.severity === 'medium' ? (
                          <circle cx="12" cy="12" r="10"/>
                        ) : (
                          <path d="M9 12l2 2 4-4"/>
                        )}
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{insight.section || insight.title}</h4>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    insight.severity === 'high' || insight.type === 'warning' 
                      ? 'bg-red-100 text-red-800' 
                      : insight.severity === 'medium' 
                      ? 'bg-slate-100 text-slate-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {insight.severity === 'high' ? 'High Priority' : insight.severity === 'medium' ? 'Medium Priority' : 'Good'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">{insight.summary || insight.description}</p>
                {insight.recommendation && (
                  <div className="bg-[#EC7134]/5 border border-[#EC7134]/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 bg-[#EC7134]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-2 h-2 text-[#EC7134]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                      <div>
                        <h5 className="font-medium text-[#EC7134] text-sm mb-1">Recommendation:</h5>
                        <p className="text-sm text-gray-700">{insight.recommendation}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : isPaidAnalysis ? (
        <div className="px-6 pb-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v6l4 2"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis in Progress</h3>
            <p className="text-gray-600 mb-4">
              Your premium analysis is being generated. Results will appear here automatically when complete.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh Page
            </Button>
          </div>
        </div>
      ) : null}

      {/* Clean Generate Report Section - Only show if analysis has results */}
      {isPaidAnalysis && results?.insights && results.insights.length > 0 && (
        <div className="mx-6 mb-6 pt-6 border-t border-gray-100">
          {reportError && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {reportError}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="text-center">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-[#EC7134]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#EC7134]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <path d="M14 2v6h6"/>
                  <path d="M16 13H8"/>
                  <path d="M16 17H8"/>
                  <path d="M10 9H8"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Your Analysis</h3>
              <p className="text-gray-600 text-sm mb-6">Download a PDF or view the full interactive report</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  disabled={isGeneratingReport}
                  loading={isGeneratingReport}
                  loadingText="Generating PDF..."
                  onClick={async () => {
                    try {
                      setIsGeneratingReport(true);
                      setReportError(null);
                      await onGenerateReport(isPaidAnalysis, lastPaymentId || undefined);
                      
                      toast({
                        title: 'PDF Downloaded',
                        description: 'Your PDF report has been generated and downloaded.',
                        variant: 'default'
                      });
                    } catch (error: any) {
                      const errorMessage = error.message || 'Failed to generate report. Please try again.';
                      setReportError(errorMessage);
                      toast({
                        title: 'Report Generation Failed',
                        description: errorMessage,
                        variant: 'destructive'
                      });
                    } finally {
                      setIsGeneratingReport(false);
                    }
                  }}
                  size="lg"
                  className="font-semibold px-6 py-3"
                >
                  {!isGeneratingReport && (
                    <>
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                      </svg>
                      Download PDF
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open(`/analysis/${analysis.documentId}/report`, '_blank')}
                  size="lg"
                  className="font-semibold px-6 py-3"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15,3 21,3 21,9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  View Full Report
                </Button>
              </div>
              
              {isGeneratingReport && (
                <p className="text-sm text-gray-600 mt-3">
                  This may take a few moments...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaidAnalysisComplete}
          documentId={analysis.documentId}
        />
      )}
    </div>
  );
}