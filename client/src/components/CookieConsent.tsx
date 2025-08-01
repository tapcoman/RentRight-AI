import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X } from 'lucide-react';
import { initializeAnalytics, removeAnalytics } from '@/lib/analytics';

type CookiePreferences = {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already set cookie preferences
    const hasConsent = localStorage.getItem('cookieConsent');
    if (!hasConsent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      try {
        const savedPreferences = JSON.parse(hasConsent);
        setPreferences(savedPreferences);
        // Apply the saved preferences immediately on page load
        applyConsentPreferences(savedPreferences);
      } catch (e) {
        // If parsing fails, reset preferences
        localStorage.removeItem('cookieConsent');
        setShowBanner(true);
      }
    }
  }, []);

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    localStorage.setItem('cookieConsent', JSON.stringify(allAccepted));
    setShowBanner(false);
    
    // Here you would trigger any analytics or tracking scripts that depend on consent
    applyConsentPreferences(allAccepted);
  };

  const savePreferences = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    setShowBanner(false);
    setShowPreferences(false);
    
    // Apply the selected preferences
    applyConsentPreferences(preferences);
  };

  const rejectNonEssential = () => {
    const necessaryOnly = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    setPreferences(necessaryOnly);
    localStorage.setItem('cookieConsent', JSON.stringify(necessaryOnly));
    setShowBanner(false);
    
    // Apply the minimal preferences
    applyConsentPreferences(necessaryOnly);
  };

  // Handle enabling/disabling various tracking scripts based on user preferences
  const applyConsentPreferences = (prefs: CookiePreferences) => {
    // 1. For analytics cookies like Google Analytics
    if (prefs.analytics) {
      // Enable Google Analytics
      initializeAnalytics(prefs);
    } else {
      // Disable analytics if previously enabled
      removeAnalytics();
    }

    // 2. For marketing/advertising cookies
    if (prefs.marketing) {
      // Enable marketing scripts (e.g. Facebook Pixel, etc.)
      // Implementation would go here when needed
    } else {
      // Disable marketing scripts
      // Remove any marketing cookies
    }

    // 3. For functional cookies
    if (prefs.functional) {
      // Enable functional enhancements
      // For example, save user preferences for UI settings
    } else {
      // Clear any functional cookies
    }
    
    // Log the applied preferences for debugging
    console.log('Cookie preferences applied:', prefs);
  };

  if (!showBanner && !showPreferences) {
    return (
      <div className="fixed right-4 bottom-4 z-50">
        <Button 
          variant="outline"
          onClick={() => setShowPreferences(true)}
          className="px-3 py-2 text-xs rounded-full bg-white shadow-md border-gray-200"
          aria-label="Cookie Settings"
        >
          Cookie Settings
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Main Cookie Banner */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg z-50 border-t border-gray-200">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">We value your privacy</h3>
                <p className="text-sm text-gray-600">
                  We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                  By clicking "Accept All", you consent to our use of cookies as described in our Cookie Policy.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPreferences(true)}
                  className="text-sm whitespace-nowrap"
                >
                  Cookie Preferences
                </Button>
                <Button 
                  variant="outline" 
                  onClick={rejectNonEssential}
                  className="text-sm whitespace-nowrap"
                >
                  Reject Non-Essential
                </Button>
                <Button 
                  onClick={acceptAll}
                  className="bg-[#EC7134] hover:bg-[#D8602A] text-white text-sm whitespace-nowrap"
                >
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Cookie Preferences Dialog */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cookie Preferences</DialogTitle>
            <DialogDescription>
              Manage your cookie preferences for this website
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="about">About Cookies</TabsTrigger>
                <TabsTrigger value="preferences">Cookie Settings</TabsTrigger>
                <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
              </TabsList>

              <TabsContent value="about">
                <div className="space-y-4 text-sm text-gray-600">
                  <p>
                    Cookies are small text files that are stored on your device when you visit a website.
                    They are widely used to make websites work more efficiently and provide information to the website owners.
                  </p>
                  <p>
                    RentRight AI uses different types of cookies for various purposes:
                  </p>
                  <div className="space-y-3 mt-4">
                    <div>
                      <h4 className="font-semibold text-gray-800">Strictly Necessary Cookies</h4>
                      <p>These cookies are essential for the website to function properly and cannot be disabled.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Functional Cookies</h4>
                      <p>These cookies enable enhanced functionality and personalization, such as remembering your preferences.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Analytics Cookies</h4>
                      <p>These cookies help us understand how visitors interact with our website, allowing us to improve the user experience.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Marketing Cookies</h4>
                      <p>These cookies are used to track visitors across websites to display relevant advertisements.</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preferences">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md">
                    <Checkbox 
                      id="necessary" 
                      checked={preferences.necessary} 
                      disabled={true}
                    />
                    <div className="space-y-1">
                      <Label 
                        htmlFor="necessary" 
                        className="font-semibold"
                      >
                        Strictly Necessary Cookies
                      </Label>
                      <p className="text-sm text-gray-600">
                        These cookies are essential for the website to function properly, including authentication and security.
                        They cannot be disabled.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-md hover:bg-gray-50">
                    <Checkbox 
                      id="functional" 
                      checked={preferences.functional}
                      onCheckedChange={(checked) => 
                        setPreferences({...preferences, functional: checked === true})
                      }
                    />
                    <div className="space-y-1">
                      <Label 
                        htmlFor="functional" 
                        className="font-semibold"
                      >
                        Functional Cookies
                      </Label>
                      <p className="text-sm text-gray-600">
                        These cookies enable enhanced functionality and personalization, such as remembering your preferences
                        and settings.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-md hover:bg-gray-50">
                    <Checkbox 
                      id="analytics" 
                      checked={preferences.analytics}
                      onCheckedChange={(checked) => 
                        setPreferences({...preferences, analytics: checked === true})
                      }
                    />
                    <div className="space-y-1">
                      <Label 
                        htmlFor="analytics" 
                        className="font-semibold"
                      >
                        Analytics Cookies
                      </Label>
                      <p className="text-sm text-gray-600">
                        These cookies help us understand how visitors interact with our website, helping us 
                        improve our site and services.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-md hover:bg-gray-50">
                    <Checkbox 
                      id="marketing" 
                      checked={preferences.marketing}
                      onCheckedChange={(checked) => 
                        setPreferences({...preferences, marketing: checked === true})
                      }
                    />
                    <div className="space-y-1">
                      <Label 
                        htmlFor="marketing" 
                        className="font-semibold"
                      >
                        Marketing Cookies
                      </Label>
                      <p className="text-sm text-gray-600">
                        These cookies are used to track visitors across websites and display relevant advertisements
                        based on your interests.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="privacy">
                <div className="prose prose-sm max-w-none text-gray-600">
                  <p>
                    Our Privacy Policy explains how we collect, use, and protect your personal information
                    when you use our website and services.
                  </p>
                  <p>
                    <strong>What information do we collect?</strong><br />
                    We collect information that you provide directly, such as when you create an account,
                    upload documents, or contact us. We also automatically collect certain information when
                    you use our website, including IP address, device information, and browsing data.
                  </p>
                  <p>
                    <strong>How do we use your information?</strong><br />
                    We use your information to provide and improve our services, communicate with you,
                    personalize your experience, and ensure security. We process your documents solely to
                    provide the analysis services you request.
                  </p>
                  <p>
                    <strong>How do we protect your information?</strong><br />
                    We implement robust security measures to protect your personal information, including
                    encryption of uploaded documents and secure data processing practices.
                  </p>
                  <p>
                    <strong>Your rights</strong><br />
                    You have the right to access, correct, delete, and port your personal data. You can also
                    object to processing and withdraw consent at any time.
                  </p>
                  <p>
                    For the complete Privacy Policy, please visit our <a href="/privacy-policy" className="text-[#EC7134] hover:underline">Privacy Policy page</a>.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            <Button 
              variant="outline" 
              onClick={rejectNonEssential}
              className="mt-3 sm:mt-0"
            >
              Reject Non-Essential
            </Button>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline"
                onClick={() => setShowPreferences(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={savePreferences}
                className="bg-[#EC7134] hover:bg-[#D8602A] text-white"
              >
                Save Preferences
              </Button>
              <Button 
                onClick={acceptAll}
                className="bg-[#EC7134] hover:bg-[#D8602A] text-white"
              >
                Accept All
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieConsent;