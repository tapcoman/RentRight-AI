import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from '@/lib/queryClient';

// Initialize Stripe
let stripePromise: Promise<any> | null = null;

/**
 * Get a reference to the Stripe object
 */
export const getStripe = () => {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    if (!key) {
      throw new Error('Missing Stripe public key. Make sure VITE_STRIPE_PUBLIC_KEY is set in your environment.');
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

/**
 * Create a payment intent for the document analysis
 */
export const createPaymentIntent = async (
  documentId: number, 
  serviceType: 'analysis' | 'combined'
) => {
  try {
    const response = await apiRequest('POST', '/api/create-payment-intent', {
      documentId,
      serviceType
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

/**
 * Redirect to Stripe Checkout for payment
 */
export const redirectToCheckout = async (
  documentId: number,
  serviceType: 'analysis' | 'combined'
) => {
  try {
    // Create the URL for the checkout page
    const url = new URL(window.location.href);
    const stripeReturnUrl = url.toString();
    
    // Navigate to the Stripe checkout
    window.location.href = `/api/checkout?documentId=${documentId}&serviceType=${serviceType}&returnUrl=${encodeURIComponent(stripeReturnUrl)}`;
  } catch (error) {
    console.error('Error redirecting to checkout:', error);
    throw error;
  }
};