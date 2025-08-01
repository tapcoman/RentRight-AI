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
    <div className="bg-white">
      {/* Header Section */}
      <div className="border-b border-gray-200 pb-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Tenancy Agreement Analysis
            </h2>
            {isPreviewMode && (
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                Basic Preview
              </Badge>
            )}
          </div>
          
          {!isPaidAnalysis && (
            <Button 
              className="bg-[#EC7134] hover:bg-[#DC6327] text-white"
              onClick={handleShowPaymentModal}
            >
              Upgrade to Premium Analysis (£29) or Premium + Rewrite (£48)
            </Button>
          )}
        </div>
      </div>

      {/* Streamlined upgrade prompt for non-paid users */}
      {!isPaidAnalysis && (
        <div className="bg-gradient-to-br from-slate-50 to-orange-50 rounded-xl border border-[#EC7134]/20 p-6 mb-6">
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
                Add Lease Rewrite (+£19)
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                </svg>
                Secure Payment
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                Instant Access
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Content */}
      {isPaidAnalysis && results?.insights && (
        <div className="space-y-4">
          {results.insights.map((insight: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-gray-900">{insight.section || insight.title}</h4>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  insight.severity === 'high' || insight.type === 'warning' 
                    ? 'bg-red-100 text-red-800' 
                    : insight.severity === 'medium' 
                    ? 'bg-slate-100 text-slate-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {insight.severity || insight.type || 'Review'}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-3">{insight.summary || insight.description}</p>
              {insight.recommendation && (
                <div className="bg-[#EC7134]/5 border border-[#EC7134]/20 rounded-lg p-3">
                  <p className="text-sm text-gray-700">{insight.recommendation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Generate Report Section */}
      {isPaidAnalysis && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center">
            <Button 
              className="bg-[#EC7134] hover:bg-[#DC6327] text-white px-8 py-3"
              onClick={() => onGenerateReport(isPaidAnalysis, lastPaymentId || undefined)}
            >
              Generate PDF Report
            </Button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaidAnalysisComplete}
          analysis={analysis}
          isPaidAnalysis={isPaidAnalysis}
        />
      )}
    </div>
  );
}