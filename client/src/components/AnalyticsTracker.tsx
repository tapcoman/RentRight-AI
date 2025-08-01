import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { trackPageView } from '@/lib/analytics';

/**
 * Component that tracks page views in Google Analytics
 * This should be placed in the App.tsx file to track all route changes
 */
const AnalyticsTracker = () => {
  const [location] = useLocation();
  const prevLocationRef = useRef<string | null>(null);

  useEffect(() => {
    // Only track if the location has changed to avoid duplicate views on initial load
    if (location !== prevLocationRef.current) {
      // Get page title from the document if available
      const pageTitle = document.title || 'RentRight AI';
      
      // Track the page view in Google Analytics
      trackPageView(location, pageTitle);
      
      // Update the previous location
      prevLocationRef.current = location;
      
      // Log for debugging
      console.log(`Page view tracked: ${location}`);
    }
  }, [location]);

  // This component doesn't render anything
  return null;
};

export default AnalyticsTracker;