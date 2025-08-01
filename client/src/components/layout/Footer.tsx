import { Logo } from '@/components/ui/logo';

export default function Footer() {
  return (
    <footer className="bg-slate-50 mt-auto py-16 border-t border-slate-200">
      <div className="container mx-auto px-4">
        {/* Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Column 1 - Logo and info */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center mb-4">
              <Logo size="md" textColor="text-gray-800" accentColor="text-[#EC7134]" />
            </div>
            <p className="text-gray-600 text-sm mb-4">
              AI-powered tenancy agreement analysis for UK property renters.
            </p>
            <div className="text-gray-600 text-sm">
              <a href="https://rentrightai.co.uk" className="text-[#EC7134] hover:underline">rentrightai.co.uk</a>
            </div>
          </div>
          
          {/* Column 2 - Resources */}
          <div className="col-span-1">
            <h3 className="text-gray-800 font-medium mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="/tenant-rights" className="text-gray-600 hover:text-[#EC7134] text-sm transition-colors">UK Tenant Rights</a></li>
              <li><a href="/faqs/tenancy-analysis" className="text-gray-600 hover:text-[#EC7134] text-sm transition-colors">Tenancy Analysis</a></li>
              <li><a href="/faqs/common-tenancy-agreement-faqs" className="text-gray-600 hover:text-[#EC7134] text-sm transition-colors">Common Tenancy Agreement FAQs</a></li>
            </ul>
          </div>
          
          {/* Column 3 - Contact */}
          <div className="col-span-1">
            <h3 className="text-gray-800 font-medium mb-4">Contact</h3>
            <ul className="space-y-2">
              <li><a href="mailto:contact@rentrightai.co.uk" className="text-gray-600 hover:text-[#EC7134] text-sm transition-colors">Email Us</a></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between">
          <div className="text-sm text-gray-500 mb-4 md:mb-0 flex items-center">
            © {new Date().getFullYear()} <span className="mx-1"><Logo size="sm" textColor="text-gray-500" accentColor="text-gray-500" withBackground={false} as="span" /></span> All rights reserved. <a href="https://rentrightai.co.uk" className="ml-1 text-gray-500 hover:text-[#EC7134]">rentrightai.co.uk</a>
          </div>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6">
            <a href="/privacy-policy" className="text-sm text-gray-500 hover:text-[#EC7134] transition-colors">Privacy Policy</a>
            <a href="/terms-of-service" className="text-sm text-gray-500 hover:text-[#EC7134] transition-colors">Terms of Service</a>
            <a href="#" onClick={(e) => { e.preventDefault(); document.querySelector('button[aria-label="Cookie Settings"]')?.dispatchEvent(new MouseEvent('click')); }} className="text-sm text-gray-500 hover:text-[#EC7134] transition-colors cursor-pointer">Cookie Settings</a>
            <a href="/contact" className="text-sm text-gray-500 hover:text-[#EC7134] transition-colors">Contact Us</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
