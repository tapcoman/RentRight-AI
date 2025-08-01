import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  FileText, Shield, Home, KeyRound,
  ClipboardList, Wrench, Calendar, Coins,
  MessageSquare, Users
} from 'lucide-react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CommonLeaseFAQs() {
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
              <ClipboardList className="w-4 h-4 mr-2 animate-pulse" style={{ animationDuration: '3s' }} /> FAQ
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-[#1E293B]">
              Common <span className="text-[#EC7134] relative inline-block">
                Lease FAQs
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#EC7134]/50 rounded-full"></span>
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 transition-all duration-500 hover:text-gray-800">
              Answers to the most common questions about UK residential tenancy agreements
            </p>
          </div>
        </div>
      </div>

      {/* Main FAQ content */}
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Introduction section */}
        <div className="mb-12">
          <div className="prose prose-lg max-w-none text-gray-600">
            <p>
              Navigating your tenancy agreement can be confusing. We've compiled answers to the most frequently asked questions 
              about UK residential leases to help you understand your rights and responsibilities as a tenant.
            </p>
          </div>
        </div>

        {/* FAQ Categories */}
        <Tabs defaultValue="general" className="w-full mb-12">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-8">
            <TabsTrigger value="general" className="text-sm">General Questions</TabsTrigger>
            <TabsTrigger value="deposits" className="text-sm">Deposits & Fees</TabsTrigger>
            <TabsTrigger value="repairs" className="text-sm">Repairs & Maintenance</TabsTrigger>
            <TabsTrigger value="ending" className="text-sm">Ending a Tenancy</TabsTrigger>
          </TabsList>

          {/* General Questions Tab Content */}
          <TabsContent value="general">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-2xl font-bold mb-6 text-[#1E293B] flex items-center">
                <Home className="mr-2 text-[#EC7134]" /> General Lease Questions
              </h2>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="general-1">
                  <AccordionTrigger className="text-left font-medium">What is an Assured Shorthold Tenancy (AST)?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600 mb-2">
                      An Assured Shorthold Tenancy (AST) is the most common type of tenancy agreement in the UK private rental sector. It typically offers:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
                      <li>Initial fixed term (usually 6 or 12 months)</li>
                      <li>Protection for your deposit in a government-approved scheme</li>
                      <li>Legal protection against unfair eviction</li>
                      <li>Specific rights and responsibilities for both landlords and tenants</li>
                    </ul>
                    <p className="text-gray-600 mt-2">
                      Most private rentals in the UK are ASTs unless specifically exempted (such as lodger agreements where you live with your landlord).
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="general-2">
                  <AccordionTrigger className="text-left font-medium">Do I need a written tenancy agreement?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      While verbal agreements can be legally binding, a written tenancy agreement is strongly recommended as it provides clear evidence of the terms you and your landlord agreed to. A written agreement helps prevent misunderstandings and disputes by clearly outlining:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li>The amount of rent and when it's due</li>
                      <li>The deposit amount and protection scheme</li>
                      <li>The length of the tenancy</li>
                      <li>Repair and maintenance responsibilities</li>
                      <li>Any restrictions (e.g., on pets or alterations)</li>
                    </ul>
                    <p className="text-gray-600 mt-2">
                      Without a written agreement, you'll still have basic legal rights, but specific terms may be harder to prove if disputes arise.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="general-3">
                  <AccordionTrigger className="text-left font-medium">Can my landlord increase the rent?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      Your landlord can only increase rent:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li><strong>During a fixed term:</strong> Only if your agreement contains a rent review clause that allows increases, or if you agree to the increase</li>
                      <li><strong>After a fixed term (periodic tenancy):</strong> Usually once per year, with proper notice (typically at least one month)</li>
                    </ul>
                    <p className="text-gray-600 mt-2">
                      Rent increases must be fair and in line with local market rates. If you believe an increase is excessive, you can:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li>Negotiate with your landlord</li>
                      <li>Apply to the First-tier Tribunal (Property Chamber) for a review</li>
                      <li>Consider moving if the new rent is unaffordable</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="general-4">
                  <AccordionTrigger className="text-left font-medium">Am I allowed to sublet my rental property?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      Subletting depends entirely on your tenancy agreement terms:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li>Most standard tenancy agreements prohibit subletting without the landlord's written permission</li>
                      <li>Subletting without permission when prohibited can be grounds for eviction</li>
                      <li>Even short-term arrangements like Airbnb typically count as subletting</li>
                    </ul>
                    <p className="text-gray-600 mt-2">
                      If you want to sublet, always:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li>Check your agreement first</li>
                      <li>Request written permission from your landlord</li>
                      <li>Get any agreed subletting arrangement in writing</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="general-5">
                  <AccordionTrigger className="text-left font-medium">Can my landlord enter the property whenever they want?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      No. Your landlord must respect your right to "quiet enjoyment" of the property. This means:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li>They must give at least 24 hours' written notice before visiting</li>
                      <li>Visits should be at reasonable times (usually during business hours)</li>
                      <li>They should have a legitimate reason (e.g., inspections, repairs)</li>
                      <li>You can refuse entry if the timing is inconvenient (but should offer an alternative)</li>
                    </ul>
                    <p className="text-gray-600 mt-2">
                      Landlords can only enter without permission in genuine emergencies (e.g., fire, flood, gas leak). Regular unannounced visits or excessive visits can constitute harassment.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* Deposits & Fees Tab Content */}
          <TabsContent value="deposits">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-2xl font-bold mb-6 text-[#1E293B] flex items-center">
                <Coins className="mr-2 text-[#EC7134]" /> Deposits & Fees
              </h2>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="deposits-1">
                  <AccordionTrigger className="text-left font-medium">How much deposit can my landlord charge?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      Under the Tenant Fees Act 2019, deposit amounts are capped at:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li><strong>5 weeks' rent:</strong> For properties with annual rent below £50,000</li>
                      <li><strong>6 weeks' rent:</strong> For properties with annual rent of £50,000 or more</li>
                    </ul>
                    <p className="text-gray-600 mt-2">
                      These limits apply to all assured shorthold tenancies, student accommodation, and lodger agreements created or renewed after June 1, 2019.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="deposits-2">
                  <AccordionTrigger className="text-left font-medium">When should my deposit be protected?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      Your landlord must protect your deposit in a government-approved scheme within 30 days of receiving it. They must also provide you with the following information within the same timeframe:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li>The name and contact details of the deposit protection scheme</li>
                      <li>The deposit protection certificate or confirmation</li>
                      <li>Information about how to apply for the deposit's return</li>
                      <li>Explanation of the dispute resolution process</li>
                      <li>Reasons why they might keep part of the deposit</li>
                    </ul>
                    <p className="text-gray-600 mt-2">
                      If your landlord fails to protect your deposit or provide this information within 30 days, they may:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li>Be ordered to repay you 1-3 times the deposit amount in compensation</li>
                      <li>Be unable to use a Section 21 notice to evict you</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="deposits-3">
                  <AccordionTrigger className="text-left font-medium">What fees can my landlord or letting agent charge me?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      Since the Tenant Fees Act 2019, landlords and agents can only charge tenants for:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li>Rent</li>
                      <li>Refundable tenancy deposit (capped at 5-6 weeks' rent)</li>
                      <li>Refundable holding deposit (capped at 1 week's rent)</li>
                      <li>Changes to the tenancy requested by the tenant (capped at £50 unless higher costs can be proven)</li>
                      <li>Early termination fees when requested by the tenant</li>
                      <li>Default fees for late rent payment (after 14 days) or lost keys (reasonable costs only)</li>
                      <li>Utilities, Council Tax, TV licence, and communication services if specified in the tenancy agreement</li>
                    </ul>
                    <p className="text-gray-600 mt-2">
                      The following fees are <strong>prohibited</strong>:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li>Admin fees</li>
                      <li>Reference fees</li>
                      <li>Credit check fees</li>
                      <li>Inventory fees</li>
                      <li>Cleaning fees (except end-of-tenancy if specified in the agreement)</li>
                      <li>Renewal fees</li>
                      <li>Check-out fees</li>
                    </ul>
                    <p className="text-gray-600 mt-2">
                      Landlords or agents charging prohibited fees can be fined and may have to return the fees.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="deposits-4">
                  <AccordionTrigger className="text-left font-medium">How do I get my deposit back at the end of my tenancy?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      To maximize your chances of getting your full deposit back:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li>Give proper notice as specified in your agreement</li>
                      <li>Clean the property thoroughly (consider professional cleaning if required by your agreement)</li>
                      <li>Fix any minor damage you caused beyond normal wear and tear</li>
                      <li>Take detailed photos of the property's condition when you leave</li>
                      <li>Return all keys</li>
                      <li>Attend the final inspection if possible</li>
                      <li>Provide a forwarding address for deposit return</li>
                    </ol>
                    <p className="text-gray-600 mt-2">
                      Your landlord should return your deposit within 10 days of agreeing on the amount. If there's a dispute:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li>Request a detailed breakdown of any deductions</li>
                      <li>Provide evidence to challenge unfair deductions</li>
                      <li>Use the free dispute resolution service provided by your deposit protection scheme</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* Repairs & Maintenance Tab Content */}
          <TabsContent value="repairs">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-2xl font-bold mb-6 text-[#1E293B] flex items-center">
                <Wrench className="mr-2 text-[#EC7134]" /> Repairs & Maintenance
              </h2>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="repairs-1">
                  <AccordionTrigger className="text-left font-medium">Who is responsible for repairs in my rented property?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600 mb-2">
                      Repair responsibilities are divided between landlords and tenants:
                    </p>
                    <p className="text-gray-600 font-medium mt-3">Landlord responsibilities (by law):</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
                      <li>Structure and exterior of the property (walls, roof, foundations, etc.)</li>
                      <li>Basins, sinks, baths, toilets and plumbing</li>
                      <li>Heating and hot water systems</li>
                      <li>Gas appliances, pipes, flues and ventilation</li>
                      <li>Electrical wiring and fixed electrical installations</li>
                      <li>Common areas (stairways, halls, etc. in buildings with multiple occupants)</li>
                      <li>Repairing damage caused during repair work</li>
                    </ul>
                    <p className="text-gray-600 font-medium mt-3">Tenant responsibilities (typically):</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
                      <li>Minor maintenance (replacing light bulbs, smoke alarm batteries)</li>
                      <li>Keeping the property clean</li>
                      <li>Garden maintenance (unless stated otherwise)</li>
                      <li>Minor repairs specified in your agreement</li>
                      <li>Repairing any damage you cause</li>
                    </ul>
                    <p className="text-gray-600 mt-2">
                      Your specific agreement may vary, but landlords cannot legally transfer their statutory repair responsibilities to tenants, regardless of what the agreement says.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="repairs-2">
                  <AccordionTrigger className="text-left font-medium">How do I report repairs to my landlord?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      For effective repair reporting:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li><strong>Report promptly:</strong> Inform your landlord as soon as you notice an issue</li>
                      <li><strong>Report in writing:</strong> Email or text creates a record (even if you call first)</li>
                      <li><strong>Be specific:</strong> Clearly describe the problem, when it started, and its impact</li>
                      <li><strong>Provide evidence:</strong> Include photos or videos when possible</li>
                      <li><strong>Suggest access times:</strong> Offer convenient times for inspection/repairs</li>
                      <li><strong>Keep records:</strong> Save all communications about the repair</li>
                    </ol>
                    <p className="text-gray-600 mt-2">
                      For urgent issues (like water leaks or no heating in winter), call your landlord or managing agent immediately, then follow up in writing.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="repairs-3">
                  <AccordionTrigger className="text-left font-medium">What if my landlord won't make necessary repairs?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      If your landlord ignores repair requests:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li><strong>Send a formal letter:</strong> Clearly state the issues, previous communications, and a reasonable deadline for repairs</li>
                      <li><strong>Contact environmental health:</strong> Your local council's environmental health department can inspect for hazards and enforce repairs</li>
                      <li><strong>Consider these options:</strong>
                        <ul className="list-disc list-inside ml-5 mt-1 text-gray-600">
                          <li>Withholding rent (risky - only in specific circumstances and with legal advice)</li>
                          <li>Requesting repairs through court action</li>
                          <li>Making your own repairs and deducting costs (only with legal advice)</li>
                          <li>Claiming compensation for damages or inconvenience</li>
                        </ul>
                      </li>
                    </ol>
                    <p className="text-gray-600 mt-2">
                      Always seek professional advice before taking action that might breach your tenancy agreement. Organizations like Shelter, Citizens Advice, or a housing solicitor can provide guidance.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="repairs-4">
                  <AccordionTrigger className="text-left font-medium">Can I make improvements or alterations to my rented property?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      Most tenancy agreements require landlord permission before making alterations or improvements. Here's how to approach this:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li><strong>Check your agreement:</strong> See what it says about alterations</li>
                      <li><strong>Request written permission:</strong> Explain the changes you want to make in detail</li>
                      <li><strong>Provide plans/specifications:</strong> Include these with your request</li>
                      <li><strong>Agree on conditions:</strong> Discuss whether you'll need to restore the property to its original condition when you leave</li>
                      <li><strong>Get it in writing:</strong> Ensure any permission is documented</li>
                    </ol>
                    <p className="text-gray-600 mt-2">
                      Generally permitted with notification (but check your agreement):
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
                      <li>Minor decorative changes (e.g., putting up pictures with appropriate hooks)</li>
                      <li>Replacing light bulbs or shower heads</li>
                      <li>Adding removable furniture or free-standing appliances</li>
                    </ul>
                    <p className="text-gray-600 mt-2">
                      Usually requiring permission:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
                      <li>Painting or wallpapering</li>
                      <li>Installing fixed appliances</li>
                      <li>Changing flooring</li>
                      <li>Any structural changes</li>
                      <li>Garden alterations</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* Ending a Tenancy Tab Content */}
          <TabsContent value="ending">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-2xl font-bold mb-6 text-[#1E293B] flex items-center">
                <Calendar className="mr-2 text-[#EC7134]" /> Ending a Tenancy
              </h2>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="ending-1">
                  <AccordionTrigger className="text-left font-medium">How can I end my tenancy early?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      If you want to leave before your fixed term ends, you have several options:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li><strong>Break clause:</strong> Check if your agreement has a break clause that allows early termination after a certain period (e.g., 6 months)</li>
                      <li><strong>Negotiate with your landlord:</strong> They might agree to end the tenancy early, especially if you can find a replacement tenant</li>
                      <li><strong>Assignment:</strong> Transfer the tenancy to someone else (requires landlord agreement)</li>
                      <li><strong>Surrender:</strong> Mutually agree with your landlord to end the tenancy (get this in writing)</li>
                    </ol>
                    <p className="text-gray-600 mt-2">
                      Important considerations:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
                      <li>You may be liable for rent until a new tenant is found or until the fixed term ends</li>
                      <li>Your landlord must make reasonable efforts to find a new tenant to minimize your costs</li>
                      <li>Any agreement to end early should be documented in writing</li>
                      <li>Breaking a lease without agreement could impact future rental references</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="ending-2">
                  <AccordionTrigger className="text-left font-medium">How much notice do I need to give to end my tenancy?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      Notice requirements depend on your tenancy type and situation:
                    </p>
                    <p className="text-gray-600 font-medium mt-3">Fixed-term tenancy:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
                      <li>You typically don't need to give notice if you're leaving on the last day of the fixed term</li>
                      <li>If you want to leave before the fixed term ends, check for a break clause</li>
                      <li>If you stay beyond the fixed term, it becomes a periodic tenancy</li>
                    </ul>
                    
                    <p className="text-gray-600 font-medium mt-3">Periodic tenancy:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
                      <li>Standard notice is at least one month (for monthly rent payments)</li>
                      <li>Notice must end on the last day of a rental period unless your agreement says otherwise</li>
                      <li>Give notice in writing, even if your agreement doesn't require it</li>
                    </ul>
                    
                    <p className="text-gray-600 mt-3">
                      Always check your tenancy agreement as it may specify different notice requirements. Giving notice in writing provides proof and clarity for both parties.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="ending-3">
                  <AccordionTrigger className="text-left font-medium">When can my landlord evict me?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      Landlords can only evict you legally through specific processes:
                    </p>
                    <p className="text-gray-600 font-medium mt-3">Section 21 'no-fault' eviction:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
                      <li>Can only be used after a fixed term ends or during a periodic tenancy</li>
                      <li>Requires at least 2 months' written notice</li>
                      <li>Cannot be used in the first 4 months of the original tenancy</li>
                      <li>Cannot be used if the landlord hasn't protected your deposit</li>
                      <li>Cannot be used if the property requires a license but doesn't have one</li>
                      <li>Invalid if the landlord hasn't provided an EPC, gas safety certificate, and 'How to Rent' guide</li>
                    </ul>
                    
                    <p className="text-gray-600 font-medium mt-3">Section 8 eviction (for specific reasons):</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
                      <li>Used when tenants breach the agreement (e.g., rent arrears, property damage)</li>
                      <li>Notice period varies from 2 weeks to 2 months depending on the grounds</li>
                      <li>Landlord must specify which grounds they're using</li>
                      <li>Some grounds are mandatory (court must order possession), others are discretionary</li>
                    </ul>
                    
                    <p className="text-gray-600 mt-3">
                      Important: A notice is not an eviction. If you don't leave after receiving notice, the landlord must apply to court for a possession order. It's illegal for landlords to evict you without a court order (e.g., by changing locks or removing belongings).
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="ending-4">
                  <AccordionTrigger className="text-left font-medium">What happens to my deposit when I move out?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      After you give notice and move out:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li><strong>Final inspection:</strong> Your landlord/agent should inspect the property against the inventory</li>
                      <li><strong>Deduction proposal:</strong> They should inform you of any proposed deductions with evidence</li>
                      <li><strong>Negotiation:</strong> You can agree or dispute these deductions</li>
                      <li><strong>Return timeline:</strong> Your deposit should be returned within 10 days of agreeing on the amount</li>
                    </ol>
                    <p className="text-gray-600 mt-2">
                      If there's a dispute:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li>Provide evidence of the property's condition (move-out photos, inventory, repair receipts)</li>
                      <li>Clearly explain why you disagree with specific deductions</li>
                      <li>Use the free dispute resolution service from your deposit protection scheme</li>
                      <li>Remember that normal wear and tear cannot be deducted from your deposit</li>
                    </ol>
                    <p className="text-gray-600 mt-2">
                      To maximize your deposit return, thoroughly clean the property, fix any damage you caused, and take detailed photos when you leave.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[#EC7134] to-[#D8602A] rounded-xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Concerned about terms in your tenancy agreement?</h2>
          <p className="mb-6 text-white/90">Upload your lease for a thorough analysis that highlights potential issues and unfair terms.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/?section=upload">
              <Button className="bg-white text-[#EC7134] hover:bg-gray-100">
                <FileText className="w-5 h-5 mr-2" />
                Analyze My Agreement Now
              </Button>
            </Link>
            <Link href="/tenant-rights">
              <Button className="bg-white/20 text-white hover:bg-white/30">
                <Shield className="w-5 h-5 mr-2" />
                Learn About Tenant Rights
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}