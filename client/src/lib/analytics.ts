// Google Analytics Integration
interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

// Define window.dataLayer
declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: any;
  }
}

/**
 * Initialize Google Analytics based on user consent
 * @param cookiePreferences - The user's cookie preferences
 */
export function initializeAnalytics(cookiePreferences: CookiePreferences): void {
  const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
  
  // Only initialize if analytics cookies are accepted and measurement ID is available
  if (cookiePreferences.analytics && GA_MEASUREMENT_ID) {
    // Create the script tag
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.async = true;
    document.head.appendChild(script);
    
    // Initialize dataLayer and gtag function
    window.dataLayer = window.dataLayer || [];
    
    // Standard gtag() function definition
    window.gtag = function() {
      if (window.dataLayer) {
        window.dataLayer.push(arguments);
      }
    };
    
    // Initialize gtag with configuration
    if (window.gtag) {
      window.gtag('js', new Date());
      window.gtag('config', GA_MEASUREMENT_ID, {
        'cookie_domain': 'rentrightai.co.uk',
        'cookie_flags': 'max-age=7200;secure;samesite=none',
        'allow_google_signals': true,
        'allow_ad_personalization_signals': false
      });
    }
    
    console.log('Google Analytics initialized for rentrightai.co.uk');
  } else if (!GA_MEASUREMENT_ID) {
    console.log('Google Analytics Measurement ID not found. Analytics not initialized.');
  } else {
    console.log('Analytics disabled by user preferences');
  }
}

/**
 * Track a page view in Google Analytics
 * @param path - The page path to track
 * @param title - The page title
 */
export function trackPageView(path: string, title?: string): void {
  if (window.gtag && import.meta.env.VITE_GA_MEASUREMENT_ID) {
    window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
      page_path: path,
      page_title: title
    });
  }
}

/**
 * Track a custom event in Google Analytics
 * @param eventName - The name of the event to track
 * @param eventParams - Additional parameters for the event
 */
export function trackEvent(eventName: string, eventParams: Record<string, any> = {}): void {
  if (window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
}

/**
 * Remove Google Analytics tracking (when user revokes consent)
 */
export function removeAnalytics(): void {
  // Remove the script
  const scripts = document.querySelectorAll(`script[src*="googletagmanager.com/gtag/js"]`);
  scripts.forEach(script => script.remove());
  
  // Clear cookies for both current hostname and the custom domain
  document.cookie = '_ga=; Max-Age=0; path=/; domain=' + location.hostname;
  document.cookie = '_ga_' + import.meta.env.VITE_GA_MEASUREMENT_ID?.replace(/^G-/, '') + '=; Max-Age=0; path=/; domain=' + location.hostname;
  
  // Also clear for the custom domain
  document.cookie = '_ga=; Max-Age=0; path=/; domain=rentrightai.co.uk';
  document.cookie = '_ga_' + import.meta.env.VITE_GA_MEASUREMENT_ID?.replace(/^G-/, '') + '=; Max-Age=0; path=/; domain=rentrightai.co.uk';
  
  // Reset window objects by setting to undefined
  window.gtag = undefined;
  window.dataLayer = undefined;
  
  console.log('Google Analytics removed');
}