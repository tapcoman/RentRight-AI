import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface CaptchaInputProps {
  onCaptchaValidated: (token: string, answer: string) => void;
  onCaptchaError: (error: string) => void;
}

export default function CaptchaInput({ onCaptchaValidated, onCaptchaError }: CaptchaInputProps) {
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch a new CAPTCHA when the component mounts
  useEffect(() => {
    fetchNewCaptcha();
  }, []);

  const fetchNewCaptcha = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/captcha/generate');
      
      if (!response.ok) {
        throw new Error('Failed to fetch CAPTCHA');
      }
      
      const data = await response.json();
      setCaptchaImage(data.image);
      setCaptchaToken(data.token);
    } catch (error) {
      onCaptchaError('Failed to load CAPTCHA. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!captchaToken || !captchaAnswer) {
      onCaptchaError('Please enter the CAPTCHA text.');
      return;
    }
    
    console.log('CAPTCHA Input Submitting:', { 
      token: captchaToken.substring(0, 6) + '...', 
      answer: captchaAnswer 
    });
    
    // Prevent the dialog from closing prematurely
    setIsLoading(true);
    
    try {
      // Directly verify with the server first to ensure CAPTCHA is valid
      const response = await fetch('/api/captcha/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: captchaToken,
          answer: captchaAnswer
        })
      });
      
      const result = await response.json();
      console.log('CAPTCHA verification response:', result);
      
      if (!response.ok || !result.success) {
        onCaptchaError(result.message || 'Invalid CAPTCHA response. Please try again.');
        // Get a new CAPTCHA since this one is now invalid
        handleRefresh();
        setIsLoading(false);
        return;
      }
      
      // Create a copy of the values to ensure we pass the current values
      const tokenToPass = String(captchaToken);
      const answerToPass = String(captchaAnswer);
      
      // Pass the token and answer to the parent component
      console.log('CAPTCHA Input Validated, passing to parent:', { 
        token: tokenToPass.substring(0, 6) + '...', 
        answer: answerToPass 
      });
      onCaptchaValidated(tokenToPass, answerToPass);
    } catch (error) {
      console.error('CAPTCHA verification error:', error);
      onCaptchaError('Error verifying CAPTCHA. Please try again.');
      handleRefresh();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setCaptchaAnswer('');
    fetchNewCaptcha();
  };

  return (
    <div className="p-4 border rounded-md bg-white shadow-sm">
      <Label htmlFor="captcha">Please enter the characters you see below:</Label>
      <div className="flex flex-col space-y-4 mt-2">
        <div className="relative">
          {isLoading ? (
            <div className="w-full h-[70px] bg-gray-100 rounded flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            captchaImage && (
              <div 
                className="w-full bg-white border rounded" 
                dangerouslySetInnerHTML={{ __html: captchaImage }} 
              />
            )
          )}
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            className="absolute top-0 right-0 text-xs p-1" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </Button>
        </div>
        
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            <Input
              id="captcha"
              type="text"
              placeholder="Enter characters"
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              className="flex-1"
              autoComplete="off"
            />
            <Button 
              type="button" 
              onClick={handleSubmit} 
              disabled={isLoading || !captchaAnswer}
              className="bg-[#2C5282] hover:bg-[#2C5282]/90"
            >
              Verify
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            This helps us prevent automated uploads.
          </p>
        </div>
      </div>
    </div>
  );
}