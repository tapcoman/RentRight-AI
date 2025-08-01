import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Share2 } from 'lucide-react';

interface ShareDocumentProps {
  documentId: number;
  isPaidAnalysis: boolean;
}

export default function ShareDocument({ documentId, isPaidAnalysis }: ShareDocumentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();
  
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  const handleShare = async () => {
    if (!validateEmail(email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSharing(true);
      
      const response = await apiRequest(
        'POST',
        `/api/documents/${documentId}/share`,
        { email }
      );
      
      const responseData = await response.json();
      if (responseData && responseData.success) {
        toast({
          title: 'Document Shared',
          description: `Analysis report has been sent to ${email}`,
          variant: 'default',
        });
        setIsOpen(false);
        setEmail('');
      } else {
        throw new Error(responseData.message || 'Failed to share document');
      }
    } catch (error: any) {
      console.error('Share error:', error);
      toast({
        title: 'Sharing Failed',
        description: error.message || 'There was a problem sharing the document',
        variant: 'destructive',
      });
    } finally {
      setIsSharing(false);
    }
  };
  
  if (!isPaidAnalysis) {
    return null; // Only show for paid analyses
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Share Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Analysis Report</DialogTitle>
          <DialogDescription>
            Enter an email address to send the analysis report securely. The recipient will get a link that expires in 24 hours.
          </DialogDescription>
        </DialogHeader>
        <div className="my-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                placeholder="recipient@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSharing}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSharing}>
            Cancel
          </Button>
          <Button onClick={handleShare} disabled={isSharing || !email}>
            {isSharing ? 'Sending...' : 'Share'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}