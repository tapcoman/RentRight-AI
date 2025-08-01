import { apiRequest } from '@/lib/queryClient';

export interface UploadDocumentOptions {
  file: File;
  captchaToken?: string;
  captchaAnswer?: string;
}

export async function uploadDocument({ file, captchaToken, captchaAnswer }: UploadDocumentOptions): Promise<{ id: number }> {
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
      // If CAPTCHA verification is required
      if (response.status === 400 && data.message?.includes('CAPTCHA')) {
        throw new Error('CAPTCHA_REQUIRED');
      }
      throw new Error(data.message || 'Upload failed');
    }

    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to upload document');
  }
}

export async function analyzeDocument(documentId: number): Promise<void> {
  try {
    await apiRequest('POST', `/api/documents/${documentId}/analyze`, {});
  } catch (error: any) {
    throw new Error(error.message || 'Failed to analyze document');
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
  try {
    await apiRequest('POST', `/api/documents/${documentId}/email-report`, { email });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to send email report');
  }
}
