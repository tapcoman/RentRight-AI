import { Link, useLocation } from 'wouter';
import { HelpCircle, FileText, Home, Menu, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Logo } from '@/components/ui/logo';

export default function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <header className="bg-white sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <Logo size="lg" textColor="text-gray-800" />
          </div>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/">
            <div className={`text-sm font-medium transition-colors ${location === '/' ? 'text-[#EC7134]' : 'text-gray-700 hover:text-[#EC7134]'}`}>
              Solutions
            </div>
          </Link>
          <Link href="/tenant-rights">
            <div className={`text-sm font-medium transition-colors ${location === '/tenant-rights' ? 'text-[#EC7134]' : 'text-gray-700 hover:text-[#EC7134]'}`}>
              Tenant Rights
            </div>
          </Link>
          <Link href="/about">
            <div className={`text-sm font-medium transition-colors ${location === '/about' ? 'text-[#EC7134]' : 'text-gray-700 hover:text-[#EC7134]'}`}>
              About us
            </div>
          </Link>
          <Link href="/contact">
            <div className={`text-sm font-medium transition-colors ${location === '/contact' ? 'text-[#EC7134]' : 'text-gray-700 hover:text-[#EC7134]'}`}>
              Contact
            </div>
          </Link>
        </nav>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden rounded-full bg-[#FBF8F2] p-2 text-[#EC7134] border border-[#F3EEE4] hover:bg-[#F3EEE4] transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </button>
          
          {/* Get Started Button (Desktop Only) */}
          <Link href="/" className="hidden md:block">
            <Button 
              className="bg-[#EC7134] hover:bg-[#E35F1E] text-white font-medium rounded-xl shadow-sm"
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
              Start Analyzing
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-[#F3EEE4] py-4">
          <div className="container mx-auto px-4 space-y-3">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${location === '/' ? 'bg-[#FBF8F2] text-[#EC7134]' : 'text-gray-700'}`}>
                <span className="font-medium">Solutions</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
            <Link href="/tenant-rights" onClick={() => setMobileMenuOpen(false)}>
              <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${location === '/tenant-rights' ? 'bg-[#FBF8F2] text-[#EC7134]' : 'text-gray-700'}`}>
                <span className="font-medium">Tenant Rights</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
            <Link href="/about" onClick={() => setMobileMenuOpen(false)}>
              <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${location === '/about' ? 'bg-[#FBF8F2] text-[#EC7134]' : 'text-gray-700'}`}>
                <span className="font-medium">About us</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
            <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
              <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${location === '/contact' ? 'bg-[#FBF8F2] text-[#EC7134]' : 'text-gray-700'}`}>
                <span className="font-medium">Contact</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
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
                className="w-full mt-2 bg-[#EC7134] hover:bg-[#E35F1E] text-white font-medium rounded-xl"
              >
                Start Analyzing
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
