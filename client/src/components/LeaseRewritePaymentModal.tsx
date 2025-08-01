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
      <DialogContent className="sm:max-w-lg max-w-[95vw] bg-white rounded-2xl shadow-xl border-0 max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="bg-brand-gradient -mx-6 -mt-6 px-6 py-6 rounded-t-2xl mb-6 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5 bg-[size:20px_20px] opacity-30" style={{backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)'}}></div>
            <div className="relative z-10 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <path d="M14 2v6h6"/>
                  <path d="M16 13H8"/>
                  <path d="M16 17H8"/>
                  <path d="M10 9H8"/>
                </svg>
              </div>
              <DialogTitle className="text-xl text-white font-semibold mb-2">
                Add Lease Rewrite
              </DialogTitle>
              <DialogDescription className="text-white/90 text-sm">
                <span className="block font-semibold text-lg mb-1">{price}</span>
                <span>Generate a tenant-friendly version of your lease</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="px-6 pb-6">
          {/* What you'll get section */}
          <div className="bg-subtle-gradient rounded-xl p-5 mb-6 border border-[#F3D5C0] shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-4 text-base flex items-center">
              <svg className="w-5 h-5 text-[#EC7134] mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
              What You'll Get:
            </h4>
            <div className="grid gap-4">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-[#EC7134]/10 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <svg className="w-4 h-4 text-[#EC7134]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm text-gray-700 leading-relaxed">Complete rewritten tenancy agreement with all essential terms</span>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-[#EC7134]/10 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <svg className="w-4 h-4 text-[#EC7134]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm text-gray-700 leading-relaxed">Clearer, fairer terms with stronger tenant protections</span>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-[#EC7134]/10 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <svg className="w-4 h-4 text-[#EC7134]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm text-gray-700 leading-relaxed">Downloadable in Word or PDF format</span>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-[#EC7134]/10 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <svg className="w-4 h-4 text-[#EC7134]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm text-gray-700 leading-relaxed">Ready to propose to your landlord as an alternative</span>
              </div>
            </div>
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
                  <div className="payment-section rounded-xl p-5 shadow-sm">
                    <Label htmlFor="lease-rewrite-email" className="text-sm font-semibold text-gray-800 mb-2 block">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-gray-600 mb-3">
                      We'll send your lease rewrite and receipt to this email
                    </p>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <Input 
                        id="lease-rewrite-email"
                        type="email" 
                        value={paymentEmail} 
                        onChange={(e) => setPaymentEmail(e.target.value)} 
                        onBlur={validatePaymentEmail}
                        placeholder="your.email@example.com"
                        className={`pl-12 h-11 ${paymentEmailError ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-[#EC7134] focus:ring-[#EC7134]/20'} rounded-lg transition-all duration-200`}
                      />
                      {paymentEmailError && (
                        <div className="flex items-center mt-2 text-red-600">
                          <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                          </svg>
                          <p className="text-xs">{paymentEmailError}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 mt-8">
                    <Button 
                      variant="outline" 
                      onClick={onClose} 
                      className="flex-1 h-12 font-medium"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      className="flex-1 h-12 font-semibold"
                      size="lg"
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
          
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-center text-xs text-gray-500">
              <svg className="w-4 h-4 mr-2 text-[#EC7134]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>Secure payment powered by Stripe</span>
            </div>
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
    <div className="animate-fade-in-up">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="payment-section rounded-xl p-5 shadow-sm">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-800 mb-1">Payment Information</h4>
            <p className="text-xs text-gray-600">Your payment is secured with 256-bit SSL encryption</p>
          </div>
          <PaymentElement 
            options={{
              layout: 'tabs'
            }}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 h-12 font-medium"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!stripe || isProcessing}
            loading={isProcessing}
            loadingText="Processing..."
            className="flex-1 h-12 font-semibold"
            size="lg"
          >
            {!isProcessing && (
              <>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
                Pay {price}
              </>
            )}
          </Button>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-center text-xs text-gray-500">
            <svg className="w-4 h-4 mr-2 text-[#EC7134]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>Secure payment powered by Stripe</span>
          </div>
        </div>
      </form>
    </div>
  );
};