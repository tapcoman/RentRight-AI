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

export default function CommonTenancyAgreementFAQs() {
  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative bg-[#FFFAF5] text-gray-800 py-16 md:py-24 overflow-hidden">
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
                Tenancy Agreement FAQs
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
              about UK residential tenancy agreements to help you understand your rights and responsibilities as a tenant.
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
                <Home className="mr-2 text-[#EC7134]" /> General Tenancy Agreement Questions
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
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li><strong>Before moving out:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>Clean the property thoroughly</li>
                          <li>Remove all belongings</li>
                          <li>Take dated photos of the property's condition</li>
                          <li>Arrange a check-out inspection with your landlord if possible</li>
                          <li>Provide a forwarding address</li>
                        </ul>
                      </li>
                      <li><strong>After moving out:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>Request your deposit back in writing</li>
                          <li>Your landlord must return your deposit within 10 days of agreeing how much will be returned</li>
                          <li>If there's a dispute, use the free dispute resolution service offered by your deposit protection scheme</li>
                        </ul>
                      </li>
                    </ul>
                    <p className="text-gray-600 mt-2">
                      Landlords can make deductions for:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li>Damage beyond normal wear and tear</li>
                      <li>Missing items from the inventory</li>
                      <li>Unpaid rent or bills</li>
                      <li>Cleaning costs (if the property was left in worse condition than at the start)</li>
                    </ul>
                    <p className="text-gray-600 mt-2">
                      They cannot deduct for normal wear and tear, which is expected over time.
                    </p>
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
                  <AccordionTrigger className="text-left font-medium">Who is responsible for repairs in a rental property?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      Repair responsibilities are generally divided as follows:
                    </p>
                    <p className="text-gray-600 mt-2">
                      <strong>Landlord's responsibilities:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-1 ml-2">
                      <li>Structure and exterior of the building (roof, walls, windows, doors)</li>
                      <li>Plumbing, drains, guttering</li>
                      <li>Electrical wiring and gas pipes</li>
                      <li>Heating and hot water systems</li>
                      <li>Bathroom fixtures (toilet, bath, sink)</li>
                      <li>Common areas in shared buildings (staircases, hallways)</li>
                      <li>Safety compliance (gas, electrical, fire)</li>
                    </ul>
                    <p className="text-gray-600 mt-2">
                      <strong>Tenant's responsibilities:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-1 ml-2">
                      <li>Minor maintenance (changing light bulbs, replacing batteries in smoke alarms)</li>
                      <li>Keeping the property clean</li>
                      <li>Garden maintenance (if specified in the agreement)</li>
                      <li>Repairing damage caused by you or your guests</li>
                      <li>Using appliances and fixtures properly</li>
                    </ul>
                    <p className="text-gray-600 mt-2">
                      Your specific tenancy agreement may contain additional details about maintenance responsibilities, but a landlord cannot legally transfer their basic repair obligations to the tenant.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="repairs-2">
                  <AccordionTrigger className="text-left font-medium">How do I report repairs to my landlord?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      Follow these steps when reporting repairs:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li><strong>Report immediately:</strong> Don't delay reporting issues as this could make them worse</li>
                      <li><strong>Write it down:</strong> Email or text is better than calling as it creates a record</li>
                      <li><strong>Be specific:</strong> Describe the problem in detail, including:
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>What the issue is</li>
                          <li>When it started</li>
                          <li>Whether it's getting worse</li>
                          <li>Any safety concerns</li>
                        </ul>
                      </li>
                      <li><strong>Include photos:</strong> Visual evidence helps clarify the issue</li>
                      <li><strong>Keep copies:</strong> Save all communications and repair requests</li>
                    </ol>
                    <p className="text-gray-600 mt-2">
                      If your landlord doesn't respond within a reasonable time (usually 14 days for non-emergencies, or 24 hours for urgent issues affecting health and safety), you can:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-1 ml-2">
                      <li>Contact your local council's environmental health department</li>
                      <li>Use the free dispute resolution service offered by your local council</li>
                      <li>In serious cases, seek legal advice about taking action</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="repairs-3">
                  <AccordionTrigger className="text-left font-medium">Can I withhold rent if repairs aren't done?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      <strong>Withholding rent is generally not recommended</strong> as it can lead to eviction proceedings. Instead:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li>Follow the proper repair reporting process first</li>
                      <li>If your landlord fails to respond, contact your local council's environmental health department</li>
                      <li>Consider using the council's dispute resolution service</li>
                      <li>For serious disrepair affecting health and safety, a council can:
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>Issue an improvement notice to your landlord</li>
                          <li>Carry out emergency repairs and bill your landlord</li>
                          <li>Take legal action against your landlord</li>
                        </ul>
                      </li>
                    </ul>
                    <p className="text-gray-600 mt-2">
                      In exceptional circumstances, you might consider:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-1 ml-2">
                      <li>Arranging and paying for urgent repairs yourself (up to £250) and deducting from future rent, but only if your tenancy agreement allows this and you follow the correct procedure</li>
                      <li>Seeking legal advice before taking any action that might breach your tenancy agreement</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="repairs-4">
                  <AccordionTrigger className="text-left font-medium">What safety requirements must my landlord meet?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      Your landlord must ensure your property meets these key safety requirements:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li><strong>Gas safety:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>Annual gas safety check by a Gas Safe registered engineer</li>
                          <li>Provide you with a copy of the gas safety certificate</li>
                          <li>Maintain gas appliances, flues, and pipework</li>
                        </ul>
                      </li>
                      <li><strong>Electrical safety:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>Electrical Installation Condition Report (EICR) every 5 years</li>
                          <li>Provide you with a copy of the EICR</li>
                          <li>Address any hazards identified in the report</li>
                        </ul>
                      </li>
                      <li><strong>Fire safety:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>Smoke alarms on each floor</li>
                          <li>Carbon monoxide alarms in rooms with solid fuel appliances</li>
                          <li>Ensure all furnishings meet fire safety standards</li>
                          <li>Provide clear escape routes in HMOs (Houses in Multiple Occupation)</li>
                        </ul>
                      </li>
                      <li><strong>Energy performance:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>Property must have an Energy Performance Certificate (EPC) rating of E or above</li>
                          <li>Provide you with a copy of the EPC before you move in</li>
                        </ul>
                      </li>
                      <li><strong>General safety:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>Property must be free from serious hazards (HHSRS standards)</li>
                          <li>Property must be fit for human habitation</li>
                        </ul>
                      </li>
                    </ul>
                    <p className="text-gray-600 mt-2">
                      If your property doesn't meet these requirements, contact your local council's environmental health department as your landlord may be breaking the law.
                    </p>
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
                  <AccordionTrigger className="text-left font-medium">How much notice do I need to give to end my tenancy?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      The notice period depends on your tenancy type and stage:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li><strong>Fixed-term tenancy (still within the fixed term):</strong>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>You usually cannot end the tenancy early unless:
                            <ul className="list-disc list-inside ml-4 mt-1">
                              <li>Your agreement has a break clause (check the terms)</li>
                              <li>Your landlord agrees to end it early (get this in writing)</li>
                              <li>You find a replacement tenant acceptable to your landlord</li>
                            </ul>
                          </li>
                        </ul>
                      </li>
                      <li><strong>Fixed-term tenancy (at the end of the term):</strong>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>You can move out on the last day without giving notice</li>
                          <li>However, it's good practice to give at least 1 month's notice</li>
                        </ul>
                      </li>
                      <li><strong>Periodic tenancy (month-to-month):</strong>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>At least 1 month's notice is required</li>
                          <li>Notice must end on the first or last day of a tenancy period</li>
                          <li>Check your agreement as some require longer notice periods</li>
                        </ul>
                      </li>
                    </ul>
                    <p className="text-gray-600 mt-2">
                      Always give notice in writing and keep a copy for your records. Email is acceptable, but a letter with proof of postage provides better evidence.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="ending-2">
                  <AccordionTrigger className="text-left font-medium">Can I end my tenancy early?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      You have several options for ending a fixed-term tenancy early:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li><strong>Break clause:</strong> Check if your agreement has one and follow its terms exactly</li>
                      <li><strong>Mutual agreement:</strong> Your landlord may agree to release you early if:
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>You find a replacement tenant</li>
                          <li>You offer some financial incentive</li>
                          <li>The rental market is strong in your area</li>
                        </ul>
                      </li>
                      <li><strong>Assignment or subletting:</strong> If your agreement allows it (uncommon)</li>
                      <li><strong>Landlord breach:</strong> If your landlord has seriously breached the agreement (e.g., failing to make essential repairs, harassment)</li>
                    </ul>
                    <p className="text-gray-600 mt-2">
                      If you leave without proper termination:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li>You remain liable for rent until the fixed term ends or proper notice is given</li>
                      <li>Breaking a tenancy agreement without proper agreement could impact future rental references</li>
                      <li>Your landlord can take legal action to recover unpaid rent</li>
                    </ul>
                    <p className="text-gray-600 mt-2">
                      Always try to negotiate with your landlord first, and get any agreement to end the tenancy early in writing.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="ending-3">
                  <AccordionTrigger className="text-left font-medium">When can my landlord evict me?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      Your landlord can only evict you legally by following proper procedures. These generally include:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li>Giving you a valid notice (either Section 21 or Section 8)</li>
                      <li>Obtaining a court order if you don't leave</li>
                      <li>Arranging bailiffs to evict you if necessary</li>
                    </ol>
                    <p className="text-gray-600 mt-2">
                      <strong>Section 21 'no-fault' eviction notice:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-1 ml-2">
                      <li>Requires at least 2 months' notice</li>
                      <li>Cannot be used in the first 4 months of a tenancy</li>
                      <li>Cannot be used if the landlord hasn't protected your deposit</li>
                      <li>Cannot be used if the property requires a license but doesn't have one</li>
                      <li>Cannot be used if the landlord hasn't provided an EPC, gas safety certificate, and 'How to Rent' guide</li>
                    </ul>
                    <p className="text-gray-600 mt-2">
                      <strong>Section 8 eviction notice:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-1 ml-2">
                      <li>Used when the tenant has broken the terms of the tenancy</li>
                      <li>Common grounds include:
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>Rent arrears (8 weeks or more for weekly tenancies, 2 months for monthly)</li>
                          <li>Antisocial behavior</li>
                          <li>Damage to the property</li>
                          <li>Using the property for illegal purposes</li>
                        </ul>
                      </li>
                      <li>Notice period varies from 2 weeks to 2 months depending on the grounds</li>
                    </ul>
                    <p className="text-gray-600 mt-2">
                      If you receive an eviction notice, seek advice immediately from:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-1 ml-2">
                      <li>Citizens Advice</li>
                      <li>Shelter</li>
                      <li>Your local council's housing department</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="ending-4">
                  <AccordionTrigger className="text-left font-medium">What should I do before moving out?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      Follow this checklist to ensure a smooth departure and maximize your deposit return:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2 ml-2">
                      <li><strong>1-2 months before moving:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>Give proper written notice</li>
                          <li>Review your tenancy agreement for specific move-out requirements</li>
                          <li>Begin organizing and packing non-essential items</li>
                        </ul>
                      </li>
                      <li><strong>2-3 weeks before moving:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>Notify utility providers (gas, electricity, water, council tax)</li>
                          <li>Set up mail forwarding with Royal Mail</li>
                          <li>Update your address with banks, employers, etc.</li>
                          <li>Schedule professional cleaning if required by your agreement</li>
                        </ul>
                      </li>
                      <li><strong>1 week before moving:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>Take final meter readings</li>
                          <li>Begin cleaning thoroughly</li>
                          <li>Arrange a pre-checkout inspection with your landlord if possible</li>
                          <li>Fix any minor damage (e.g., fill nail holes)</li>
                        </ul>
                      </li>
                      <li><strong>Moving day:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>Remove all belongings</li>
                          <li>Clean the property thoroughly</li>
                          <li>Return all keys</li>
                          <li>Take date-stamped photos of the property's condition</li>
                          <li>Complete a final walk-through with the landlord if possible</li>
                          <li>Record final meter readings and notify providers</li>
                        </ul>
                      </li>
                      <li><strong>After moving:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>Provide a forwarding address for correspondence and deposit return</li>
                          <li>Request your deposit return in writing</li>
                          <li>Keep all evidence (photos, inventory, correspondence) until your deposit is returned</li>
                        </ul>
                      </li>
                    </ul>
                    <p className="text-gray-600 mt-2">
                      Remember that the property should be returned in the same condition as when you moved in, allowing for normal wear and tear.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <div className="bg-[#1E293B] rounded-xl shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Get a Professional Analysis of Your Tenancy Agreement</h2>
              <p className="mb-6 text-white/90">Upload your tenancy agreement for a thorough analysis that highlights potential issues and unfair terms.</p>
              <Link href="/">
                <Button className="bg-[#EC7134] hover:bg-[#E35F1E] text-white font-medium px-6 py-2">
                  Analyze Your Agreement
                </Button>
              </Link>
            </div>
            <div className="bg-[#EC7134]/10 flex items-center justify-center p-8">
              <div className="max-w-sm">
                <div className="flex items-center mb-4">
                  <div className="bg-[#EC7134] rounded-full p-2 mr-3">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-[#EC7134]">AI-Powered Analysis</h3>
                    <p className="text-sm text-gray-600">Our technology reviews your entire agreement for issues</p>
                  </div>
                </div>
                <div className="flex items-center mb-4">
                  <div className="bg-[#EC7134] rounded-full p-2 mr-3">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-[#EC7134]">Clause-by-Clause Review</h3>
                    <p className="text-sm text-gray-600">Get detailed insights about every section of your agreement</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-[#EC7134] rounded-full p-2 mr-3">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-[#EC7134]">Practical Recommendations</h3>
                    <p className="text-sm text-gray-600">Receive actionable advice on how to handle problematic clauses</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* More Resources Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 text-[#1E293B]">More Tenant Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/tenant-rights" className="group">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 hover:border-[#EC7134]/30 h-full flex flex-col">
                <div className="rounded-full bg-[#EC7134]/10 p-3 w-12 h-12 flex items-center justify-center mb-4 group-hover:bg-[#EC7134]/20 transition-colors duration-300">
                  <Users className="w-6 h-6 text-[#EC7134]" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800 group-hover:text-[#EC7134] transition-colors duration-300">Tenant Rights Guide</h3>
                <p className="text-gray-600 text-sm flex-grow">Learn about your legal rights and protections as a tenant in the UK.</p>
              </div>
            </Link>
            <Link href="/faqs/tenancy-analysis" className="group">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 hover:border-[#EC7134]/30 h-full flex flex-col">
                <div className="rounded-full bg-[#EC7134]/10 p-3 w-12 h-12 flex items-center justify-center mb-4 group-hover:bg-[#EC7134]/20 transition-colors duration-300">
                  <FileText className="w-6 h-6 text-[#EC7134]" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800 group-hover:text-[#EC7134] transition-colors duration-300">Tenancy Agreement Analysis</h3>
                <p className="text-gray-600 text-sm flex-grow">Find out how our AI analyzes your agreement and flags potential issues.</p>
              </div>
            </Link>
            <div className="group">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 hover:border-[#EC7134]/30 h-full flex flex-col">
                <div className="rounded-full bg-[#EC7134]/10 p-3 w-12 h-12 flex items-center justify-center mb-4 group-hover:bg-[#EC7134]/20 transition-colors duration-300">
                  <KeyRound className="w-6 h-6 text-[#EC7134]" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800 group-hover:text-[#EC7134] transition-colors duration-300">External Resources</h3>
                <p className="text-gray-600 text-sm mb-4">These trusted organizations offer additional help for UK tenants:</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-[#EC7134] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7"></path>
                    </svg>
                    <a href="https://www.citizensadvice.org.uk/housing/" target="_blank" rel="noopener noreferrer" className="hover:text-[#EC7134] transition-colors duration-300">Citizens Advice Housing</a>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-[#EC7134] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7"></path>
                    </svg>
                    <a href="https://england.shelter.org.uk/housing_advice" target="_blank" rel="noopener noreferrer" className="hover:text-[#EC7134] transition-colors duration-300">Shelter Housing Advice</a>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-[#EC7134] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7"></path>
                    </svg>
                    <a href="https://www.gov.uk/private-renting" target="_blank" rel="noopener noreferrer" className="hover:text-[#EC7134] transition-colors duration-300">GOV.UK Private Renting</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}