import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PaymentModal from './PaymentModal';

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

  const results = analysis?.results as any;

  const handleShowPaymentModal = () => {
    setShowPaymentModal(true);
  };

  const handlePaidAnalysisComplete = (paymentIntentId: string, serviceType?: string, email?: string) => {
    setLastPaymentId(paymentIntentId);
    setShowPaymentModal(false);
    onPaidAnalysisComplete?.(paymentIntentId, serviceType, email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-[#EC7134]/10 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-[#EC7134] to-[#DC6327] text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Tenancy Agreement Analysis
                </h2>
                {isPreviewMode && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    Basic Preview
                  </Badge>
                )}
              </div>
              
              {!isPaidAnalysis && (
                <Button 
                  className="bg-white text-[#EC7134] hover:bg-gray-50 font-medium"
                  onClick={handleShowPaymentModal}
                >
                  Upgrade to Premium Analysis (£29)
                </Button>
              )}
            </div>
          </div>

          <div className="p-6">
            {/* Enhanced marketing content for non-paid users */}
            {!isPaidAnalysis && (
              <div className="space-y-6">
                {/* Primary upgrade prompt */}
                <div className="bg-gradient-to-br from-slate-50 to-orange-50 rounded-xl border border-[#EC7134]/20 p-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-[#EC7134]/10 rounded-full mb-4">
                      <svg className="w-6 h-6 text-[#EC7134]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <path d="M9 12l2 2 4-4"/>
                      </svg>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      We've found <span className="text-[#EC7134]">3 potential issues</span> in your lease agreement
                    </h3>
                    <p className="text-gray-600 text-sm mb-6">
                      Upgrade now to see all issues and receive a comprehensive analysis with detailed recommendations.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
                      <Button 
                        className="bg-[#EC7134] hover:bg-[#DC6327] text-white px-6 py-3 rounded-lg font-medium"
                        onClick={handleShowPaymentModal}
                      >
                        Unlock Full Analysis (£29)
                      </Button>
                      <Button 
                        variant="outline"
                        className="border-[#EC7134] text-[#EC7134] hover:bg-[#EC7134]/5 px-6 py-3 rounded-lg font-medium"
                        onClick={handleShowPaymentModal}
                      >
                        Get Analysis + Rewrite (£48)
                      </Button>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      <span className="text-green-600 font-medium">✓ Instant delivery</span> • 
                      <span className="text-green-600 font-medium">✓ Money-back guarantee</span> • 
                      <span className="text-green-600 font-medium">✓ Expert legal insights</span>
                    </div>
                  </div>
                </div>

                {/* Problem scenarios */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                        <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-red-900 text-sm mb-1">Unfair Deposit Terms</h4>
                        <p className="text-red-700 text-xs">Could cost you £500+ in unfair deposit deductions</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                        <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 text-sm mb-1">Hidden Break Costs</h4>
                        <p className="text-slate-700 text-xs">Early termination could cost £2,000+ in penalties</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                        <svg className="w-4 h-4 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-orange-900 text-sm mb-1">Maintenance Issues</h4>
                        <p className="text-orange-700 text-xs">Unclear repair responsibilities could cause disputes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Results Display */}
            {results && (
              <div className="space-y-6 mt-6">
                {/* Compliance Score Section */}
                <div className="bg-gradient-to-br from-slate-50 to-orange-50 rounded-xl border border-[#EC7134]/20 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Overall Compliance Score</h3>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${
                        results.complianceScore >= 80 ? 'text-green-600' :
                        results.complianceScore >= 60 ? 'text-slate-600' : 'text-red-600'
                      }`}>
                        {results.complianceScore}%
                      </div>
                      <p className="text-sm text-gray-600">Compliance Rating</p>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        results.complianceScore >= 80 ? 'bg-green-500' :
                        results.complianceScore >= 60 ? 'bg-slate-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${results.complianceScore}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-sm text-gray-700">
                    {results.complianceScore >= 80 ? 
                      'Your agreement shows good compliance with UK tenancy law.' :
                      results.complianceScore >= 60 ?
                      'Your agreement has some areas that need attention.' :
                      'Your agreement has significant compliance concerns that should be addressed.'
                    }
                  </p>
                </div>

                {/* Individual Issues */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues Found</h3>
                  <div className="space-y-3">
                    {results.issues?.map((issue: any, index: number) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{issue.title}</h4>
                            {isPaidAnalysis && issue.description && (
                              <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                            )}
                          </div>
                          <div className="flex items-center ml-4">
                            <Badge 
                              variant={
                                issue.severity === 'critical' ? 'destructive' :
                                issue.severity === 'warning' ? 'secondary' : 'default'
                              }
                              className={
                                issue.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                                issue.severity === 'warning' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                                'bg-green-50 text-green-700 border-green-200'
                              }
                            >
                              {issue.severity === 'critical' ? 'warning' :
                               issue.severity === 'warning' ? 'warning' : 'accent'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Modal */}
          {showPaymentModal && (
            <PaymentModal
              isOpen={showPaymentModal}
              onClose={() => setShowPaymentModal(false)}
              onSuccess={handlePaidAnalysisComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}