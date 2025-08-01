import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { loadStripe, PaymentIntent } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { z } from 'zod';

// Initialize Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Service type is just 'rewrite' for this component
const SERVICE_TYPE = 'rewrite';

// Email validation schema
const emailSchema = z.string().email({ message: "Please enter a valid email address" });

interface LeaseRewritePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentIntentId: string, serviceType: string, email?: string) => void;
  documentId: number;
}

export default function LeaseRewritePaymentModal({ isOpen, onClose, onSuccess, documentId }: LeaseRewritePaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();

  // Fixed price for lease rewrite
  const price = '£19.00';

  // State for email during payment intent creation
  const [paymentEmail, setPaymentEmail] = useState<string>('');
  const [paymentEmailError, setPaymentEmailError] = useState<string | null>(null);
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState<boolean>(false);
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && documentId) {
      setIsCreatingPaymentIntent(false);
      setClientSecret(null);
    }
  }, [isOpen, documentId]);
  
  // Function to validate email using the schema
  const validatePaymentEmail = (): boolean => {
    try {
      emailSchema.parse(paymentEmail);
      setPaymentEmailError(null);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setPaymentEmailError(error.errors[0].message);
      } else {
        setPaymentEmailError("Please enter a valid email address");
      }
      return false;
    }
  };
  
  // Function to create payment intent with email
  const createPaymentIntent = async (email: string) => {
    // Validate email before sending request
    if (!validatePaymentEmail()) {
      return;
    }
    
    if (!documentId) return;
    
    setIsCreatingPaymentIntent(true);
    try {
      const response = await apiRequest('POST', '/api/create-payment-intent', { 
        documentId,
        serviceType: SERVICE_TYPE,
        customerEmail: email
      });
      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error: any) {
      toast({
        title: "Payment Setup Failed",
        description: error.message || "Could not initialize payment.",
        variant: "destructive",
      });
      onClose();
    } finally {
      setIsCreatingPaymentIntent(false);
    }
  };
  
  // Handle payment success
  const handleSuccess = (paymentIntentId: string, email?: string) => {
    onSuccess(paymentIntentId, SERVICE_TYPE, email);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center mb-1 text-[#333]">
            Add Lease Rewrite
          </DialogTitle>
          <DialogDescription className="text-center">
            <span className="block font-medium text-[#EC7134] text-lg mb-1">{price}</span>
            <span className="text-gray-600">Generate a tenant-friendly version of your lease</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-2">
          {/* What you'll get section */}
          <div className="bg-[#FFFAF5] rounded-lg p-4 mb-4 border border-[#F3D5C0]">
            <h4 className="font-semibold text-[#D55D20] mb-2">What You'll Get:</h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-[#EC7134] mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Complete rewritten tenancy agreement with all essential terms</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-[#EC7134] mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Clearer, fairer terms with stronger tenant protections</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-[#EC7134] mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Downloadable in Word or PDF format</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-[#EC7134] mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Ready to propose to your landlord as an alternative</span>
              </li>
            </ul>
          </div>

          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm 
                onSuccess={handleSuccess} 
                onCancel={onClose} 
                price={price}
              />
            </Elements>
          ) : (
            <div className="space-y-4">
              {isCreatingPaymentIntent ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-3 border-[#EC7134] border-t-transparent rounded-full mb-3"></div>
                  <p className="text-sm text-gray-600">Setting up secure payment...</p>
                </div>
              ) : (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    createPaymentIntent(paymentEmail);
                  }}
                  className="space-y-4"
                >
                  <div className="bg-white rounded-lg p-4 border border-[#F3EEE4] shadow-sm">
                    <Label htmlFor="lease-rewrite-email" className="text-sm font-medium text-gray-700 mb-1 block">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-gray-500 mb-2">
                      We'll send your lease rewrite and receipt to this email
                    </p>
                    <div className="relative">
                      <Input 
                        id="lease-rewrite-email"
                        type="email" 
                        value={paymentEmail} 
                        onChange={(e) => setPaymentEmail(e.target.value)} 
                        onBlur={validatePaymentEmail}
                        placeholder="your@email.com"
                        className={`w-full ${paymentEmailError ? 'border-red-300 focus:border-red-500' : ''}`}
                      />
                      {paymentEmailError && (
                        <p className="text-red-500 text-xs mt-1">{paymentEmailError}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={onClose} 
                      className="w-1/2 border-gray-300 hover:bg-gray-50 rounded-lg transition-all duration-200"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      className="w-1/2 bg-gradient-to-r from-[#EC7134] to-[#E35F1E] hover:from-[#E35F1E] hover:to-[#D55D20] text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Continue to Payment
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
          
          <div className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-500">
            <p className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2 text-[#EC7134]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Secure payment processed by Stripe
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Form for entering payment details
const CheckoutForm = ({ 
  onSuccess, 
  onCancel,
  price
}: { 
  onSuccess: (paymentIntentId: string, email?: string) => void;
  onCancel: () => void;
  price: string;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Complete payment when the submit button is clicked
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required"
      });
      
      console.log("Payment confirmation result:", result);
      
      if (result.error) {
        // Show error to your customer
        toast({
          title: "Payment Failed",
          description: result.error.message || "Your payment was not successful. Please try again.",
          variant: "destructive",
        });
      } else if (result.paymentIntent && result.paymentIntent.status === "succeeded") {
        console.log("Payment intent status:", result.paymentIntent.status);
        // The payment has been processed!
        toast({
          title: "Payment Successful",
          description: "Your payment was successful. Processing your lease rewrite...",
        });
        
        // Pass the paymentIntent ID to the parent component for API verification
        onSuccess(result.paymentIntent.id, result.paymentIntent.receipt_email || undefined);
      } else {
        // Unexpected result, potentially already confirmed
        if (result.paymentIntent) {
          onSuccess(result.paymentIntent.id, result.paymentIntent.receipt_email || undefined);
        } else {
          toast({
            title: "Payment Status Unknown",
            description: "We couldn't confirm your payment status. Please check your email for confirmation.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast({
        title: "Payment Error",
        description: error.message || "There was an error processing your payment.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white p-4 rounded-lg border border-[#F3EEE4] shadow-sm">
        <PaymentElement />
      </div>
      
      <div className="grid grid-cols-2 gap-3 mt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isProcessing}
          className="border-gray-300 hover:bg-gray-50 rounded-lg transition-all duration-200"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!stripe || isProcessing} 
          className="bg-gradient-to-r from-[#EC7134] to-[#E35F1E] hover:from-[#E35F1E] hover:to-[#D55D20] text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
        >
          {isProcessing ? (
            <div className="flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Processing...
            </div>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-9.618 5.04L3 8a9 9 0 009 9 9 9 0 009-9l-.382-.014z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Pay {price}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};