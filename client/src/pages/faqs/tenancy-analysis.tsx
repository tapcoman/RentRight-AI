import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  FileText, Shield, Scale, AlertCircle,
  CheckCircle, FileSearch, User, Building,
  Zap, BarChart
} from 'lucide-react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";

export default function TenancyAnalysisFAQ() {
  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative bg-slate-50 text-gray-800 py-16 md:py-24 overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#EC7134]/5 to-transparent"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-[#EC7134]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-[#EC7134]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#EC7134]/10 text-[#EC7134] mb-6 hover:bg-[#EC7134]/20 transition-colors duration-300 cursor-default">
              <FileSearch className="w-4 h-4 mr-2 animate-pulse" style={{ animationDuration: '3s' }} /> FAQ
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-[#1E293B]">
              What is <span className="text-[#EC7134] relative inline-block">
                Tenancy Analysis
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#EC7134]/50 rounded-full"></span>
              </span>?
            </h1>
            <p className="text-xl text-gray-600 mb-8 transition-all duration-500 hover:text-gray-800">
              Learn how RentRight AI helps you understand your rental agreement and protects your rights as a tenant.
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Introduction section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-[#1E293B]">Understanding Tenancy Analysis</h2>
          <div className="prose prose-lg max-w-none text-gray-600">
            <p>
              Tenancy analysis is the comprehensive examination of your lease or tenancy agreement to identify 
              terms that may be unfair, illegal, or potentially problematic for you as a tenant. RentRight AI provides 
              an advanced AI-powered analysis that reviews your entire agreement against current UK housing laws 
              and regulations.
            </p>
            <p>
              Our system goes beyond simple keyword matching - it understands context, identifies problematic clauses, 
              and provides clear explanations of potential issues along with their practical implications.
            </p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:translate-y-[-3px]">
            <div className="w-12 h-12 bg-[#EC7134]/10 rounded-lg flex items-center justify-center mb-4">
              <FileSearch className="w-6 h-6 text-[#EC7134]" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Comprehensive Document Analysis</h3>
            <p className="text-gray-600">
              Our AI technology examines every clause in your tenancy agreement, comparing it against UK housing laws,
              deposit protection regulations, and tenant rights legislation.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:translate-y-[-3px]">
            <div className="w-12 h-12 bg-[#EC7134]/10 rounded-lg flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-[#EC7134]" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Issue Detection</h3>
            <p className="text-gray-600">
              We flag potentially unfair or illegal terms across key areas including deposits, fees, maintenance
              responsibilities, entry rights, renewal terms, and termination conditions.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:translate-y-[-3px]">
            <div className="w-12 h-12 bg-[#EC7134]/10 rounded-lg flex items-center justify-center mb-4">
              <BarChart className="w-6 h-6 text-[#EC7134]" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Traffic Light Rating System</h3>
            <p className="text-gray-600">
              Our clear color-coding system shows you at a glance how fair your agreement is: green for fair terms,
              amber for potentially unfair terms, and red for terms that may violate your legal rights.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:translate-y-[-3px]">
            <div className="w-12 h-12 bg-[#EC7134]/10 rounded-lg flex items-center justify-center mb-4">
              <Scale className="w-6 h-6 text-[#EC7134]" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Practical Explanations</h3>
            <p className="text-gray-600">
              For each issue we identify, we provide a plain-English explanation of why it matters and what the
              potential impact could be on your tenancy.
            </p>
          </div>
        </div>

        {/* How it works section */}
        <div className="bg-slate-50 p-8 rounded-xl mb-12">
          <h2 className="text-2xl font-bold mb-6 text-[#1E293B]">How Tenancy Analysis Works</h2>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#EC7134] text-white flex items-center justify-center mr-4">1</div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Upload Your Document</h3>
                <p className="text-gray-600">Simply upload your lease agreement in PDF, Word, or image format. Your document is securely encrypted and only accessible to you.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#EC7134] text-white flex items-center justify-center mr-4">2</div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Advanced AI Analysis</h3>
                <p className="text-gray-600">Our specialized AI, trained on UK housing law and thousands of lease agreements, thoroughly examines your document clause by clause.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#EC7134] text-white flex items-center justify-center mr-4">3</div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Comprehensive Report Generation</h3>
                <p className="text-gray-600">Receive a detailed analysis highlighting potential issues, explaining legal implications, and providing an overall fairness score.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#EC7134] text-white flex items-center justify-center mr-4">4</div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Access Actionable Insights</h3>
                <p className="text-gray-600">Review easy-to-understand explanations of each issue with practical advice on how to address problematic terms.</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-[#1E293B]">Frequently Asked Questions</h2>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left font-medium">How accurate is your tenancy analysis?</AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-600">
                  RentRight AI achieves 95% accuracy in identifying potential issues when compared to analyses by housing legal professionals. Our system is continuously trained on the latest UK housing legislation, case law and regulatory updates to ensure accuracy. While our AI provides high-quality analysis, it's designed to complement, not replace, professional legal advice for complex situations.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left font-medium">Is my lease agreement secure with you?</AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-600">
                  Absolutely. We employ bank-level encryption to secure all uploaded documents. Your tenancy agreement is only accessible to you, and we never share your data with third parties. Documents are stored in encrypted form and can be deleted at your request at any time.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left font-medium">Can I use your analysis to negotiate with my landlord?</AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-600">
                  Yes! Many tenants use our reports as a basis for constructive discussions with their landlords. The detailed explanations and legal references provide clear, objective information that can help you negotiate fairer terms. Our analyses focus on highlighting actual legal issues rather than creating unnecessary conflict.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left font-medium">What types of lease documents can you analyze?</AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-600">
                  RentRight AI can analyze standard Assured Shorthold Tenancy (AST) agreements, which are the most common type of residential tenancy in the UK. We can process documents in PDF, Word document, or image formats (including photographs of printed agreements). If you have a specialized agreement type, our system will still provide valuable insights, though some context-specific elements may require additional consideration.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left font-medium">How long does the analysis take?</AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-600">
                  Most analyses are completed within 3-4 minutes, depending on the length and complexity of your lease agreement. You'll see real-time progress as our AI works through your document, and you'll be notified as soon as your comprehensive report is ready.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[#EC7134] to-[#D8602A] rounded-xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to analyze your tenancy agreement?</h2>
          <p className="mb-6 text-white/90">Get a comprehensive analysis of your lease in minutes and understand your rights better.</p>
          <Link href="/?section=upload">
            <Button className="bg-white text-[#EC7134] hover:bg-gray-100">
              <FileText className="w-5 h-5 mr-2" />
              Analyze My Agreement Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}