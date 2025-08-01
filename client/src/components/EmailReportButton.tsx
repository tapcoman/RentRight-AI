import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { sendAnalysisEmail } from '@/lib/api';
import { Loader2, Mail, AlertCircle, Check } from 'lucide-react';

// Email report button component
export default function EmailReportButton({ documentId }: { documentId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();
  
  const handleSendEmail = async () => {
    // Reset error state
    setSendError(null);
    
    // Basic email validation
    if (!email || !email.trim()) {
      setSendError('Please enter an email address.');
      return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
      setSendError('Please enter a valid email address.');
      return;
    }
    
    // More comprehensive email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setSendError('Please enter a valid email address.');
      return;
    }
    
    try {
      setIsSending(true);
      await sendAnalysisEmail(documentId, email.trim());
      
      setEmailSent(true);
      toast({
        title: 'Email Sent Successfully',
        description: `The analysis report has been sent to ${email.trim()}.`,
        variant: 'default'
      });
      
      // Reset form after successful send
      setTimeout(() => {
        setIsOpen(false);
        setEmail('');
        setEmailSent(false);
        setSendError(null);
      }, 2000);
      
    } catch (error: any) {
      const errorMessage = error.message || 'Could not send the report email. Please try again.';
      setSendError(errorMessage);
      toast({
        title: 'Email Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <>
      <Button 
        variant="outline" 
        className="w-full border-sky-500 text-sky-600 hover:bg-sky-50 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => {
          setIsOpen(true);
          // Reset states when opening
          setSendError(null);
          setEmailSent(false);
        }}
        disabled={isSending}
      >
        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        Email Report
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-sky-600" />
              Send Analysis Report via Email
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {emailSent ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-green-800 mb-2">Email Sent Successfully!</h3>
                <p className="text-sm text-green-700">
                  The analysis report has been sent to {email}
                </p>
              </div>
            ) : (
              <>
                {sendError && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">                                                             
                      {sendError}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      // Clear error when user types
                      if (sendError) setSendError(null);
                    }}
                    className={sendError ? 'border-red-300 focus:border-red-500' : ''}
                    disabled={isSending}
                  />
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    📧 We'll send a detailed HTML report of your lease analysis to this email address.
                  </p>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            {emailSent ? (
              <Button 
                onClick={() => {
                  setIsOpen(false);
                  setEmail('');
                  setEmailSent(false);
                  setSendError(null);
                }}
                className="w-full"
              >
                Close
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsOpen(false);
                    setSendError(null);
                  }}
                  disabled={isSending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendEmail} 
                  disabled={isSending || !email.trim()}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>Send Report</span>
                    </div>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}