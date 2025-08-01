import { apiRequest } from '@/lib/queryClient';

// Enhanced error handling for API calls
class APIError extends Error {
  public status: number;
  public code?: string;
  
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
  }
}

// Utility function to handle API errors consistently
function handleAPIError(error: any, defaultMessage: string): never {
  console.error('API Error:', error);
  
  if (error instanceof APIError) {
    throw error;
  }
  
  // Network errors
  if (!navigator.onLine) {
    throw new APIError('Please check your internet connection and try again.', 0, 'NETWORK_ERROR');
  }
  
  // Parse error response
  if (error.response) {
    const status = error.response.status;
    let message = defaultMessage;
    
    try {
      const errorData = error.response.data || {};
      message = errorData.message || errorData.error || message;
    } catch (e) {
      // Use default message if parsing fails
    }
    
    throw new APIError(message, status);
  }
  
  throw new APIError(error.message || defaultMessage, 500);
}

export interface UploadDocumentOptions {
  file: File;
  captchaToken?: string;
  captchaAnswer?: string;
}

export async function uploadDocument({ file, captchaToken, captchaAnswer }: UploadDocumentOptions): Promise<{ id: number }> {
  if (!file) {
    throw new APIError('No file provided for upload.', 400, 'MISSING_FILE');
  }
  
  // Validate file size (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new APIError('File is too large. Maximum size is 10MB.', 400, 'FILE_TOO_LARGE');
  }
  
  // Validate file type
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowedTypes.includes(file.type)) {
    throw new APIError('Invalid file type. Please upload a PDF, DOC, or DOCX file.', 400, 'INVALID_FILE_TYPE');
  }
  
  const formData = new FormData();
  formData.append('file', file);
  
  // Add CAPTCHA verification if provided
  if (captchaToken && captchaAnswer) {
    formData.append('captchaToken', captchaToken);
    formData.append('captchaAnswer', captchaAnswer);
  }

  try {
    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 400 && data.message?.includes('CAPTCHA')) {
        throw new APIError('CAPTCHA verification required.', 400, 'CAPTCHA_REQUIRED');
      }
      
      if (response.status === 413) {
        throw new APIError('File is too large. Please upload a smaller file.', 413, 'FILE_TOO_LARGE');
      }
      
      if (response.status === 429) {
        throw new APIError('Too many requests. Please wait a moment before trying again.', 429, 'RATE_LIMITED');
      }
      
      throw new APIError(data.message || 'Upload failed', response.status);
    }

    return data;
  } catch (error: any) {
    if (error instanceof APIError) {
      throw error;
    }
    handleAPIError(error, 'Failed to upload document');
  }
}

export async function analyzeDocument(documentId: number): Promise<void> {
  if (!documentId || documentId <= 0) {
    throw new APIError('Invalid document ID provided.', 400, 'INVALID_DOCUMENT_ID');
  }
  
  try {
    await apiRequest('POST', `/api/documents/${documentId}/analyze`, {});
  } catch (error: any) {
    handleAPIError(error, 'Failed to analyze document');
  }
}

export async function generateReport(documentId: number): Promise<void> {
  // This function now just redirects to the report view page instead of generating a PDF
  window.open(`/analysis/${documentId}/report`, '_blank');
}

export type RewriteFormat = 'pdf' | 'docx';

export async function generateLeaseRewrite(
  documentId: number, 
  paymentIntentId?: string, 
  serviceType?: string,
  format: RewriteFormat = 'docx'
): Promise<Blob> {
  try {
    const response = await apiRequest('POST', `/api/documents/${documentId}/generate-rewrite`, { 
      paymentIntentId,
      serviceType, // Include service type in the request to aid debugging
      format // Specify the format (PDF or DOCX)
    });
    return await response.blob();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to generate lease rewrite');
  }
}

export async function sendAnalysisEmail(documentId: number, email: string): Promise<void> {
  if (!documentId || documentId <= 0) {
    throw new APIError('Invalid document ID provided.', 400, 'INVALID_DOCUMENT_ID');
  }
  
  if (!email || !email.trim()) {
    throw new APIError('Email address is required.', 400, 'MISSING_EMAIL');
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    throw new APIError('Please provide a valid email address.', 400, 'INVALID_EMAIL');
  }
  
  try {
    await apiRequest('POST', `/api/documents/${documentId}/email-report`, { email: email.trim() });
  } catch (error: any) {
    handleAPIError(error, 'Failed to send email report');
  }
}
