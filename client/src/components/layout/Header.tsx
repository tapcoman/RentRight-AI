import { Link, useLocation } from 'wouter';
import { HelpCircle, FileText, Home, Menu, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Logo } from '@/components/ui/logo';

export default function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <header className="bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm border-b border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity duration-200">
            <Logo size="lg" textColor="text-gray-800" />
          </div>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-8">
          <Link href="/">
            <div className={`text-sm font-medium transition-all duration-200 hover:scale-105 px-3 py-2 rounded-lg ${
              location === '/' 
                ? 'text-[#EC7134] bg-[#EC7134]/5' 
                : 'text-gray-700 hover:text-[#EC7134] hover:bg-gray-50'
            }`}>
              Solutions
            </div>
          </Link>
          <Link href="/tenant-rights">
            <div className={`text-sm font-medium transition-all duration-200 hover:scale-105 px-3 py-2 rounded-lg ${
              location === '/tenant-rights' 
                ? 'text-[#EC7134] bg-[#EC7134]/5' 
                : 'text-gray-700 hover:text-[#EC7134] hover:bg-gray-50'
            }`}>
              Tenant Rights
            </div>
          </Link>
          <Link href="/about">
            <div className={`text-sm font-medium transition-all duration-200 hover:scale-105 px-3 py-2 rounded-lg ${
              location === '/about' 
                ? 'text-[#EC7134] bg-[#EC7134]/5' 
                : 'text-gray-700 hover:text-[#EC7134] hover:bg-gray-50'
            }`}>
              About us
            </div>
          </Link>
          <Link href="/contact">
            <div className={`text-sm font-medium transition-all duration-200 hover:scale-105 px-3 py-2 rounded-lg ${
              location === '/contact' 
                ? 'text-[#EC7134] bg-[#EC7134]/5'
                : 'text-gray-700 hover:text-[#EC7134] hover:bg-gray-50'
            }`}>
              Contact
            </div>
          </Link>
        </nav>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden rounded-xl bg-slate-50 p-3 text-[#EC7134] border border-slate-200 hover:bg-slate-100 transition-all duration-200 hover:scale-105 active:scale-95 focus:ring-2 focus:ring-[#EC7134]/20"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          {/* Get Started Button (Desktop Only) */}
          <Link href="/" className="hidden lg:block">
            <Button 
              size="lg"
              className="font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              onClick={(e) => {
                e.preventDefault();
                const uploadSection = document.getElementById('upload-section');
                if (uploadSection) {
                  uploadSection.scrollIntoView({ behavior: 'smooth' });
                } else {
                  window.location.href = '/';  // Fallback if not on home page
                }
              }}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              Start Analyzing
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Enhanced Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 animate-fade-in-up">
          <div className="container mx-auto px-4 sm:px-6 py-6 space-y-2">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <div className={`flex items-center justify-between py-4 px-4 rounded-xl transition-all duration-200 ${
                location === '/' 
                  ? 'bg-[#EC7134]/10 text-[#EC7134] border border-[#EC7134]/20' 
                  : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
              }`}>
                <span className="font-medium">Solutions</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
            <Link href="/tenant-rights" onClick={() => setMobileMenuOpen(false)}>
              <div className={`flex items-center justify-between py-4 px-4 rounded-xl transition-all duration-200 ${
                location === '/tenant-rights' 
                  ? 'bg-[#EC7134]/10 text-[#EC7134] border border-[#EC7134]/20' 
                  : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
              }`}>
                <span className="font-medium">Tenant Rights</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
            <Link href="/about" onClick={() => setMobileMenuOpen(false)}>
              <div className={`flex items-center justify-between py-4 px-4 rounded-xl transition-all duration-200 ${
                location === '/about' 
                  ? 'bg-[#EC7134]/10 text-[#EC7134] border border-[#EC7134]/20' 
                  : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
              }`}>
                <span className="font-medium">About us</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
            <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
              <div className={`flex items-center justify-between py-4 px-4 rounded-xl transition-all duration-200 ${
                location === '/contact' 
                  ? 'bg-[#EC7134]/10 text-[#EC7134] border border-[#EC7134]/20' 
                  : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
              }`}>
                <span className="font-medium">Contact</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
            
            <div className="pt-4 border-t border-gray-100 mt-4">
              <Link href="/" onClick={() => {
                setMobileMenuOpen(false);
                // Add slight delay to ensure mobile menu closes first
                setTimeout(() => {
                  const uploadSection = document.getElementById('upload-section');
                  if (uploadSection) {
                    uploadSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 100);
              }}>
                <Button 
                  size="lg"
                  className="w-full font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                  Start Analyzing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
