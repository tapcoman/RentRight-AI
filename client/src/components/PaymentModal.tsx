import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { z } from 'zod';

// Initialize Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

type ServiceType = 'analysis' | 'combined';

interface CheckoutFormProps {
  onSuccess: (paymentIntentId: string, serviceType: string, email: string) => void;
  onCancel: () => void;
  serviceType: ServiceType;
  price: string;
}

const emailSchema = z.string().email("Please enter a valid email address");

const CheckoutForm = ({ onSuccess, onCancel, serviceType, price }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Debug logging for email state
  useEffect(() => {
    console.log(`CheckoutForm email state: ${email || 'empty'}`);
  }, [email]);

  const validateEmail = (): boolean => {
    try {
      emailSchema.parse(email);
      setEmailError(null);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setEmailError(error.errors[0].message);
      } else {
        setEmailError("Please enter a valid email address");
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    // Validate email first
    if (!validateEmail()) {
      return;
    }

    setIsProcessing(true);

    try {
      // Add service type to return URL so it's preserved after Stripe redirect
      const returnUrl = new URL(window.location.href);
      returnUrl.searchParams.append('service_type', serviceType);
      returnUrl.searchParams.append('email', email);
      
      // Log for debugging
      console.log('Starting payment confirmation with options:', {
        elements: !!elements,
        returnUrl: returnUrl.toString()
      });
      
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Redirect to the current page with service_type parameter and email
          return_url: returnUrl.toString(),
          payment_method_data: {
            billing_details: {
              email: email,
            },
          },
        },
        redirect: 'if_required',
      });

      // Log the result
      console.log('Payment confirmation result:', { error, paymentIntent });

      if (error) {
        console.error('Payment error:', error);
        toast({
          title: "Payment Failed",
          description: error.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      } else if (paymentIntent) {
        console.log('Payment intent status:', paymentIntent.status);
        
        if (paymentIntent.status === 'succeeded') {
          // Payment successful
          toast({
            title: "Payment Successful",
            description: "Thank you for your purchase. Your premium analysis is being generated.",
          });
          onSuccess(paymentIntent.id, serviceType, email);
        } else if (paymentIntent.status === 'requires_action') {
          // Handle 3D Secure or other additional actions
          console.log('Payment requires additional authentication');
          const { error: confirmError } = await stripe.confirmPayment({
            elements,
            confirmParams: {
              return_url: returnUrl.toString(),
            },
          });
          
          if (confirmError) {
            toast({
              title: "Authentication Failed",
              description: confirmError.message || "Payment requires additional verification.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Payment Pending",
            description: `Payment is being processed (status: ${paymentIntent.status}).`,
            variant: "default",
          });
        }
      } else {
        toast({
          title: "Payment Issue",
          description: "The payment couldn't be completed. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error('Payment submission error:', err);
      toast({
        title: "Payment Error",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 mb-6">
          <div className="payment-section rounded-xl p-5 shadow-sm">
            <Label htmlFor="email" className="text-sm font-semibold text-gray-800 mb-2 block">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-gray-600 mb-3">
              We'll send your analysis report and receipt to this email
            </p>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <Input 
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`pl-12 h-11 ${emailError ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-gray-200 focus:border-[#EC7134] focus:ring-[#EC7134]/20"} rounded-lg transition-all duration-200`}
                required
              />
            </div>
            {emailError && (
              <div className="flex items-center mt-2 text-red-600">
                <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <p className="text-xs">{emailError}</p>
              </div>
            )}
          </div>
        </div>
        
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

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentIntentId: string, serviceType: string, email?: string) => void;
  documentId: number;
}

export default function PaymentModal({ isOpen, onClose, onSuccess, documentId }: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType>('analysis');
  const { toast } = useToast();

  // Get price based on service type
  const getPrice = (type: ServiceType): string => {
    switch(type) {
      case 'analysis':
        return '£29.00';
      case 'combined':
        return '£48.00';
      default:
        return '£29.00';
    }
  };

  // State for email during payment intent creation
  const [paymentEmail, setPaymentEmail] = useState<string>('');
  const [paymentEmailError, setPaymentEmailError] = useState<string | null>(null);
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState<boolean>(false);
  
  // Create payment intent when service type changes or modal opens
  useEffect(() => {
    if (isOpen && documentId) {
      setIsCreatingPaymentIntent(false);
      setClientSecret(null);
    }
  }, [isOpen, documentId]);
  
  // Function to validate email using the same schema
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
        serviceType: serviceType,
        customerEmail: email
      });
      const data = await response.json();
      setClientSecret(data.clientSecret);
      setPaymentEmail(email);
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

  const handleSuccess = (paymentIntentId: string, serviceType: string, email: string) => {
    // Extra validation for email before passing it on
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      console.error(`Invalid email format in payment success handler: "${email}"`);
      toast({
        title: "Email Format Issue",
        description: "There was an issue with your email format. You may not receive an email report.",
        variant: "destructive"
      });
      // Still proceed with the success handler but with a warning
    }
    
    // Log payment success details for debugging
    console.log(`Payment success handler called with:
      - Email: ${email}
      - Payment Intent ID: ${paymentIntentId}
      - Service Type: ${serviceType}
    `);
    
    // Pass all parameters to the parent component's success handler
    onSuccess(paymentIntentId, serviceType, email);
    
    // Show a toast notification about email
    toast({
      title: "Payment Successful",
      description: `We'll send your analysis report and receipt to: ${email}`,
      className: "bg-green-50 border-green-200 text-green-800",
    });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-w-[95vw] bg-white rounded-2xl shadow-xl border-0 max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="bg-brand-gradient -mx-6 -mt-6 px-6 py-6 rounded-t-2xl mb-6 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5 bg-[size:20px_20px] opacity-30" style={{backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)'}}></div>
            <div className="relative z-10">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                </div>
                <DialogTitle className="text-xl text-white font-semibold">Premium Legal Analysis</DialogTitle>
              </div>
              <DialogDescription className="text-white/90 text-sm leading-relaxed">
                Get comprehensive legal insights to protect your rights as a tenant and avoid costly disputes with landlords.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          <div className="bg-subtle-gradient rounded-xl p-5 mb-6 border border-[#F3D5C0] shadow-sm">
            <h4 className="font-medium text-[#E35F1E] text-sm mb-2">Premium Services:</h4>
            <RadioGroup value={serviceType} onValueChange={(value) => setServiceType(value as ServiceType)} className="mt-4 space-y-4">
              <div className={`card-hover relative flex items-start space-x-3 p-5 rounded-xl transition-all duration-300 cursor-pointer ${
                serviceType === 'analysis' 
                  ? 'bg-white border-2 border-[#EC7134] shadow-lg ring-2 ring-[#EC7134]/10' 
                  : 'bg-white border border-gray-200 hover:border-[#EC7134]/30 hover:shadow-md'
              }`}>
                {serviceType === 'analysis' && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[#EC7134] to-[#E35F1E] text-white text-xs px-3 py-1 rounded-full shadow-md font-medium">
                    Most Popular
                  </div>
                )}
                <RadioGroupItem value="analysis" id="analysis" className="mt-1.5" />
                <div className="grid gap-3 w-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <Label htmlFor="analysis" className="font-semibold text-gray-900 text-base cursor-pointer">Premium Analysis</Label>
                      <div className="flex items-center mt-1">
                        <span className="font-bold text-[#EC7134] text-xl">£29.00</span>
                        <span className="text-xs text-gray-500 ml-2 bg-gray-100 px-2 py-1 rounded-full">One-time</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Complete legal analysis of your tenancy agreement with tenant protection assessment and downloadable report.
                  </p>
                </div>
              </div>
              
              <div className={`card-hover relative flex items-start space-x-3 p-5 rounded-xl transition-all duration-300 cursor-pointer ${
                serviceType === 'combined' 
                  ? 'bg-white border-2 border-[#EC7134] shadow-lg ring-2 ring-[#EC7134]/10' 
                  : 'bg-white border border-gray-200 hover:border-[#EC7134]/30 hover:shadow-md'
              }`}>
                {serviceType === 'combined' && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs px-3 py-1 rounded-full shadow-md font-medium">
                    Best Value
                  </div>
                )}
                <RadioGroupItem value="combined" id="combined" className="mt-1.5" />
                <div className="grid gap-3 w-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <Label htmlFor="combined" className="font-semibold text-gray-900 text-base cursor-pointer">Analysis + Lease Rewrite</Label>
                      <div className="flex items-center mt-1">
                        <span className="font-bold text-[#EC7134] text-xl">£48.00</span>
                        <span className="text-xs text-green-600 ml-2 bg-green-50 px-2 py-1 rounded-full font-medium">Save £19</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Full premium analysis plus a professionally rewritten tenancy agreement that protects your interests.
                  </p>
                </div>
              </div>
            </RadioGroup>
            
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h5 className="font-semibold text-sm text-gray-800 mb-3 flex items-center">
                <svg className="w-4 h-4 text-[#EC7134] mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
                What's Included:
              </h5>
              <div className="grid gap-3">
                {/* All services include these items */}
                <div className="flex items-start">
                  <div className="w-5 h-5 bg-[#EC7134]/10 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <svg className="w-3 h-3 text-[#EC7134]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Full legal analysis with compliance checks</span>
                </div>
                <div className="flex items-start">
                  <div className="w-5 h-5 bg-[#EC7134]/10 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <svg className="w-3 h-3 text-[#EC7134]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Unfair terms highlighted with explanation</span>
                </div>
                <div className="flex items-start">
                  <div className="w-5 h-5 bg-[#EC7134]/10 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <svg className="w-3 h-3 text-[#EC7134]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Downloadable PDF report with legal references</span>
                </div>
                
                {/* Only combined service includes the rewrite */}
                {serviceType === 'combined' && (
                  <>
                    <div className="flex items-start">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                        <svg className="w-3 h-3 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700 font-medium">Tenant-friendly lease rewrite in clear language</span>
                    </div>
                    <div className="flex items-start">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                        <svg className="w-3 h-3 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700 font-medium">Simplified legal terms and better formatting</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
            
          <div className="mb-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-base font-semibold text-gray-900 mb-1">
                  {serviceType === 'analysis' 
                    ? 'Premium Analysis' 
                    : 'Analysis + Lease Rewrite'}
                </div>
                <div className="text-xs text-gray-600 flex items-center">
                  <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  One-time payment, no recurring fees
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="font-bold text-[#EC7134] text-2xl">{getPrice(serviceType)}</div>
                <div className="text-xs text-green-600 flex items-center font-medium">
                  <svg className="w-3 h-3 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  {serviceType === 'analysis' ? 'Satisfaction guaranteed' : 'Save £19 with bundle'}
                </div>
              </div>
            </div>
          </div>

          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm 
                onSuccess={handleSuccess} 
                onCancel={onClose} 
                serviceType={serviceType}
                price={getPrice(serviceType)}
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
                  <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                    <Label htmlFor="init-email" className="text-sm font-medium text-gray-700 mb-1 block">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-gray-500 mb-2">
                      We'll send your analysis report and receipt to this email
                    </p>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <Input 
                        id="init-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={paymentEmail}
                        onChange={(e) => {
                          setPaymentEmail(e.target.value);
                          // Clear error when user types
                          if (paymentEmailError) setPaymentEmailError(null);
                        }}
                        className={`pl-10 ${paymentEmailError ? "border-red-500 focus:ring-red-500" : "border-orange-100 focus:border-orange-300 focus:ring-orange-200"}`}
                        required
                      />
                    </div>
                    {paymentEmailError && (
                      <p className="text-xs text-red-500 mt-1">{paymentEmailError}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <Button 
                      type="button" 
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