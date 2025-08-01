import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import CaptchaInput from '@/components/ui/captcha-input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, AlertCircle, Upload, FileText } from 'lucide-react';

interface DocumentUploaderProps {
  onUploadStart: () => void;
  onUploadComplete: (documentId: number) => void;
}

export default function DocumentUploader({ onUploadStart, onUploadComplete }: DocumentUploaderProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload.',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    onUploadStart();

    try {
      // Create form data with the current token and answer (passed directly to avoid stale state)
      const currentToken = captchaToken;
      const currentAnswer = captchaAnswer;
      
      console.log("CAPTCHA data before upload:", { 
        token: currentToken ? `${currentToken.substring(0, 6)}...` : 'null', 
        answer: currentAnswer || 'null'
      });
      
      const formData = new FormData();
      formData.append('file', file);
      
      // Explicitly include CAPTCHA data as strings
      if (currentToken && currentAnswer) {
        formData.append('captchaToken', String(currentToken));
        formData.append('captchaAnswer', String(currentAnswer));
      }

      // Log form data entries for debugging
      console.log('Form data contains file:', formData.has('file'));
      console.log('Form data contains captchaToken:', formData.has('captchaToken'));
      console.log('Form data contains captchaAnswer:', formData.has('captchaAnswer'));
      
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();
      console.log("Upload response:", data);

      if (!response.ok) {
        // Check for CAPTCHA verification required error
        if (response.status === 400 && data.message && data.message.includes('CAPTCHA')) {
          // If CAPTCHA is required but not provided or invalid
          console.log("CAPTCHA required, showing dialog");
          setShowCaptcha(true);
          setIsUploading(false);
          
          // Don't signal completion yet since we need CAPTCHA
          return;
        }
        throw new Error(data.message || 'Upload failed');
      }

      // Reset states
      setFile(null);
      setShowCaptcha(false);
      setCaptchaToken(null);
      setCaptchaAnswer('');
      
      onUploadComplete(data.id);
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMessage = error.message || 'There was a problem uploading your document.';
      setUploadError(errorMessage);
      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive'
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Clear any previous errors
    setUploadError(null);
    
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      let errorMessage = 'File upload failed.';
      
      if (rejection.errors.some((e: any) => e.code === 'file-too-large')) {
        errorMessage = 'File is too large. Maximum size is 10MB.';
      } else if (rejection.errors.some((e: any) => e.code === 'file-invalid-type')) {
        errorMessage = 'Invalid file type. Please upload a PDF, DOC, or DOCX file.';
      }
      
      setUploadError(errorMessage);
      toast({
        title: 'File rejected',
        description: errorMessage,
        variant: 'destructive'
      });
      return;
    }
    
    if (acceptedFiles.length === 0) return;
    
    const selectedFile = acceptedFiles[0];
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    // Double-check file type
    if (!allowedTypes.includes(selectedFile.type)) {
      const errorMessage = 'Please upload a PDF, DOC, or DOCX file.';
      setUploadError(errorMessage);
      toast({
        title: 'Invalid file type',
        description: errorMessage,
        variant: 'destructive'
      });
      return;
    }

    // Check file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      const errorMessage = 'File is too large. Maximum size is 10MB.';
      setUploadError(errorMessage);
      toast({
        title: 'File too large',
        description: errorMessage,
        variant: 'destructive'
      });
      return;
    }

    setFile(selectedFile);
    setShowCaptcha(true);
  }, [toast]);

  const handleCaptchaValidated = (token: string, answer: string) => {
    console.log("CAPTCHA validated and verified with server, received:", { 
      token: token.substring(0, 6) + '...', 
      answer
    });
    
    // Close the CAPTCHA dialog
    setShowCaptcha(false);
    
    // Use the verified values directly for upload
    submitFileWithCaptcha(token, answer);
  };
  
  // Function to upload with verified CAPTCHA values
  const submitFileWithCaptcha = async (captchaToken: string, captchaAnswer: string) => {
    if (!file) {
      toast({
        title: 'Upload Error',
        description: 'No file selected for upload.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsUploading(true);
    onUploadStart();
    
    try {
      console.log("Starting document upload with verified CAPTCHA:", { 
        tokenPrefix: captchaToken.substring(0, 6) + '...', 
        answer: captchaAnswer 
      });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('captchaToken', captchaToken);
      formData.append('captchaAnswer', captchaAnswer);
      
      // Validate form data before upload
      if (!formData.has('file') || !formData.has('captchaToken') || !formData.has('captchaAnswer')) {
        throw new Error('Upload form data is incomplete');
      }
      
      console.log('Form data validation successful:', {
        fileSize: file.size,
        fileName: file.name,
        fileType: file.type,
        hasToken: formData.has('captchaToken'),
        hasAnswer: formData.has('captchaAnswer')
      });
      
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error("Upload failed with status:", response.status, response.statusText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Upload response:", data);
      
      if (!response.ok) {
        // Specific error handling based on response status
        if (response.status === 400) {
          if (data.message && data.message.includes('CAPTCHA')) {
            console.log("CAPTCHA verification failed, showing dialog again");
            setShowCaptcha(true);
            setIsUploading(false);
            return;
          } else if (data.message && data.message.includes('empty')) {
            throw new Error('The document appears to be empty or could not be processed');
          } else if (data.message && data.message.includes('tenancy agreement')) {
            throw new Error('The file does not appear to be a valid tenancy agreement');
          }
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. ' + (data.message || 'Please try again later.'));
        }
        
        throw new Error(data.message || 'Upload failed');
      }
      
      // Reset states on successful upload
      setFile(null);
      setCaptchaToken(null);
      setCaptchaAnswer('');
      
      toast({
        title: 'Upload Successful',
        description: 'Your document has been uploaded and analysis will begin automatically.',
        variant: 'default'
      });
      
      // Notify parent component that upload is complete
      // This will redirect to the processing page first
      onUploadComplete(data.id);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'There was a problem uploading your document.',
        variant: 'destructive'
      });
      setIsUploading(false);
    }
  };

  const handleCaptchaError = (errorMessage: string) => {
    toast({
      title: 'CAPTCHA Error',
      description: errorMessage,
      variant: 'destructive'
    });
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isUploading,
    onError: (error) => {
      console.error('Dropzone error:', error);
      setUploadError('An error occurred with file selection.');
    }
  });

  return (
    <>
      <div 
        {...getRootProps()} 
        className={`relative border-2 border-dashed rounded-xl p-8 md:p-10 mb-6 transition-all duration-300 cursor-pointer overflow-hidden ${
          isDragReject
            ? 'border-red-400 bg-red-50 scale-[1.02]'
            : isDragActive 
              ? 'border-[#EC7134] bg-slate-50 scale-[1.02] shadow-xl' 
              : uploadError
                ? 'border-red-300 bg-red-50/50'
                : file
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 hover:border-[#EC7134]/70 hover:shadow-lg hover:scale-[1.01] bg-white'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {/* Enhanced animated background elements */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${isDragActive ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#EC7134]/10 to-slate-100/30 animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <svg width="100%" height="100%" className="opacity-20">
              <defs>
                <pattern id="dotPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="3" cy="3" r="1.5" fill="#EC7134" className="animate-ping" style={{ animationDuration: '3s' }}/>
                </pattern>
              </defs>
              <rect x="0" y="0" width="100%" height="100%" fill="url(#dotPattern)" />
            </svg>
          </div>
        </div>
        
        {/* Corner elements that appear on drag */}
        <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#EC7134] transition-all duration-500 ${isDragActive ? 'opacity-100' : 'opacity-0'} rounded-tl-lg`}></div>
        <div className={`absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#EC7134] transition-all duration-500 ${isDragActive ? 'opacity-100' : 'opacity-0'} rounded-tr-lg`}></div>
        <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#EC7134] transition-all duration-500 ${isDragActive ? 'opacity-100' : 'opacity-0'} rounded-bl-lg`}></div>
        <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#EC7134] transition-all duration-500 ${isDragActive ? 'opacity-100' : 'opacity-0'} rounded-br-lg`}></div>
        
        <input {...getInputProps()} />
        <div className="flex flex-col items-center relative z-10">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-500 ${
            isDragReject
              ? 'bg-red-100 scale-110'
              : isDragActive 
                ? 'bg-[#EC7134]/20 scale-110 shadow-lg shadow-[#EC7134]/30' 
                : uploadError
                  ? 'bg-red-100'
                  : file
                    ? 'bg-green-100'
                    : 'bg-slate-50 hover:bg-slate-100'
          }`}>
            {uploadError ? (
              <AlertCircle className="w-8 h-8 text-red-500" />
            ) : file ? (
              <Check className="w-8 h-8 text-green-600" />
            ) : (
              <Upload 
                className={`w-8 h-8 text-[#EC7134] transition-all duration-300 ${
                  isDragReject
                    ? 'text-red-500'
                    : isDragActive 
                      ? 'scale-110 animate-bounce text-[#EC7134]' 
                      : 'text-[#EC7134]'
                }`} 
                style={{ animationDuration: '1s' }}
              />
            )}
          </div>
          
          <h4 className={`font-semibold text-lg transition-colors duration-300 mb-2 ${
            isDragReject
              ? 'text-red-600'
              : isDragActive 
                ? 'text-[#EC7134]' 
                : uploadError
                  ? 'text-red-600'
                  : file
                    ? 'text-green-600'
                    : 'text-gray-700'
          }`}>
            {isDragReject
              ? 'Invalid file type'
              : isDragActive 
                ? 'Drop your document here' 
                : uploadError
                  ? 'Upload failed'
                  : file
                    ? 'File ready to upload'
                    : 'Upload Your Tenancy Agreement'
            }
          </h4>
          
          <p className={`text-sm transition-colors duration-300 mb-4 ${
            isDragReject
              ? 'text-red-500'
              : isDragActive 
                ? 'text-[#EC7134]/80' 
                : uploadError
                  ? 'text-red-500'
                  : file
                    ? 'text-green-600'
                    : 'text-gray-500'
          }`}>
            {isDragReject
              ? 'Please upload a PDF, DOC, or DOCX file'
              : isDragActive 
                ? 'Release to upload' 
                : uploadError
                  ? uploadError
                  : file
                    ? `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`
                    : 'Drag & drop or click to browse files'
            }
          </p>
          
          {/* File format guidance with better visual hierarchy */}
          <div className="mb-6 bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-center space-x-4 text-xs mb-1">
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-600">PDF</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-600">DOC</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-600">DOCX</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center">Maximum file size: 10MB</p>
          </div>
          
          <Button 
            className={`px-8 py-3 font-medium transition-all duration-300 shadow-sm rounded-xl ${
              uploadError
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : file
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : isDragActive
                    ? 'bg-[#EC7134] hover:bg-[#E35F1E] text-white shadow-[#EC7134]/30 scale-105'
                    : 'bg-[#EC7134] hover:bg-[#E35F1E] text-white'
            }`}
            disabled={isUploading || isDragReject}
            loading={isUploading}
            loadingText="Uploading..."
            onClick={uploadError ? () => { setUploadError(null); setFile(null); } : file ? () => setShowCaptcha(true) : undefined}
          >
            {uploadError ? (
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4" />
                <span>Try Again</span>
              </div>
            ) : file ? (
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4" />
                <span>File Ready - Click to Continue</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Choose File</span>
              </div>
            )}
          </Button>
          
          {file && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800 font-medium">{file.name}</span>
                <span className="text-xs text-green-600">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CAPTCHA Dialog */}
      <Dialog open={showCaptcha} onOpenChange={(open) => {
        // Only allow closing the dialog if we're not in the middle of validating
        if (!isUploading) {
          setShowCaptcha(open);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Security Verification</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Please complete the CAPTCHA to continue with your document upload.
            </p>
          </DialogHeader>
          <div className="flex flex-col space-y-4">
            <CaptchaInput 
              onCaptchaValidated={handleCaptchaValidated}
              onCaptchaError={handleCaptchaError}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
