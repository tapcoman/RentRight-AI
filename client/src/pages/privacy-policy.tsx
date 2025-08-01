import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Shield, LockKeyhole, FileText, Info } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative bg-[#FFFAF5] text-gray-800 py-16 md:py-20 overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#EC7134]/5 to-transparent"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-[#EC7134]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-[#EC7134]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#EC7134]/10 text-[#EC7134] mb-6 hover:bg-[#EC7134]/20 transition-colors duration-300 cursor-default">
              <LockKeyhole className="w-4 h-4 mr-2" /> Data Protection
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-[#1E293B]">
              Privacy <span className="text-[#EC7134] relative inline-block">
                Policy
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#EC7134]/50 rounded-full"></span>
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 transition-all duration-500 hover:text-gray-800">
              How we protect your data and respect your privacy while providing our services
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
            RentRight AI ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
          </p>
          <p>
            We take your privacy seriously and have designed our services with data protection in mind. Please read this policy carefully to understand our practices regarding your personal data.
          </p>

          <h2>Information We Collect</h2>
          
          <h3>Information You Provide</h3>
          <p>We may collect the following types of information that you voluntarily provide to us:</p>
          <ul>
            <li><strong>Account Information:</strong> When you create an account, we collect your email address and authentication information.</li>
            <li><strong>Document Content:</strong> When you upload tenancy agreements or other documents for analysis, we process the content of these documents.</li>
            <li><strong>Communication Information:</strong> Information you provide when you contact us for customer support or other inquiries.</li>
            <li><strong>Payment Information:</strong> When you make a purchase, our payment processor collects payment details. We do not store complete credit card information on our servers.</li>
          </ul>

          <h3>Information Automatically Collected</h3>
          <p>When you use our website, we may automatically collect certain information, including:</p>
          <ul>
            <li><strong>Device Information:</strong> Information about your device, including IP address, browser type, operating system, and device identifiers.</li>
            <li><strong>Usage Data:</strong> Information about how you interact with our website, such as pages visited, time spent on pages, and clicks.</li>
            <li><strong>Cookies and Similar Technologies:</strong> We use cookies and similar tracking technologies to collect information about your browsing activities. See our Cookie Policy section for more details.</li>
          </ul>

          <h2>How We Use Your Information</h2>
          <p>We use the information we collect for various purposes, including:</p>
          <ul>
            <li>To provide and maintain our services, including processing your documents for analysis</li>
            <li>To authenticate users and prevent fraud</li>
            <li>To process transactions and send transaction notifications</li>
            <li>To respond to your inquiries and provide customer support</li>
            <li>To send administrative information, such as updates to our terms or privacy policy</li>
            <li>To improve our website and services</li>
            <li>To analyze usage patterns and trends</li>
            <li>To protect our legal rights and comply with legal obligations</li>
          </ul>

          <h2>Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information, including:
          </p>
          <ul>
            <li>Encryption of data in transit and at rest</li>
            <li>Secure processing of document content</li>
            <li>Regular security assessments and testing</li>
            <li>Access controls and authentication mechanisms</li>
            <li>Secure deletion of data when no longer needed</li>
          </ul>
          <p>
            While we take reasonable steps to protect your data, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security of your information.
          </p>

          <h2>Document Storage and Retention</h2>
          <p>
            Documents you upload for analysis are stored securely and retained only as long as necessary to provide our services. Specifically:
          </p>
          <ul>
            <li>Documents are stored in encrypted form</li>
            <li>Documents are automatically deleted 30 days after analysis unless you specifically request longer retention</li>
            <li>You can manually delete your documents at any time through your account settings</li>
            <li>Analysis results are stored separately from the original documents</li>
          </ul>

          <h2>Cookie Policy</h2>
          <p>
            Our website uses cookies and similar tracking technologies to collect information about your activities. Cookies are small text files stored on your device when you visit websites.
          </p>
          
          <h3>Types of Cookies We Use</h3>
          <ul>
            <li><strong>Strictly Necessary Cookies:</strong> These cookies are essential for the website to function properly and cannot be disabled.</li>
            <li><strong>Functional Cookies:</strong> These enhance functionality by remembering your preferences and settings.</li>
            <li><strong>Analytics Cookies:</strong> These help us understand how visitors interact with our website, allowing us to improve the user experience.</li>
            <li><strong>Marketing Cookies:</strong> These track your online activity to help advertisers deliver more relevant advertising or to limit how many times you see an ad.</li>
          </ul>

          <h3>Cookie Management</h3>
          <p>
            You can manage your cookie preferences through our Cookie Consent tool available on our website. You can also control cookies through your browser settings, although blocking some types of cookies may impact your experience of the site.
          </p>

          <h2>Your Rights</h2>
          <p>
            Depending on your location, you may have certain rights regarding your personal information, including:
          </p>
          <ul>
            <li>The right to access personal information we hold about you</li>
            <li>The right to request correction of inaccurate information</li>
            <li>The right to request deletion of your information</li>
            <li>The right to restrict or object to processing</li>
            <li>The right to data portability</li>
            <li>The right to withdraw consent</li>
          </ul>
          <p>
            To exercise these rights, please contact us using the information provided in the "Contact Us" section.
          </p>

          <h2>Children's Privacy</h2>
          <p>
            Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
          </p>

          <h2>Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. We encourage you to review this Privacy Policy periodically.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:
          </p>
          <p>
            Email: <a href="mailto:privacy@rentrightai.com" className="text-[#EC7134] hover:underline">privacy@rentrightai.com</a>
          </p>
        </div>

        {/* CTA Box */}
        <div className="mt-12 bg-[#FFFAF5] p-8 rounded-xl border border-[#F3EEE4]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Have questions about our privacy practices?</h3>
              <p className="text-gray-600">We're committed to transparency and are happy to address any concerns you may have.</p>
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

export default PrivacyPolicy;