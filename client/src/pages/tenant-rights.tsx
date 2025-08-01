import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import TenantRightsAnimation from '@/components/TenantRightsAnimation';
import { 
  ShieldCheck, FileText, Scale, Users, AlertCircle,
  Home, KeyRound, BookOpen, ClipboardList
} from 'lucide-react';

export default function TenantRights() {
  const [activeTab, setActiveTab] = useState('deposits');

  return (
    <div className="bg-white">
      {/* Enhanced Hero section with animations */}
      <div className="relative bg-[#FFFAF5] text-gray-800 py-16 md:py-24 overflow-hidden">
        {/* Animated background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#EC7134]/5 to-transparent"></div>
        
        {/* Decorative elements with animations */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-[#EC7134]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-[#EC7134]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#EC7134]/10 text-[#EC7134] mb-6 hover:bg-[#EC7134]/20 transition-colors duration-300 cursor-default">
              <ShieldCheck className="w-4 h-4 mr-2 animate-pulse" style={{ animationDuration: '3s' }} /> Tenant Protection
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-[#1E293B]">
              UK <span className="text-[#EC7134] relative inline-block">
                Tenant Rights
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#EC7134]/50 rounded-full"></span>
              </span> Guide
            </h1>
            <p className="text-xl text-gray-600 mb-8 transition-all duration-500 hover:text-gray-800">
              Know your rights as a tenant in the UK. This comprehensive guide explains key protections 
              you're entitled to under UK housing laws.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
              <Link href="/?section=upload">
                <Button className="bg-[#EC7134] hover:bg-[#E35F1E] text-white px-6 py-3 rounded-lg flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Analyse My Tenancy Agreement
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main content container */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero CTA Box */}
        <div className="bg-gradient-to-r from-[#FFF5EB] to-[#FFF8F2] p-6 rounded-lg shadow-sm mb-12 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0 md:mr-6">
            <h2 className="text-2xl font-semibold text-[#EC7134] mb-2">Not sure if your tenancy agreement protects your rights?</h2>
            <p className="text-gray-600">
              Upload your tenancy agreement for a professional AI analysis that highlights potential issues and unfair terms.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link href="/?section=upload">
              <Button className="bg-[#EC7134] hover:bg-[#E35F1E] text-white">
                <Scale className="w-4 h-4 mr-2" />
                Analyse My Tenancy Agreement
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Interactive animation section */}
        <TenantRightsAnimation />

        {/* Main content tabs */}
        <Tabs defaultValue="deposits" onValueChange={setActiveTab} value={activeTab} className="w-full">
          <div className="mb-6 px-2">
            <div className="flex justify-center relative">
              {/* Using flex instead of grid for better mobile display */}
              <TabsList className="flex flex-wrap w-full max-w-3xl">
                <TabsTrigger 
                  value="deposits" 
                  className="flex-1 min-w-[50%] sm:min-w-[25%] text-xs p-2 sm:p-3 sm:text-sm"
                >
                  Deposits & Fees
                </TabsTrigger>
                <TabsTrigger 
                  value="repairs" 
                  className="flex-1 min-w-[50%] sm:min-w-[25%] text-xs p-2 sm:p-3 sm:text-sm"
                >
                  Repairs & Safety
                </TabsTrigger>
                <TabsTrigger 
                  value="privacy" 
                  className="flex-1 min-w-[50%] sm:min-w-[25%] text-xs p-2 sm:p-3 sm:text-sm"
                >
                  Privacy & Access
                </TabsTrigger>
                <TabsTrigger 
                  value="eviction" 
                  className="flex-1 min-w-[50%] sm:min-w-[25%] text-xs p-2 sm:p-3 sm:text-sm"
                >
                  Eviction Protection
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Deposits & Fees Content */}
          <TabsContent value="deposits" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[#EC7134]">Deposit Protection</CardTitle>
                  <CardDescription>Required by the Housing Act 2004</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">Your deposit must be protected in a government-approved scheme within 30 days of payment. Your landlord must provide you with:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>The deposit protection certificate</li>
                    <li>Scheme contact details</li>
                    <li>How to apply for the deposit's return</li>
                    <li>Reasons why deductions might be made</li>
                    <li>Dispute resolution process details</li>
                  </ul>
                </CardContent>
                <CardFooter className="text-sm text-gray-500">
                  Failure to protect your deposit can result in penalties for the landlord of 1-3 times the deposit amount.
                </CardFooter>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[#EC7134]">Tenant Fees Act 2019</CardTitle>
                  <CardDescription>Protection from unfair charges</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">Landlords and agents can only charge you for:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Rent</li>
                    <li>Refundable tenancy deposit (capped at 5-6 weeks' rent)</li>
                    <li>Refundable holding deposit (capped at 1 week's rent)</li>
                    <li>Changes to tenancy requested by tenant (capped at £50)</li>
                    <li>Early termination fees (if requested by tenant)</li>
                    <li>Utility bills, Council Tax, TV licence, and communication services</li>
                    <li>Late rent payment (after 14 days)</li>
                    <li>Replacement keys/security devices</li>
                  </ul>
                </CardContent>
                <CardFooter className="text-sm text-gray-500">
                  All other fees are prohibited, including admin fees, credit check fees, and referencing fees.
                </CardFooter>
              </Card>
            </div>

            <div className="mt-8 bg-[#FFF5EB] p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-[#EC7134] mb-4">Common Deposit Issues</h3>
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>What should I do if my deposit hasn't been protected?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-700">
                      If your landlord hasn't protected your deposit within 30 days, you can:
                    </p>
                    <ol className="list-decimal list-inside mt-2 space-y-1 text-gray-700">
                      <li>Ask your landlord in writing to protect it immediately</li>
                      <li>Apply to the county court for compensation (1-3x deposit amount)</li>
                      <li>Your landlord cannot use Section 21 to evict you if your deposit is unprotected</li>
                      <li>Contact Shelter, Citizens Advice, or a housing solicitor for support</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>How can I dispute unfair deposit deductions?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-700">
                      Follow these steps to dispute unfair deductions:
                    </p>
                    <ol className="list-decimal list-inside mt-2 space-y-1 text-gray-700">
                      <li>Request a detailed breakdown of deductions from your landlord</li>
                      <li>Provide evidence for why you disagree (photos, inventory reports, etc.)</li>
                      <li>Use the free dispute resolution service provided by your deposit protection scheme</li>
                      <li>Most schemes will release any undisputed amount to you while the dispute is resolved</li>
                      <li>The burden of proof is on the landlord to justify deductions</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>What fees can I be charged when renting?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-700">
                      Since the Tenant Fees Act 2019, most fees are banned. Landlords/agents can only charge for:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                      <li>Rent and deposit (capped at 5 weeks' rent for annual rent under £50,000)</li>
                      <li>Refundable holding deposits (max 1 week's rent)</li>
                      <li>Changes to tenancy at tenant's request (max £50 unless higher costs can be proven)</li>
                      <li>Early termination requested by tenant (limited to actual costs incurred)</li>
                      <li>Default fees for late rent (after 14 days) or lost keys (reasonable costs only)</li>
                    </ul>
                    <p className="mt-2 text-gray-700">Report any prohibited fees to your local Trading Standards or use the free dispute resolution procedures.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* Repairs & Safety Content */}
          <TabsContent value="repairs" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[#EC7134]">Landlord's Repair Responsibilities</CardTitle>
                  <CardDescription>Under the Landlord and Tenant Act 1985</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">Your landlord is legally responsible for maintaining:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Structure and exterior of the property (roof, walls, windows, doors)</li>
                    <li>Basins, sinks, baths, toilets and plumbing</li>
                    <li>Heating and hot water systems</li>
                    <li>Gas appliances, pipes, flues and ventilation</li>
                    <li>Electrical wiring and fixed electrical installations</li>
                    <li>Any damage caused by repair works</li>
                  </ul>
                </CardContent>
                <CardFooter className="text-sm text-gray-500">
                  Your landlord must maintain these elements even if your tenancy agreement says otherwise.
                </CardFooter>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[#EC7134]">Health & Safety Requirements</CardTitle>
                  <CardDescription>Mandatory safety measures</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">Your landlord must ensure:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Working smoke alarms on each floor</li>
                    <li>Carbon monoxide detectors where required (rooms with solid fuel appliances)</li>
                    <li>Annual gas safety checks by a Gas Safe registered engineer</li>
                    <li>Electrical safety checks every 5 years</li>
                    <li>Property is free from hazards under the Housing Health and Safety Rating System</li>
                    <li>Energy Performance Certificate (EPC) with minimum 'E' rating</li>
                  </ul>
                </CardContent>
                <CardFooter className="text-sm text-gray-500">
                  Homes (Fitness for Human Habitation) Act 2018 requires properties to be fit for human habitation.
                </CardFooter>
              </Card>
            </div>

            <div className="mt-8 bg-[#FFF5EB] p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-[#EC7134] mb-4">Repairs & Maintenance Process</h3>
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>How to report repairs effectively</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-700">
                      Follow these steps for effective repair reporting:
                    </p>
                    <ol className="list-decimal list-inside mt-2 space-y-1 text-gray-700">
                      <li>Report the issue to your landlord in writing (email or letter)</li>
                      <li>Provide clear details and photos of the problem</li>
                      <li>Keep copies of all communications</li>
                      <li>Allow reasonable access for inspections and repairs</li>
                      <li>Follow up if repairs aren't addressed in a reasonable timeframe</li>
                    </ol>
                    <p className="mt-2 text-gray-700">Reasonable timeframes: 24 hours for emergencies (no heat/water), 3-7 days for urgent repairs, 14-30 days for non-urgent repairs.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>What if my landlord won't make repairs?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-700">
                      If your landlord fails to make necessary repairs:
                    </p>
                    <ol className="list-decimal list-inside mt-2 space-y-1 text-gray-700">
                      <li>Send a formal letter/email with a specific deadline for repair completion</li>
                      <li>Contact your local council's Environmental Health department</li>
                      <li>Consider using the council's enforcement powers under the Housing Act 2004</li>
                      <li>In serious cases, you may use the Homes (Fitness for Human Habitation) Act 2018</li>
                      <li>Seek advice from Shelter, Citizens Advice, or a housing solicitor</li>
                    </ol>
                    <p className="mt-2 text-gray-700 font-semibold">Important: Do not withhold rent as this can lead to eviction. Instead, use proper legal channels.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>How to handle safety concerns</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-700">
                      For serious safety issues:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                      <li>Gas concerns: Call the Gas Safe Register (0800 408 5500) and report to the HSE</li>
                      <li>Electrical problems: Contact your local council's Environmental Health team</li>
                      <li>Fire hazards: Notify your local Fire and Rescue Authority</li>
                      <li>No smoke/CO alarms: Report to your local council</li>
                      <li>Serious damp/mold: Environmental Health can assess using HHSRS</li>
                    </ul>
                    <p className="mt-2 text-gray-700">Keep all evidence of safety breaches, including photos, communications, and health impacts.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* Privacy & Access Content */}
          <TabsContent value="privacy" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[#EC7134]">Right to Quiet Enjoyment</CardTitle>
                  <CardDescription>A fundamental tenant right</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">The covenant of quiet enjoyment means you have the right to:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Live in the property undisturbed</li>
                    <li>Exclude others from the property, including your landlord</li>
                    <li>Use the property without interference</li>
                    <li>Expect privacy and advance notice for property visits</li>
                    <li>Be free from harassment or illegal eviction attempts</li>
                  </ul>
                </CardContent>
                <CardFooter className="text-sm text-gray-500">
                  This right exists regardless of whether it's explicitly stated in your tenancy agreement.
                </CardFooter>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[#EC7134]">Landlord Access Rules</CardTitle>
                  <CardDescription>Your right to privacy</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">Your landlord must:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Give at least 24 hours' written notice before visiting</li>
                    <li>Visit at reasonable times (usually 8am-8pm)</li>
                    <li>Get your permission for each visit</li>
                    <li>Provide a legitimate reason for access (e.g., repairs, inspections)</li>
                    <li>Respect your refusal if the time is inconvenient (and reschedule)</li>
                  </ul>
                </CardContent>
                <CardFooter className="text-sm text-gray-500">
                  Exceptions exist for genuine emergencies like floods, fires, or gas leaks.
                </CardFooter>
              </Card>
            </div>

            <div className="mt-8 bg-[#FFF5EB] p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-[#EC7134] mb-4">Privacy & Access FAQs</h3>
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>Can my landlord let themselves in when I'm not home?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-700">
                      No, landlords cannot enter your property without your permission except in genuine emergencies.
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                      <li>They must always provide at least 24 hours' written notice</li>
                      <li>You must give permission for each individual visit</li>
                      <li>You can refuse access if timing is inconvenient and offer alternative dates</li>
                      <li>If they enter without permission, it may constitute harassment under the Protection from Eviction Act 1977</li>
                      <li>Consider changing locks (keep originals to reinstall when moving out) if repeated violations occur</li>
                    </ul>
                    <p className="mt-2 text-gray-700">Document any unauthorized entries with dates, times, and photos if possible.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>What constitutes landlord harassment?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-700">
                      Landlord harassment includes:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                      <li>Entering without permission or proper notice</li>
                      <li>Removing or restricting services (heat, water, electricity)</li>
                      <li>Interfering with your peace and comfort (excessive noise, visits)</li>
                      <li>Threatening or abusive behavior</li>
                      <li>Refusing to carry out repairs to force you to leave</li>
                      <li>Discriminatory behavior based on protected characteristics</li>
                      <li>Charging excessive or unlawful fees</li>
                      <li>Changing locks or restricting access</li>
                    </ul>
                    <p className="mt-2 text-gray-700">If you experience harassment, keep detailed records, report to local council, and seek advice from Shelter, Citizens Advice, or a solicitor.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Are there rules around installing CCTV at rental properties?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-700">
                      For tenants:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                      <li>You can usually install indoor cameras without permission</li>
                      <li>External cameras or permanent installations typically require landlord consent</li>
                      <li>Cameras must only monitor your private space, not communal areas or neighboring properties</li>
                      <li>You may need to remove cameras when moving out unless otherwise agreed</li>
                    </ul>
                    <p className="mt-2 text-gray-700">
                      For landlords:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                      <li>Cannot install cameras inside a tenant's home without explicit consent</li>
                      <li>May install cameras in communal areas with proper notice</li>
                      <li>Must comply with GDPR and Data Protection Act for any footage collected</li>
                      <li>Must provide information about surveillance systems to tenants</li>
                    </ul>
                    <p className="mt-2 text-gray-700">Hidden cameras inside rental properties are almost always illegal.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* Eviction Protection Content */}
          <TabsContent value="eviction" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[#EC7134]">Eviction Notice Requirements</CardTitle>
                  <CardDescription>Lawful eviction procedures</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">For a legal eviction, landlords must:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Provide proper written notice (usually Section 21 or Section 8)</li>
                    <li>Wait until any fixed term has ended (for Section 21)</li>
                    <li>Give at least 2 months' notice for Section 21 notices</li>
                    <li>Get a court order if you don't leave after the notice period</li>
                    <li>Use court-appointed bailiffs if you still don't leave</li>
                  </ul>
                </CardContent>
                <CardFooter className="text-sm text-gray-500">
                  Evicting a tenant without following the correct legal procedure is a criminal offense.
                </CardFooter>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[#EC7134]">Invalid Section 21 Evictions</CardTitle>
                  <CardDescription>When a Section 21 notice is not valid</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">A Section 21 "no-fault" eviction notice is invalid if:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Given in the first 4 months of the tenancy</li>
                    <li>Your deposit wasn't protected properly</li>
                    <li>You weren't given required documents (EPC, Gas Safety Certificate, How to Rent guide)</li>
                    <li>The property requires a license but doesn't have one</li>
                    <li>It's retaliatory (e.g., after requesting repairs)</li>
                    <li>You've had a legitimate complaint about property conditions (Retaliatory Eviction)</li>
                    <li>The council has served improvement/hazard notices in the last 6 months</li>
                  </ul>
                </CardContent>
                <CardFooter className="text-sm text-gray-500">
                  The government has committed to ending Section 21 evictions through the Renters' Reform Bill.
                </CardFooter>
              </Card>
            </div>

            <div className="mt-8 bg-[#FFF5EB] p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-[#EC7134] mb-4">Dealing with Eviction Notices</h3>
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>What's the difference between Section 21 and Section 8 notices?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-700">
                      Section 21 ("no-fault" eviction):
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                      <li>Doesn't require the landlord to give a reason</li>
                      <li>Requires at least 2 months' notice</li>
                      <li>Can only be used after fixed term ends or during periodic tenancy</li>
                      <li>Cannot be used in various circumstances (see Invalid Section 21 list)</li>
                      <li>Will eventually be abolished under the Renters' Reform Bill</li>
                    </ul>
                    <p className="text-gray-700 mt-4">
                      Section 8 (eviction for a specific reason):
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                      <li>Requires specific legal grounds (e.g., rent arrears, property damage)</li>
                      <li>Notice period varies from 2 weeks to 2 months depending on grounds used</li>
                      <li>Can be challenged in court if grounds aren't proven</li>
                      <li>Can be used during fixed term tenancies if there's a breach</li>
                      <li>Most common ground is rent arrears (Ground 8, 10, 11)</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>What should I do if I receive an eviction notice?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-700">
                      Steps to take when you receive an eviction notice:
                    </p>
                    <ol className="list-decimal list-inside mt-2 space-y-1 text-gray-700">
                      <li>Don't panic - you cannot be forced to leave without a court order</li>
                      <li>Check if the notice is valid (right form, correct notice period, proper service)</li>
                      <li>For Section 21, check if any of the invalid conditions apply</li>
                      <li>For Section 8, assess whether the claimed grounds are accurate and provable</li>
                      <li>Seek advice immediately from Shelter, Citizens Advice, or a housing solicitor</li>
                      <li>Apply for Legal Aid if you're eligible</li>
                      <li>Consider negotiating with your landlord for more time</li>
                      <li>Start looking for alternative accommodation as a precaution</li>
                    </ol>
                    <p className="mt-2 text-gray-700 font-semibold">Important: Only leave if ordered to by the court. Leaving early can be considered voluntary and may affect housing assistance eligibility.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>What is an illegal eviction and what can I do?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-700">
                      An illegal eviction occurs when:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                      <li>Landlord forces you to leave without a court order</li>
                      <li>Landlord changes locks while you're out</li>
                      <li>You're physically removed by anyone other than court-appointed bailiffs</li>
                      <li>You're harassed or intimidated into leaving</li>
                      <li>Landlord cuts off essential services (water, electricity, gas) to force you out</li>
                    </ul>
                    <p className="text-gray-700 mt-4">
                      If you face illegal eviction:
                    </p>
                    <ol className="list-decimal list-inside mt-2 space-y-1 text-gray-700">
                      <li>Call the police immediately (illegal eviction is a criminal offense)</li>
                      <li>Contact your local council's tenancy relations or housing department</li>
                      <li>Gather evidence: photos, videos, witness statements</li>
                      <li>Keep a detailed log of all incidents and communications</li>
                      <li>Apply for an injunction to return to the property if locked out</li>
                      <li>Consider claiming damages (which can be substantial)</li>
                    </ol>
                    <p className="mt-2 text-gray-700">Illegal eviction can result in unlimited fines and up to 2 years' imprisonment for landlords.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}