import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { FileText, Scale, Info } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative bg-slate-50 text-gray-800 py-16 md:py-20 overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#EC7134]/5 to-transparent"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-[#EC7134]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-[#EC7134]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#EC7134]/10 text-[#EC7134] mb-6 hover:bg-[#EC7134]/20 transition-colors duration-300 cursor-default">
              <Scale className="w-4 h-4 mr-2" /> Legal
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-[#1E293B]">
              Terms of <span className="text-[#EC7134] relative inline-block">
                Service
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#EC7134]/50 rounded-full"></span>
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 transition-all duration-500 hover:text-gray-800">
              The rules and guidelines for using RentRight AI services
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-lg max-w-none">
          <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded mb-8">
            <p className="text-blue-800">
              <strong>Last Updated:</strong> April 5, 2025
            </p>
          </div>
          
          <h2>Introduction</h2>
          <p>
            Welcome to RentRight AI. These Terms of Service ("Terms") govern your access to and use of the RentRight AI website and services ("Services"). By accessing or using our Services, you agree to be bound by these Terms.
          </p>
          <p>
            Please read these Terms carefully before using our Services. If you do not agree to these Terms, you may not access or use our Services.
          </p>

          <h2>Definitions</h2>
          <ul>
            <li><strong>"You" or "User"</strong> refers to the individual or entity accessing or using our Services.</li>
            <li><strong>"We," "Our," or "Us"</strong> refers to RentRight AI.</li>
            <li><strong>"Content"</strong> refers to any information, text, graphics, photos, or other materials uploaded, downloaded, or appearing on our Services.</li>
            <li><strong>"User Content"</strong> refers to any Content that users submit, upload, or otherwise make available via our Services.</li>
          </ul>

          <h2>Account Registration</h2>
          <p>
            To access certain features of our Services, you may need to register for an account. When registering, you must provide accurate and complete information and keep this information updated.
          </p>
          <p>
            You are responsible for safeguarding your account login credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
          </p>

          <h2>Service Description</h2>
          <p>
            RentRight AI provides AI-powered analysis of rental and tenancy agreements. Our Services help identify potential issues, unfair terms, and legal compliance concerns in these documents.
          </p>
          <p>
            While we strive to provide accurate and helpful information, our Services are for informational purposes only and do not constitute legal advice. We recommend consulting with a qualified legal professional for specific legal advice regarding your circumstances.
          </p>

          <h2>User Content and Licenses</h2>
          <p>
            You retain ownership rights to any User Content you submit to our Services. By uploading or submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, store, and process this content for the purpose of providing our Services to you.
          </p>
          <p>
            You represent and warrant that:
          </p>
          <ul>
            <li>You own or have the necessary rights to the User Content you submit</li>
            <li>Your User Content does not violate the privacy rights, publicity rights, copyright, contractual rights, or any other rights of any person or entity</li>
            <li>You have obtained all necessary consents from any third parties mentioned or depicted in your User Content</li>
          </ul>

          <h2>Payment Terms</h2>
          <p>
            Some of our Services are offered on a subscription or pay-per-use basis. By selecting a paid Service, you agree to pay the fees indicated.
          </p>
          <p>
            All fees are exclusive of taxes unless stated otherwise. You are responsible for any applicable taxes.
          </p>
          <p>
            Payments are processed through secure third-party payment processors. We do not store complete credit card information on our servers.
          </p>
          <p>
            For subscription services, your subscription will automatically renew unless you cancel it at least 24 hours before the end of the current billing period. You can cancel your subscription through your account settings.
          </p>

          <h2>Refund Policy</h2>
          <p>
            Due to the digital nature of our Services, all sales are final. However, we may consider refunds on a case-by-case basis if you experience significant technical issues that prevent you from using our Services.
          </p>
          <p>
            To request a refund, please contact our customer support team within 7 days of your purchase.
          </p>

          <h2>Limitations of Liability</h2>
          <p>
            To the maximum extent permitted by law, RentRight AI and its officers, employees, directors, shareholders, agents, and representatives shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of our Services.
          </p>
          <p>
            Our total liability for any claims arising under these Terms shall not exceed the greater of the amount you paid for our Services during the 12 months preceding the claim or £100.
          </p>

          <h2>Disclaimer of Warranties</h2>
          <p>
            Our Services are provided "as is" and "as available" without any warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
          </p>
          <p>
            We do not warrant that our Services will be uninterrupted, timely, secure, or error-free, or that any defects will be corrected.
          </p>
          <p>
            The analysis provided by our Services is based on automated processing using AI technology and may not identify all issues or accurately interpret all legal provisions in your documents. The analysis should not be relied upon as a substitute for professional legal advice.
          </p>

          <h2>Intellectual Property</h2>
          <p>
            All intellectual property rights in our Services, including but not limited to software, algorithms, technology, designs, logos, and content created by us, are owned by RentRight AI. These rights are protected by copyright, trademark, patent, and other intellectual property laws.
          </p>
          <p>
            Nothing in these Terms grants you any right to use our intellectual property without our prior written consent.
          </p>

          <h2>User Conduct</h2>
          <p>
            When using our Services, you agree not to:
          </p>
          <ul>
            <li>Violate any laws or regulations</li>
            <li>Infringe on the rights of others, including privacy and intellectual property rights</li>
            <li>Use our Services for any illegal or unauthorized purpose</li>
            <li>Attempt to gain unauthorized access to any part of our Services</li>
            <li>Interfere with or disrupt our Services or servers</li>
            <li>Harvest or collect user information without consent</li>
            <li>Upload or transmit viruses or other malicious code</li>
            <li>Impersonate any person or entity</li>
          </ul>

          <h2>Termination</h2>
          <p>
            We may terminate or suspend your access to our Services immediately, without prior notice or liability, for any reason, including if you breach these Terms.
          </p>
          <p>
            Upon termination, your right to use our Services will immediately cease. All provisions of these Terms which by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
          </p>

          <h2>Changes to Terms</h2>
          <p>
            We may revise these Terms at any time by posting an updated version on our website. By continuing to access or use our Services after those revisions become effective, you agree to be bound by the revised Terms.
          </p>
          <p>
            We will notify you of material changes to these Terms by sending an email to the email address associated with your account or by placing a prominent notice on our website.
          </p>

          <h2>Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of England and Wales, without regard to its conflict of law principles.
          </p>
          <p>
            Any disputes arising out of or relating to these Terms or our Services shall be subject to the exclusive jurisdiction of the courts of England and Wales.
          </p>

          <h2>Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <p>
            Email: <a href="mailto:legal@rentrightai.com" className="text-[#EC7134] hover:underline">legal@rentrightai.com</a>
          </p>
        </div>

        {/* CTA Box */}
        <div className="mt-12 bg-slate-50 p-8 rounded-xl border border-slate-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Have questions about our terms?</h3>
              <p className="text-gray-600">If you need clarification on any aspect of our Terms of Service, please don't hesitate to reach out.</p>
            </div>
            <div className="flex-shrink-0">
              <Link href="/contact">
                <Button variant="outline" className="bg-white border-[#EC7134] text-[#EC7134] hover:bg-[#EC7134]/5">
                  <Info className="w-4 h-4 mr-2" />
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;