import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { sendAnalysisEmail } from '@/lib/api';

// Email report button component
export default function EmailReportButton({ documentId }: { documentId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  
  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSending(true);
      await sendAnalysisEmail(documentId, email);
      toast({
        title: 'Email Sent',
        description: 'The analysis report has been sent to your email.',
      });
      setIsOpen(false);
      setEmail('');
    } catch (error: any) {
      toast({
        title: 'Email Failed',
        description: error.message || 'Could not send the report email. Please try again.',
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
        className="w-full border-sky-500 text-sky-600 hover:bg-sky-50 text-xs sm:text-sm"
        onClick={() => setIsOpen(true)}
      >
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="22,6 12,13 2,6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Email Report
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Analysis Report via Email</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                We'll send a detailed HTML report of your lease analysis to this email address.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSendEmail} disabled={isSending}>
              {isSending ? 'Sending...' : 'Send Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}