import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  Shield, Users, Award, GraduationCap, 
  Building, Scale, HeartHandshake, Landmark,
  CheckCircle, UserCheck, LockKeyhole, Zap
} from 'lucide-react';

export default function About() {
  return (
    <div className="bg-white">
      {/* Enhanced Hero section with micro-animations */}
      <div className="relative bg-slate-50 text-gray-800 py-16 md:py-24 overflow-hidden">
        {/* Animated background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#EC7134]/5 to-transparent"></div>
        
        {/* Enhanced decorative elements with animations */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-[#EC7134]/5 rounded-full blur-3xl scale-pulse-animate"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-[#EC7134]/5 rounded-full blur-3xl scale-pulse-animate" style={{ animationDelay: '1s' }}></div>
        
        {/* Removed animated dots for cleaner appearance */}
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#EC7134]/10 text-[#EC7134] mb-6 hover:bg-[#EC7134]/20 transition-colors duration-300 cursor-default">
              <Users className="w-4 h-4 mr-2 animate-pulse" style={{ animationDuration: '3s' }} /> Our Mission
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-[#1E293B]">
              Protecting UK <span className="text-[#EC7134] relative inline-block">
                Tenants
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#EC7134]/50 rounded-full"></span>
              </span> With Accessible Legal Intelligence
            </h1>
            <p className="text-xl text-gray-600 mb-8 transition-all duration-500 hover:text-gray-800">
              At RentRight AI, we're dedicated to empowering tenants through technology, 
              making legal protection accessible and affordable for everyone.
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Our story section with animations */}
      <div className="py-16 md:py-24 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#EC7134]/5/50 rounded-full opacity-30 blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="transition-all duration-300 group hover:translate-x-1">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#EC7134]/5 text-[#EC7134] mb-6 hover:bg-[#EC7134]/10 transition-colors duration-300 cursor-default border-pulse-animate">
                <Users className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" /> Our Story
              </div>
              <h2 className="text-3xl font-bold mb-6 text-gray-900 group-hover:text-[#EC7134] transition-colors duration-300">
                From Legal Challenge to Revolutionary Solution
              </h2>
              <div className="prose prose-lg max-w-none text-gray-700">
                <p className="transition-all duration-300 hover:translate-x-1">
                  RentRight AI was born from my personal frustration as a renter. After facing unfair 
                  lease terms and discovering how expensive legal advice was to challenge them, I 
                  recognized a broken system: quality legal advice was simply out of reach for most renters.
                </p>
                <p className="transition-all duration-300 hover:translate-x-1" style={{ transitionDelay: '50ms' }}>
                  As a current tenant myself, I understand the challenges we face in the UK's rental market. 
                  That's why I created RentRight AI - to democratize access to legal protection for the UK's 4.5 million 
                  private renters through innovative AI technology.
                </p>
                <p className="transition-all duration-300 hover:translate-x-1" style={{ transitionDelay: '100ms' }}>
                  My vision is to help thousands of tenants understand their rights and 
                  challenge unfair terms, making the rental landscape more equitable one lease at a time.
                </p>
              </div>
            </div>
            <div className="relative group">
              {/* Static background circles - removed animations */}
              <div className="absolute -top-6 -left-6 w-64 h-64 bg-[#EC7134]/5 rounded-full"></div>
              <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-[#EC7134]/5 rounded-full"></div>
              
              {/* Card with hover effect */}
              <div className="relative bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100 transition-all duration-500 group-hover:shadow-2xl group-hover:scale-[1.02] group-hover:border-[#EC7134]/20">
                <div className="grid grid-cols-2">
                  <div className="bg-[#EC7134] p-6 text-white transition-all duration-300 hover:bg-[#E35F1E]">
                    <h3 className="text-2xl font-bold mb-2 scale-pulse-animate" style={{ animationDuration: '4s' }}>4.5M+</h3>
                    <p className="text-sm text-white/90">UK private renters we aim to protect</p>
                  </div>
                  <div className="bg-[#D5632C] p-6 text-white transition-all duration-300 hover:bg-[#C05626]">
                    <h3 className="text-2xl font-bold mb-2 scale-pulse-animate" style={{ animationDuration: '4s', animationDelay: '0.5s' }}>£500+</h3>
                    <p className="text-sm text-white/90">Potential savings on legal consultation</p>
                  </div>
                  <div className="bg-[#D5632C] p-6 text-white transition-all duration-300 hover:bg-[#C05626]">
                    <h3 className="text-2xl font-bold mb-2 scale-pulse-animate" style={{ animationDuration: '4s', animationDelay: '1s' }}>24/7</h3>
                    <p className="text-sm text-white/90">Instant access to lease analysis</p>
                  </div>
                  <div className="bg-[#EC7134] p-6 text-white transition-all duration-300 hover:bg-[#E35F1E]">
                    <h3 className="text-2xl font-bold mb-2 scale-pulse-animate" style={{ animationDuration: '4s', animationDelay: '1.5s' }}>95%</h3>
                    <p className="text-sm text-white/90">Accuracy in identifying issues</p>
                  </div>
                </div>
                <div className="p-6 bg-white hover:bg-[#EC7134]/5 transition-colors duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#EC7134]/20 flex items-center justify-center text-[#EC7134] text-xs font-bold pulse-animate">JD</div>
                    <span className="text-sm text-gray-500">Founder</span>
                  </div>
                  <blockquote className="italic text-gray-700 transition-all duration-300 hover:translate-x-1">
                    "I believe that understanding your rights shouldn't cost a fortune. I've built 
                    RentRight AI to be the tool I wish I had during my own rental experiences as a tenant."
                  </blockquote>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Our values section with animations */}
      <div className="py-16 bg-gray-50 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-20 left-10 w-80 h-80 bg-[#EC7134]/10/50 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#EC7134]/10/50 rounded-full opacity-20 blur-3xl"></div>
        
        {/* Removed floating animated dots for cleaner appearance */}
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#EC7134]/5 text-[#EC7134] mb-6 hover:bg-[#EC7134]/10 transition-colors duration-300 cursor-default border-pulse-animate">
              <Award className="w-4 h-4 mr-2 animate-pulse" style={{ animationDuration: '3s' }} /> Our Values
            </div>
            <h2 className="text-3xl font-bold mb-6 text-gray-900 relative">
              The Principles That Guide Us
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-[#EC7134]/50/30 rounded-full"></div>
            </h2>
            <p className="text-xl text-gray-600 transition-all duration-500 hover:text-gray-800">
              Our mission is supported by core values that shape everything we do, 
              from product development to customer service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Value 1 - Enhanced with animations */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:translate-y-[-5px] group">
              {/* Background glow effect on hover */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#EC7134]/5 to-[#EC7134]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="w-12 h-12 bg-[#EC7134]/5 rounded-lg flex items-center justify-center mb-5 group-hover:bg-[#EC7134]/10 transition-colors duration-300 pulse-animate">
                <Scale className="w-6 h-6 text-[#EC7134] group-hover:text-[#EC7134] transition-colors duration-300 group-hover:scale-110 transform" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-[#EC7134] transition-colors duration-300">Accessibility</h3>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                Legal protection should be available to everyone, regardless of income or background. 
                We make complex legal concepts simple and affordable.
              </p>
            </div>

            {/* Value 2 - Enhanced with animations */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:translate-y-[-5px] group">
              <div className="w-12 h-12 bg-[#EC7134]/5 rounded-lg flex items-center justify-center mb-5 group-hover:bg-[#EC7134]/10 transition-colors duration-300 pulse-animate" style={{ animationDelay: '0.2s' }}>
                <Shield className="w-6 h-6 text-[#EC7134] group-hover:text-[#EC7134] transition-colors duration-300 group-hover:scale-110 transform" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-[#EC7134] transition-colors duration-300">Accuracy</h3>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                Our AI is continuously trained on the latest UK housing legislation and case law, 
                ensuring advice that's reliable and up-to-date.
              </p>
            </div>

            {/* Value 3 - Enhanced with animations */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:translate-y-[-5px] group">
              <div className="w-12 h-12 bg-[#EC7134]/5 rounded-lg flex items-center justify-center mb-5 group-hover:bg-[#EC7134]/10 transition-colors duration-300 pulse-animate" style={{ animationDelay: '0.4s' }}>
                <HeartHandshake className="w-6 h-6 text-[#EC7134] group-hover:text-[#EC7134] transition-colors duration-300 group-hover:scale-110 transform" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-[#EC7134] transition-colors duration-300">Advocacy</h3>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                We actively support tenants' rights and work towards a fair rental market through 
                education, technology, and raising awareness.
              </p>
            </div>

            {/* Value 4 - Enhanced with animations */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:translate-y-[-5px] group">
              <div className="w-12 h-12 bg-[#EC7134]/5 rounded-lg flex items-center justify-center mb-5 group-hover:bg-[#EC7134]/10 transition-colors duration-300 pulse-animate" style={{ animationDelay: '0.6s' }}>
                <GraduationCap className="w-6 h-6 text-[#EC7134] group-hover:text-[#EC7134] transition-colors duration-300 group-hover:scale-110 transform" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-[#EC7134] transition-colors duration-300">Education</h3>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                Beyond analysis, we believe in empowering tenants through knowledge, helping them 
                understand their rights for current and future tenancies.
              </p>
            </div>

            {/* Value 5 - Enhanced with animations */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:translate-y-[-5px] group">
              <div className="w-12 h-12 bg-[#EC7134]/5 rounded-lg flex items-center justify-center mb-5 group-hover:bg-[#EC7134]/10 transition-colors duration-300 pulse-animate" style={{ animationDelay: '0.8s' }}>
                <LockKeyhole className="w-6 h-6 text-[#EC7134] group-hover:text-[#EC7134] transition-colors duration-300 group-hover:scale-110 transform" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-[#EC7134] transition-colors duration-300">Privacy</h3>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                Your documents contain sensitive information. We employ robust encryption and security 
                measures to ensure your data remains private and protected.
              </p>
            </div>

            {/* Value 6 - Enhanced with animations */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:translate-y-[-5px] group">
              <div className="w-12 h-12 bg-[#EC7134]/5 rounded-lg flex items-center justify-center mb-5 group-hover:bg-[#EC7134]/10 transition-colors duration-300 pulse-animate" style={{ animationDelay: '1s' }}>
                <Zap className="w-6 h-6 text-[#EC7134] group-hover:text-[#EC7134] transition-colors duration-300 group-hover:scale-110 transform" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-[#EC7134] transition-colors duration-300">Innovation</h3>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                We continuously refine our AI algorithms and user experience based on feedback, 
                legal updates, and technological advancements.
              </p>
            </div>
          </div>
        </div>
      </div>



      {/* Enhanced CTA section with animations */}
      <div className="bg-[#111827] py-16 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-900/20 to-transparent"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#EC7134]/50/5 rounded-full blur-3xl scale-pulse-animate"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#EC7134]/50/5 rounded-full blur-3xl scale-pulse-animate" style={{ animationDelay: '1.5s' }}></div>
        
        {/* Removed animated floating dots for cleaner appearance */}
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6 relative inline-block group">
              Ready to protect your tenancy rights?
              <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[#EC7134]/50/50 rounded-full scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500"></div>
            </h2>
            <p className="text-xl text-gray-300 mb-8 transition-all duration-300 hover:text-white">
              Upload your lease today and get professional AI analysis in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/#upload-section">
                <Button className="bg-[#EC7134]/50 hover:bg-sky-600 text-white px-8 py-6 text-lg group relative overflow-hidden cta-button-hover gradient-transition">
                  <span className="relative z-10 transition-transform duration-300 group-hover:scale-110">
                    Analyze My Lease
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-sky-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-0 left-0 w-full h-full bg-[#111827]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" className="border-gray-600 text-gray-200 hover:bg-gray-800 hover:text-white px-8 py-6 text-lg transition-all duration-300 hover:border-sky-400 group cta-button-hover gradient-transition">
                  <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">
                    Contact Me
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}