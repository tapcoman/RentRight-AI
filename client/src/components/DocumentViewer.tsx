import { useState } from 'react';
import { Document } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DocumentViewerProps {
  document: Document;
  startAnalysis: () => void;
  isAnalysisComplete: boolean;
}

export default function DocumentViewer({ document, startAnalysis, isAnalysisComplete }: DocumentViewerProps) {
  const [, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [isDocumentExpanded, setIsDocumentExpanded] = useState(false);
  
  const totalPages = 1; // This would be dynamically determined from the actual document

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    if (zoom < 200) {
      setZoom(zoom + 10);
    }
  };

  const handleZoomOut = () => {
    if (zoom > 50) {
      setZoom(zoom - 10);
    }
  };

  const handleUploadNew = () => {
    setLocation('/');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 lg:sticky lg:top-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-ibm font-semibold text-[#1A202C]">{document.filename}</h2>
        <div className="flex space-x-2">
          <button className="p-2 rounded-full hover:bg-gray-100" title="Download">
            <svg className="w-5 h-5 text-[#4A5568]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100" title="Print">
            <svg className="w-5 h-5 text-[#4A5568]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100" title="Fullscreen">
            <svg className="w-5 h-5 text-[#4A5568]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <Collapsible 
        open={isDocumentExpanded} 
        onOpenChange={setIsDocumentExpanded}
        className="border border-gray-200 rounded-md mb-4"
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 cursor-pointer">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-[#2C5282]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <h3 className="text-sm font-medium text-[#4A5568]">Document Content</h3>
            </div>
            <div className="flex items-center">
              <svg 
                className={`w-5 h-5 transition-transform duration-200 text-[#4A5568] ${isDocumentExpanded ? 'transform rotate-180' : ''}`} 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="border-b border-gray-200 p-2">
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <button 
                  className="p-1 hover:bg-gray-100 rounded" 
                  title="Previous page"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <svg className={`w-5 h-5 ${currentPage === 1 ? 'text-gray-300' : 'text-[#4A5568]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <span className="text-sm text-[#4A5568]">Page <span className="font-medium">{currentPage}</span> of <span>{totalPages}</span></span>
                <button 
                  className="p-1 hover:bg-gray-100 rounded" 
                  title="Next page"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  <svg className={`w-5 h-5 ${currentPage === totalPages ? 'text-gray-300' : 'text-[#4A5568]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
              <div>
                <button 
                  className="p-1 hover:bg-gray-100 rounded" 
                  title="Zoom out"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                >
                  <svg className={`w-5 h-5 ${zoom <= 50 ? 'text-gray-300' : 'text-[#4A5568]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </button>
                <span className="text-sm text-[#4A5568]">{zoom}%</span>
                <button 
                  className="p-1 hover:bg-gray-100 rounded" 
                  title="Zoom in"
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                >
                  <svg className={`w-5 h-5 ${zoom >= 200 ? 'text-gray-300' : 'text-[#4A5568]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6 flex justify-center">
            {/* Document content preview */}
            <div 
              className="document-page w-full max-w-md aspect-[3/4] p-6 text-sm relative bg-white" 
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center top' }}
            >
              {document.content ? (
                <div className="whitespace-pre-wrap">
                  {document.content}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-[#4A5568]">
                    Document content preview not available.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      <div className="flex justify-between items-center">
        <button 
          className="text-sm text-[#4A5568] flex items-center hover:text-[#2C5282]"
          onClick={handleUploadNew}
        >
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          Upload new document
        </button>
        <div className="text-xs text-gray-400">
          Uploaded: {new Date(document.uploadedAt).toLocaleString()}
        </div>
      </div>
      
      {!isAnalysisComplete && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Button 
            className="w-full bg-[#2C5282] hover:bg-[#2C5282]/90"
            onClick={startAnalysis}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4"></polyline>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            Analyze Tenancy Agreement
          </Button>
        </div>
      )}
    </div>
  );
}
