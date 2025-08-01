import { useState, useEffect, useRef } from 'react';
import DocumentUploader from '@/components/DocumentUploader';

import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Logo } from '@/components/ui/logo';
import { SolutionShowcase } from '@/components/ui/solution-showcase';
import { HeroShowcase } from '@/components/ui/hero-showcase';
import { Mascot } from '@/components/ui/mascot';
import { 
  FileText, 
  Shield, 
  Check, 
  AlertTriangle, 
  BarChart, 
  FileUp, 
  Zap, 
  Scale, 
  Calendar, 
  Building, 
  Lock, 
  DollarSign, 
  X,
  HomeIcon,
  AlertCircle,
  Sparkles,
  Clock
} from 'lucide-react';
import { motion, useAnimation, useInView, AnimatePresence } from 'framer-motion';
import Statistics from '@/components/Statistics';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

// Animated Section component with scroll trigger
const AnimatedSection = ({ children }: { children: React.ReactNode }) => {
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  
  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);
  
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: { duration: 0.5 }
        }
      }}
    >
      {children}
    </motion.div>
  );
}

// CountUp component for animated numbers
function CountUp({ from, to, duration = 2, suffix = '' }: { from: number, to: number, duration?: number, suffix?: string }) {
  const [count, setCount] = useState(from);
  const countRef = useRef(from);
  const startTimeRef = useRef<number | null>(null);
  
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      
      const progress = Math.min((timestamp - startTimeRef.current) / (duration * 1000), 1);
      const nextCount = Math.floor(from + progress * (to - from));
      
      if (countRef.current !== nextCount) {
        countRef.current = nextCount;
        setCount(nextCount);
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(to);
      }
    };
    
    requestAnimationFrame(animate);
    
    return () => {
      startTimeRef.current = null;
    };
  }, [from, to, duration]);
  
  return <>{count}{suffix}</>;
}

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalysisAnimationActive, setIsAnalysisAnimationActive] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState("upload"); // Default selected issue for analysis workflow
  const [location, setLocation] = useLocation();
  const [showLandlordPopup, setShowLandlordPopup] = useState(false);
  
  // Handle URL parameters for direct section navigation
  useEffect(() => {
    // Extract the section parameter from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const sectionParam = urlParams.get('section');
    
    // If a section parameter exists, scroll to that section
    if (sectionParam) {
      setTimeout(() => {
        const sectionElement = document.getElementById(`${sectionParam}-section`);
        if (sectionElement) {
          sectionElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500); // Delay to ensure the page has loaded properly
    }
  }, [location]);
  
  // Effect to show the landlord popup after 20 seconds
  useEffect(() => {
    // Check if we've already shown the popup to this user
    const hasSeenPopup = localStorage.getItem('hasSeenLandlordPopup');
    
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setShowLandlordPopup(true);
      }, 20000); // 20 seconds
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleUploadComplete = (id: number) => {
    setIsUploading(false);
    // Only navigate if we got a valid document ID (not -1 which signals CAPTCHA verification needed)
    if (id > 0) {
      setLocation(`/processing/${id}`);
    }
  };

  if (isUploading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-20 h-20 mx-auto mb-6 bg-[#EC7134] bg-opacity-10 rounded-full flex items-center justify-center"
          >
            <FileUp className="w-10 h-10 text-[#EC7134] animate-pulse" />
          </motion.div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Uploading Your Document
          </h1>
          
          <p className="text-gray-600 mb-8">
            Securely uploading your tenancy agreement...
          </p>

          <div className="text-sm text-gray-500">
            Your document is encrypted and secure
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Landlord Popup that appears after 20 seconds */}
      <Dialog open={showLandlordPopup} onOpenChange={setShowLandlordPopup}>
        <DialogContent className="sm:max-w-md md:max-w-lg animate-in fade-in-0 zoom-in-95 duration-300">
          <DialogHeader>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#FDF7EE] flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#EC7134]" />
              </div>
              <div>
                <DialogTitle className="text-left text-xl">Landlords regularly add illegal terms to agreements</DialogTitle>
                <DialogDescription className="text-left">
                  Our analysis has found that <span className="font-semibold">87% of tenancy agreements in the UK</span> contain at least one unfair or potentially illegal clause.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FDF7EE] flex items-center justify-center flex-shrink-0 text-[#EC7134]">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Illegal Fees</h4>
                  <p className="text-sm text-gray-600">Charges beyond what's allowed by the Tenant Fees Act 2019</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FDF7EE] flex items-center justify-center flex-shrink-0 text-[#EC7134]">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Deposit Traps</h4>
                  <p className="text-sm text-gray-600">Terms making it hard to get your deposit back</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FDF7EE] flex items-center justify-center flex-shrink-0 text-[#EC7134]">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Repair Avoidance</h4>
                  <p className="text-sm text-gray-600">Clauses shifting landlord responsibilities to tenants</p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-start gap-4 flex-col sm:flex-row">
            <Button 
              className="bg-[#EC7134] hover:bg-[#D8602A] text-white"
              onClick={() => {
                // Save that user has seen the popup
                localStorage.setItem('hasSeenLandlordPopup', 'true');
                setShowLandlordPopup(false);
                document.getElementById('upload-section')?.scrollIntoView({behavior: 'smooth'});
              }}
            >
              Check Your Agreement Now
            </Button>
            <DialogClose asChild>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  // Save that user has seen the popup
                  localStorage.setItem('hasSeenLandlordPopup', 'true');
                }}
              >
                Not Now
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Top Help Button */}
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg bg-[#EC7134] hover:bg-[#E35F1E] text-white z-50 flex items-center justify-center"
            aria-label="Get help"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">Need help with <Logo size="sm" textColor="text-gray-900" accentColor="text-[#EC7134]" withBackground={false} as="span" /></DialogTitle>
            <DialogDescription>
              Get quick answers to your questions about our services.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-[#EC7134] mb-2">How does the analysis work?</h4>
              <p className="text-sm text-gray-600">
                Our AI examines your tenancy agreement for unfair terms, potential risks, and legal concerns based on current UK housing laws and regulations.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-[#EC7134] mb-2">What formats are supported?</h4>
              <p className="text-sm text-gray-600">
                We currently support PDF and Word (DOC/DOCX) document formats. Make sure your document is text-based and not scanned images.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-[#EC7134] mb-2">How secure is my data?</h4>
              <p className="text-sm text-gray-600">
                All documents are encrypted and stored securely. We never share your documents with third parties, and they're only used for analysis purposes.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-[#EC7134] mb-2">Contact customer support</h4>
              <p className="text-sm text-gray-600">
                Email us at contact@rentrightai.co.uk or call 0333-123-4567 during business hours (9am-5pm, Monday-Friday).
              </p>
            </div>
          </div>
          <DialogFooter className="sm:justify-center">
            <DialogClose asChild>
              <Button type="button" className="bg-[#EC7134] hover:bg-[#E35F1E] text-white">
                Got it, thanks!
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced trust badges section */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b py-4">
        <div className="max-w-6xl mx-auto flex justify-center items-center px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            <div className="flex items-center justify-center group bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-8 h-8 mr-3 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors duration-300">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-center md:text-left">
                <span className="font-semibold text-gray-900 group-hover:text-[#EC7134] transition-colors duration-300 text-sm">UK Housing Law</span>
                <div className="text-xs text-gray-600">Specialist Expertise</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center group bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-8 h-8 mr-3 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-300">
                <Lock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-center md:text-left">
                <span className="font-semibold text-gray-900 group-hover:text-[#EC7134] transition-colors duration-300 text-sm">Bank-Grade Security</span>
                <div className="text-xs text-gray-600">Encrypted & GDPR Compliant</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center group bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-8 h-8 mr-3 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors duration-300">
                <Zap className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-center md:text-left">
                <span className="font-semibold text-gray-900 group-hover:text-[#EC7134] transition-colors duration-300 text-sm">Instant Results</span>
                <div className="text-xs text-gray-600">5-Minute Analysis</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero section - New friendly design */}
      <div className="bg-white pt-10 pb-16 px-4 sm:px-6 relative">
        {/* Background patterns */}
        <div className="absolute inset-0 opacity-5 z-0 overflow-hidden">
          <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-[#EC7134]"></div>
          <div className="absolute right-0 bottom-0 w-80 h-80 rounded-full bg-[#4CAF50] opacity-20"></div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Grid with mascot always on the right side */}
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 md:gap-12">
            {/* Left column - Text content */}
            <div className="order-2 md:order-1 text-center md:text-left">
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-red-100 text-red-800 mb-6 border-2 border-red-200">
                <AlertTriangle className="w-4 h-4 mr-2" /> URGENT: Check Before You Sign
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6 leading-tight">
                Is Your Tenancy Agreement Ripping You Off?
              </h1>
              <p className="text-xl text-gray-600 mb-4 max-w-xl mx-auto md:mx-0 text-center md:text-left">
                Our AI instantly identifies the unfair clauses, illegal fees, and deposit traps hiding in your tenancy agreement 
                — before you sign and lose money you can't get back.
              </p>
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-lg p-6 mb-8 max-w-xl mx-auto md:mx-0 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mt-0.5">
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-red-900 font-bold text-base mb-2">Critical Warning</h4>
                    <p className="text-red-800 text-sm leading-relaxed">
                      <strong>73% of UK tenancy agreements</strong> contain terms that violate current housing regulations, 
                      potentially costing tenants <strong>£500+ in unlawful fees</strong> and lost deposits according to housing charities.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Button 
                  className="bg-gradient-to-r from-[#EC7134] to-[#E35F1E] hover:from-[#E35F1E] hover:to-[#D54F0A] text-white font-bold px-8 py-4 text-lg shadow-2xl rounded-xl transform hover:scale-105 transition-all duration-200 relative overflow-hidden flex-shrink-0"
                  onClick={() => document.getElementById('upload-section')?.scrollIntoView({behavior: 'smooth'})}
                >
                  <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                    <Shield className="w-4 h-4" />
                    Protect Yourself Now - £29
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
                </Button>

                <Button
                  variant="outline"
                  className="border-2 border-[#EC7134] text-[#EC7134] hover:bg-[#EC7134] hover:text-white font-medium px-4 py-4 text-sm rounded-xl transition-all duration-200 hover:shadow-lg flex-shrink"
                  onClick={() => document.getElementById('services-section')?.scrollIntoView({behavior: 'smooth'})}
                >
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    Examples
                    <svg className="w-3 h-3 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </span>
                </Button>
              </div>
              
              {/* Trust indicators */}
              <div className="mt-8 flex items-center justify-center md:justify-start space-x-6 text-gray-600">
                <div className="flex items-center">
                  <div className="bg-[#F9FAFB] p-1 rounded-full mr-2">
                    <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-sm">100% Private & Secure</span>
                </div>
                <div className="flex items-center">
                  <div className="bg-[#F9FAFB] p-1 rounded-full mr-2">
                    <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-sm">UK Tenancy Law Checked</span>
                </div>
              </div>
            </div>
            
            {/* Right column - Enhanced mascot showcase with decorative elements */}
            <div className="order-1 md:order-2 flex justify-center md:justify-end items-center">
              <div className="relative md:mr-6">
                {/* Decorative background elements - enlarged */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-orange-100 rounded-full opacity-30 z-0"></div>
                <div className="absolute right-20 bottom-10 w-40 h-40 bg-green-100 rounded-full opacity-40 z-0"></div>
                <div className="absolute -left-10 top-20 w-36 h-36 bg-blue-100 rounded-full opacity-20 z-0"></div>
                
                {/* Animated floating mascot */}
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 2, 0, -2, 0]
                  }}
                  transition={{ 
                    duration: 5, 
                    repeat: Infinity,
                    repeatType: "reverse" 
                  }}
                  className="relative z-10"
                >
                  {/* Mascot component - consistent sizing with badges */}
                  <div className="w-96 h-96">
                    <Mascot 
                      size="xxl" 
                      withKey={false} 
                      withMagnifier={true} 
                      glowing={true} 
                      withBadges={true}
                      className="drop-shadow-xl" 
                    />
                  </div>
                </motion.div>
                
                {/* Shadow effect */}
                <div className="w-48 h-8 bg-gray-200 rounded-full absolute -bottom-4 left-1/2 transform -translate-x-1/2 blur-md opacity-30 z-0"></div>
                
                {/* Decorative elements - removed floating badges */}
              </div>
            </div>
          </div>
          

          

        </div>
      </div>
      
      {/* Modern upload section with friendly design */}
      <div className="py-16 bg-white text-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col justify-center">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#EC7134]/10 text-[#EC7134] text-sm font-medium mb-4 w-fit">
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered Legal Analysis
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 text-[#1E293B]">Upload Your Tenancy Agreement</h2>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Our advanced <span className="text-[#EC7134] font-medium">AI system</span> examines your document to help identify potentially unfair terms, questionable clauses, and areas that may need attention.
              </p>
              
              {/* Step by step process with micro-animations */}
              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex items-center space-x-4 group">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#EC7134] group-hover:bg-[#E35F1E] rounded-full flex items-center justify-center transition-all duration-300 shadow-sm">
                    <FileUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 group-hover:translate-x-1 transition-transform duration-300">
                      Upload your tenancy agreement
                    </p>
                    <p className="text-gray-500 text-sm mt-1">Drag & drop or click to upload (PDF, DOC, DOCX)</p>
                  </div>
                </div>
                
                {/* Step 2 */}
                <div className="flex items-center space-x-4 group">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#EC7134]/80 group-hover:bg-[#E35F1E] rounded-full flex items-center justify-center transition-all duration-300 shadow-sm">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 group-hover:translate-x-1 transition-transform duration-300">
                      Complete secure payment (£29)
                    </p>
                    <p className="text-gray-500 text-sm mt-1">One-time payment for professional legal analysis</p>
                  </div>
                </div>
                
                {/* Step 3 */}
                <div className="flex items-center space-x-4 group">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#EC7134]/60 group-hover:bg-[#E35F1E] rounded-full flex items-center justify-center transition-all duration-300 shadow-sm">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 group-hover:translate-x-1 transition-transform duration-300">
                      Receive your detailed analysis
                    </p>
                    <p className="text-gray-500 text-sm mt-1">Professional PDF report + FREE response templates by email</p>
                  </div>
                </div>
              </div>
              
              {/* Benefits highlight */}
              <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Why use RentRight AI?</h4>
                    <p className="text-sm text-gray-600">
                      Many UK tenancy agreements may contain unfair or problematic terms. Our AI analysis can help 
                      identify these issues, potentially helping you understand your rights and obligations better.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Upload form in a modern card with friendly design */}
            <div id="upload-section" className="relative">
              {/* Decorative elements for friendly look - enlarged */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#EC7134]/5 rounded-full blur-xl"></div>
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#EC7134]/5 rounded-full blur-lg"></div>
              <div className="absolute top-40 right-10 w-32 h-32 bg-blue-100/10 rounded-full blur-lg"></div>
              
              {/* Card with subtle animation */}
              <div className="relative bg-white rounded-xl p-8 shadow-sm border border-gray-100 overflow-hidden group">
                {/* Simple decorative element */}
                <div className="absolute right-0 top-0 w-40 h-40 opacity-20">
                  <div className="w-20 h-20 rounded-full bg-[#EC7134]/5 absolute top-6 right-6"></div>
                  <div className="w-8 h-8 rounded-full bg-[#EC7134]/10 absolute top-4 right-4 animate-pulse"></div>
                </div>
                
                <div className="text-center mb-6">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#EC7134]/10 text-[#EC7134] text-sm font-medium mb-3">
                    <Shield className="w-4 h-4 mr-2" />
                    Secure Professional Analysis
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">Get Your Agreement Analysed</h3>
                  <p className="text-gray-600 mb-4">Upload your tenancy agreement for AI-powered legal document analysis</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    <strong>✓ AI-Powered Review:</strong> Analyse terms and clauses to help understand your agreement
                  </div>
                </div>
                <DocumentUploader onUploadStart={() => setIsUploading(true)} onUploadComplete={handleUploadComplete} />
                
                <div className="mt-6 space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-green-800 font-semibold text-sm mb-1">✓ Complete Professional Analysis - £29</div>
                    <div className="text-green-700 text-xs mb-2">
                      Legal compliance check • Instant PDF report • FREE response templates
                    </div>
                    <div className="text-blue-700 text-xs font-medium">
                      Delivered to your email typically within minutes
                    </div>
                  </div>
                  
                  {/* Trust indicators */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="flex flex-col items-center">
                      <Lock className="w-4 h-4 text-gray-500 mb-1" />
                      <span className="text-xs text-gray-600">Bank-grade security</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Shield className="w-4 h-4 text-gray-500 mb-1" />
                      <span className="text-xs text-gray-600">GDPR compliant</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Calendar className="w-4 h-4 text-gray-500 mb-1" />
                      <span className="text-xs text-gray-600">Auto-deleted 30 days</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced CSS animations - inline style to avoid separate file */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes dash {
          to {
            stroke-dashoffset: -30;
          }
        }
        
        @keyframes dash-reverse {
          to {
            stroke-dashoffset: 30;
          }
        }
        
        .path-animation {
          animation: dash 5s linear infinite;
        }
        
        @keyframes ticker-rtl {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        @keyframes ticker-ltr {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(0);
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
          50% { box-shadow: 0 0 10px 3px rgba(56, 189, 248, 0.3); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes scale-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes border-pulse {
          0%, 100% { border-color: rgba(56, 189, 248, 0.3); }
          50% { border-color: rgba(56, 189, 248, 0.7); }
        }
        
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 2px rgba(56, 189, 248, 0)); }
          50% { filter: drop-shadow(0 0 5px rgba(56, 189, 248, 0.5)); }
        }
        
        .ticker-animation-rtl {
          animation: ticker-rtl 40s linear infinite;
        }
        
        .ticker-animation-ltr {
          animation: ticker-ltr 40s linear infinite;
        }
        
        .pulse-animate {
          animation: pulse-glow 2s infinite;
        }
        
        .float-animate {
          animation: float 4s ease-in-out infinite;
        }
        
        .scale-pulse-animate {
          animation: scale-pulse 3s ease-in-out infinite;
        }
        
        .border-pulse-animate {
          animation: border-pulse 3s ease-in-out infinite;
        }
        
        .glow-animate {
          animation: glow 2s ease-in-out infinite;
        }
        
        /* Card hover effects */
        .service-card:hover .card-bg {
          transform: scale(1.05);
          opacity: 0.9;
        }
        
        /* File drop animation - Add visual indicator for drag active state */
        @keyframes border-dance {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }
      `}} />
      

      

      
      {/* Simplified AI Analysis Section */}
      <div id="services-section" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#EC7134]/10 text-[#EC7134] text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Professional AI Analysis
            </div>
            
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Issues Could We Find in Your Agreement?
            </h2>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Our specialized AI scans every clause against current UK housing law to identify potential problems that could impact your rights or finances.
            </p>
          </div>
          
          {/* Simplified 4-card grid with key issues */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 hover:shadow-lg transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <DollarSign className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-3 text-lg">Prohibited Charges & Hidden Fees</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">Hidden costs or charges that may breach the Tenant Fees Act 2019, potentially saving you hundreds of pounds in illegal fees.</p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                <span className="font-semibold text-red-800">Potential saving:</span>
                <span className="text-red-700"> £50-£500+ in illegal fees</span>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-orange-100 hover:shadow-lg transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-3 text-lg">Unfair or Illegal Terms</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">Unreasonable clauses that may violate UK tenant protection laws, including excessive restrictions or unenforceable penalties.</p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                <span className="font-semibold text-orange-800">Common finding:</span>
                <span className="text-orange-700"> Blanket pet bans or excessive notice periods</span>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-100 hover:shadow-lg transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Scale className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-3 text-lg">Deposit Protection Issues</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">Missing or inadequate deposit protection clauses that could affect your ability to recover your full deposit at the end of tenancy.</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <span className="font-semibold text-blue-800">Protection value:</span>
                <span className="text-blue-700"> Safeguard your entire deposit</span>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-green-100 hover:shadow-lg transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Building className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-3 text-lg">Maintenance & Repair Issues</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">Unfair allocation of repair responsibilities that could leave you paying for landlord obligations or major structural issues.</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                <span className="font-semibold text-green-800">Risk protection:</span>
                <span className="text-green-700"> Avoid costly repair disputes</span>
              </div>
            </div>
          </div>
          
          {/* Call to action */}
          <div className="text-center bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Don't Let Hidden Issues Cost You</h3>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              Our professional analysis could identify problems that might cost you hundreds of pounds or compromise your rights as a tenant.
            </p>
            <Button 
              size="lg"
              className="bg-[#EC7134] hover:bg-[#E35F1E] text-white font-semibold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
              onClick={() => document.getElementById('upload-section')?.scrollIntoView({behavior: 'smooth'})}
            >
              Get Professional Analysis - £29
            </Button>
            <p className="text-sm text-gray-500 mt-3">Less than the cost of 1 hour with a solicitor</p>
          </div>
          
          {/* Enhanced Interactive Demo */}
          <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-6 border border-gray-200 mb-8 max-w-2xl mx-auto shadow-sm">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-[#EC7134]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-[#EC7134]" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">See What We Could Find in Your Agreement</h3>
              <p className="text-sm text-gray-600">Watch our AI identify real problems that could cost you money</p>
            </div>
            
            <div className="space-y-4 mb-6 min-h-[280px]">
              {!isAnalysisAnimationActive ? (
                <div className="text-center">
                  <div className="bg-white rounded-lg border-2 border-dashed border-gray-200 p-8 mb-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">Sample Tenancy Agreement</p>
                    <p className="text-sm text-gray-400">Click analyze to see what we find</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Analysis in progress */}
                  <motion.div 
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <motion.div
                        className="w-4 h-4 bg-blue-500 rounded-full mr-2"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      />
                      <span className="text-blue-700 font-medium text-sm">Analyzing clauses...</span>
                    </div>
                  </motion.div>

                  {/* Critical Issue Found */}
                  <motion.div 
                    className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                  >
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-red-800 text-sm">CRITICAL: Illegal Tenant Fees</div>
                        <div className="text-red-700 text-xs mt-1">
                          £150 "administration fee" and £75 "reference check fee" violate the Tenant Fees Act 2019
                        </div>
                        <div className="text-red-600 text-xs mt-2 font-medium">💰 Could save you: £225</div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Warning Issue */}
                  <motion.div 
                    className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.8, duration: 0.5 }}
                  >
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-amber-800 text-sm">WARNING: Excessive Cleaning Requirement</div>
                        <div className="text-amber-700 text-xs mt-1">
                          "Professional carpet cleaning required regardless of condition" may be unfair and unreasonable
                        </div>
                        <div className="text-amber-600 text-xs mt-2 font-medium">⚖️ Risk: Potential deposit deduction challenge</div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Good Finding */}
                  <motion.div 
                    className="bg-green-50 border-l-4 border-green-500 rounded-r-lg p-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.4, duration: 0.5 }}
                  >
                    <div className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-green-800 text-sm">✓ COMPLIANT: Notice Periods</div>
                        <div className="text-green-700 text-xs mt-1">
                          2-month notice period correctly specified for both parties
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Analysis Summary */}
                  <motion.div 
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3.0, duration: 0.5 }}
                  >
                    <div className="text-center">
                      <div className="font-bold text-gray-900 text-sm mb-1">Analysis Complete - Issues Found!</div>
                      <div className="text-xs text-gray-600 mb-2">1 critical illegal fee + 1 potential deposit risk identified</div>
                      <div className="bg-[#EC7134]/10 rounded-lg p-2 mt-3">
                        <div className="text-xs text-[#EC7134] font-medium">💡 Your agreement could have similar issues</div>
                        <div className="text-xs text-gray-600 mt-1">Get full analysis + response templates for £29</div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
            
            <Button 
              className="w-full bg-gradient-to-r from-[#EC7134] to-[#E35F1E] hover:from-[#E35F1E] hover:to-[#D54F0A] text-white font-medium py-3 rounded-lg shadow-sm transition-all duration-200"
              onClick={() => setIsAnalysisAnimationActive(!isAnalysisAnimationActive)}
            >
              {isAnalysisAnimationActive ? (
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 4v6h-6"></path>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                  Try Again
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"></polygon>
                  </svg>
                  Run Demo Analysis
                </div>
              )}
            </Button>
          </div>
          
          <Button 
            size="lg"
            className="bg-[#EC7134] hover:bg-[#E35F1E] text-white font-semibold px-8 py-4 text-lg rounded-xl"
            onClick={() => document.getElementById('upload-section')?.scrollIntoView({behavior: 'smooth'})}
          >
            Upload My Agreement - £29
          </Button>
        </div>
      </div>
      

      
      {/* Enhanced Get started CTA section */}
      <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 py-20 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left side - Content */}
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-100 text-red-700 text-sm font-medium mb-4">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Final Check Before Signing
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                Don't Sign Without Understanding Your Agreement
              </h2>
              
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Many tenancy agreements contain problematic terms that could cost you money. Get clarity before you commit.
              </p>
              
              {/* Risk indicators */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertCircle className="w-3 h-3 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Excessive deposit demands</p>
                    <p className="text-sm text-gray-600">Some agreements request deposits above legal limits</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertCircle className="w-3 h-3 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Unfair penalty clauses</p>
                    <p className="text-sm text-gray-600">Hidden fees that may not be legally enforceable</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertCircle className="w-3 h-3 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Restricted tenant rights</p>
                    <p className="text-sm text-gray-600">Terms that may limit your legal protections</p>
                  </div>
                </div>
              </div>
              
              <Button 
                className="bg-[#EC7134] hover:bg-[#E35F1E] text-white font-semibold px-8 py-4 text-lg shadow-lg rounded-xl transform hover:scale-105 transition-all duration-300 mb-4"
                onClick={() => document.getElementById('upload-section')?.scrollIntoView({behavior: 'smooth'})}
              >
                <Shield className="w-5 h-5 mr-2" />
                Analyse My Agreement - £29
              </Button>
              
              <div className="text-sm text-gray-600">
                <p>✓ AI-powered legal analysis • ✓ Professional PDF report • ✓ FREE response templates</p>
              </div>
            </div>
            
            {/* Right side - Visual card */}
            <div className="order-1 lg:order-2 relative">
              {/* Background decorative elements */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#EC7134]/5 rounded-full blur-xl"></div>
              <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-200/20 rounded-full blur-lg"></div>
              
              {/* Main card */}
              <div className="relative bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[#EC7134]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-[#EC7134]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Professional Legal Analysis</h3>
                  <p className="text-gray-600">Understand your agreement before you sign</p>
                </div>
                
                {/* Benefits */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Identifies potentially unfair terms</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Explains complex legal language</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Provides actionable recommendations</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Includes FREE response templates</span>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-1">£29</div>
                    <div className="text-sm text-gray-600">Complete professional analysis</div>
                    <div className="text-xs text-blue-700 mt-1">Typically delivered within minutes</div>
                  </div>
                </div>
              </div>
              
              {/* Mascot decoration */}
              <div className="absolute -top-8 -left-8 opacity-30 hidden lg:block">
                <Mascot size="md" withKey={false} withMagnifier={false} />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced FAQ section */}
      <div className="py-12 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#EC7134]/10 text-[#EC7134] mb-3">
              Knowledge Center
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Need more detail? Explore our FAQs</h3>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
              Get answers to common questions about tenancy assessment, tenancy agreements, and tenant rights.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/faqs/tenancy-analysis" className="group">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:border-[#EC7134]/20 hover:translate-y-[-3px] h-full flex flex-col">
                <div className="w-10 h-10 bg-[#EC7134]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#EC7134]/20 transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EC7134" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><circle cx="12" cy="14" r="4"></circle><line x1="12" y1="12" x2="12" y2="16"></line><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                </div>
                <h4 className="text-lg font-semibold mb-2 text-gray-800 group-hover:text-[#EC7134] transition-colors duration-300">What is tenancy assessment?</h4>
                <p className="text-gray-600 text-sm flex-grow">
                  Learn how our AI technology evaluates your tenancy agreement and identifies potential issues.
                </p>
                <div className="mt-4 text-[#EC7134] text-sm font-medium flex items-center group-hover:translate-x-1 transition-transform duration-300">
                  Read more
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </div>
              </div>
            </Link>
            
            <Link href="/tenant-rights" className="group">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:border-[#EC7134]/20 hover:translate-y-[-3px] h-full flex flex-col">
                <div className="w-10 h-10 bg-[#EC7134]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#EC7134]/20 transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EC7134" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                </div>
                <h4 className="text-lg font-semibold mb-2 text-gray-800 group-hover:text-[#EC7134] transition-colors duration-300">What issues do we find?</h4>
                <p className="text-gray-600 text-sm flex-grow">
                  Discover the common legal problems and unfair terms we identify in tenancy agreements.
                </p>
                <div className="mt-4 text-[#EC7134] text-sm font-medium flex items-center group-hover:translate-x-1 transition-transform duration-300">
                  Read more
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </div>
              </div>
            </Link>
            
            <Link href="/faqs/common-tenancy-agreement-faqs" className="group">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:border-[#EC7134]/20 hover:translate-y-[-3px] h-full flex flex-col">
                <div className="w-10 h-10 bg-[#EC7134]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#EC7134]/20 transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EC7134" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M9 14h.01"></path><path d="M9 10h.01"></path><path d="M13 14h2"></path><path d="M13 10h2"></path></svg>
                </div>
                <h4 className="text-lg font-semibold mb-2 text-gray-800 group-hover:text-[#EC7134] transition-colors duration-300">Common Tenancy Agreement FAQs</h4>
                <p className="text-gray-600 text-sm flex-grow">
                  Find answers to frequently asked questions about deposits, repairs, ending tenancies, and more.
                </p>
                <div className="mt-4 text-[#EC7134] text-sm font-medium flex items-center group-hover:translate-x-1 transition-transform duration-300">
                  Read more
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      {/* Footer component is imported and rendered automatically by the layout */}
    </div>
  );
}
