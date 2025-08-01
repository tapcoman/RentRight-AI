import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Contact() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formState)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit the form. Please try again.');
      }
      
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again later.');
      console.error('Contact form submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormState(prev => ({
      ...prev,
      subject: value
    }));
  };

  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative bg-[#FFFAF5] text-gray-800 py-16 overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#EC7134]/5 to-transparent"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-[#EC7134]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-[#EC7134]/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#EC7134]/10 text-[#EC7134] mb-6">
              <Mail className="w-4 h-4 mr-2" /> Get In Touch
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-[#1E293B]">
              We're Here To <span className="text-[#EC7134]">Help</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Have questions about our services or need assistance with your lease analysis?
              Our team is ready to support you.
            </p>
          </div>
        </div>
      </div>

      {/* Contact information and form section */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact info cards */}
            <div className="lg:col-span-1 space-y-6">
              {/* Email */}
              <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="w-10 h-10 rounded-full bg-[#EC7134]/5 flex items-center justify-center mb-2">
                    <Mail className="w-5 h-5 text-[#EC7134]" />
                  </div>
                  <CardTitle className="text-xl">Email Us</CardTitle>
                  <CardDescription>Our team typically responds within 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <a 
                    href="mailto:support@rentrightai.co.uk" 
                    className="text-[#EC7134] hover:text-[#E35F1E] font-medium transition-colors"
                  >
                    support@rentrightai.co.uk
                  </a>
                </CardContent>
              </Card>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Send us a message</h2>
                <p className="text-gray-600 mb-6">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>

                {submitted ? (
                  <div className="bg-green-50 border border-green-100 rounded-lg p-6 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent!</h3>
                    <p className="text-gray-600">
                      Thank you for reaching out. A member of our team will contact you shortly.
                    </p>
                    <Button 
                      className="mt-6 bg-[#EC7134]/50 hover:bg-[#E35F1E] text-white"
                      onClick={() => {
                        setSubmitted(false);
                        setFormState({
                          name: '',
                          email: '',
                          subject: '',
                          message: ''
                        });
                      }}
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-700">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formState.name}
                          onChange={handleChange}
                          placeholder="John Smith"
                          className="border-gray-300 focus:border-[#EC7134] focus:ring focus:ring-[#EC7134]/20 focus:ring-opacity-50"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formState.email}
                          onChange={handleChange}
                          placeholder="john@example.com"
                          className="border-gray-300 focus:border-[#EC7134] focus:ring focus:ring-[#EC7134]/20 focus:ring-opacity-50"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-gray-700">Subject</Label>
                      <Select 
                        onValueChange={handleSelectChange}
                        value={formState.subject}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="support">Technical Support</SelectItem>
                          <SelectItem value="billing">Billing Question</SelectItem>
                          <SelectItem value="feedback">Feedback</SelectItem>
                          <SelectItem value="partnership">Partnership Opportunity</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-gray-700">Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formState.message}
                        onChange={handleChange}
                        placeholder="How can we help you?"
                        rows={6}
                        className="border-gray-300 focus:border-[#EC7134] focus:ring focus:ring-[#EC7134]/20 focus:ring-opacity-50 resize-none"
                        required
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700 text-sm">
                        <p>{error}</p>
                      </div>
                    )}
                    
                    <Button 
                      type="submit" 
                      className="w-full sm:w-auto bg-[#EC7134]/50 hover:bg-[#E35F1E] text-white px-8 py-3"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">
              Find quick answers to common questions about our services.
            </p>
          </div>

          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* FAQ 1 */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How long does analysis take?</h3>
              <p className="text-gray-600">
                Most lease analyses are completed within 3-4 minutes of uploading your document. Complex documents may take slightly longer.
              </p>
            </div>

            {/* FAQ 2 */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Can I use the analysis in legal proceedings?</h3>
              <p className="text-gray-600">
                Our analysis provides valuable insights, but for legal proceedings, we recommend consulting with a qualified solicitor who can provide personalized legal advice.
              </p>
            </div>

            {/* FAQ 3 */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How is my document data handled?</h3>
              <p className="text-gray-600">
                All documents are encrypted in transit and at rest. We only use your documents to provide the analysis service and never share them with third parties.
              </p>
            </div>

            {/* FAQ 4 */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What if I need help with my analysis?</h3>
              <p className="text-gray-600">
                Our customer support team is available to help explain your analysis results. For specific legal advice, we can refer you to qualified housing solicitors.
              </p>
            </div>
          </div>

          <div className="text-center mt-10">
            <p className="text-gray-600">
              Still have questions? Contact us directly for more information.
            </p>
          </div>
        </div>
      </div>

      {/* Map section (placeholder) */}
      <div className="h-80 bg-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#EC7134]/5 to-transparent z-10"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-600 font-medium">Interactive map would be displayed here</p>
        </div>
      </div>
    </div>
  );
}