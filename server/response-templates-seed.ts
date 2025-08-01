import { storage } from './storage';
import type { InsertResponseTemplate } from '@shared/schema';

// Pre-defined response templates that address common tenancy issues
const defaultTemplates: InsertResponseTemplate[] = [
  {
    category: 'illegal_fees',
    title: 'Challenge Illegal Admin Fees',
    description: 'Template to challenge prohibited administration fees charged by landlord or agent',
    severity: 'high',
    legalBasis: 'Tenant Fees Act 2019 - prohibits most fees except rent, deposits, and specific permitted charges',
    templateContent: `Dear [LANDLORD_NAME],

Re: [PROPERTY_ADDRESS] - Illegal Administration Fees

I am writing to formally dispute the administration fees of £[AMOUNT] that have been charged in connection with my tenancy agreement.

Under the Tenant Fees Act 2019, which came into force on 1st June 2019, landlords and letting agents are prohibited from charging tenants most fees. The only permitted payments are:

• Rent
• Security deposit (maximum 5 weeks' rent for annual rent under £50,000)
• Holding deposit (maximum 1 week's rent)
• Payments in default
• Council tax, utilities, and communication services
• Change of tenant fees (maximum £50)
• Early termination fees

The administration fees charged appear to fall outside these permitted categories and are therefore prohibited under UK law.

I formally request that you:
1. Refund the illegal fee of £[AMOUNT] within 28 days
2. Confirm in writing that no further prohibited fees will be charged

If you believe this fee is permitted under the Act, please provide detailed justification with reference to the specific legal provision that allows it.

Failure to refund illegal fees may result in a penalty notice from Trading Standards and could affect your ability to serve valid notices under the Housing Act.

I look forward to your prompt response and resolution of this matter.

Yours sincerely,
[TENANT_NAME]
[DATE]`
  },
  {
    category: 'deposit_dispute',
    title: 'Deposit Protection Challenge',
    description: 'Template to challenge unfair deposit deductions or unprotected deposits',
    severity: 'high',
    legalBasis: 'Housing Act 2004 - requires deposit protection within 30 days',
    templateContent: `Dear [LANDLORD_NAME],

Re: [PROPERTY_ADDRESS] - Tenancy Deposit Protection Compliance

I am writing regarding my security deposit of £[DEPOSIT_AMOUNT] paid on [DATE].

I have been unable to locate evidence that my deposit has been properly protected in a government-approved tenancy deposit protection (TDP) scheme as required by law.

Under the Housing Act 2004 (as amended), landlords must:
• Protect the deposit in an approved scheme within 30 days of receipt
• Provide prescribed information about the protection within 30 days
• Return the deposit at the end of the tenancy, less any legitimate deductions

Failure to comply with deposit protection requirements means:
• The landlord cannot serve a valid Section 21 notice
• The tenant may claim compensation of 1-3 times the deposit amount
• Any deposit deductions may be challengeable

I require immediate confirmation that:
1. My deposit is protected in [TDP/DPS/MYDEPOSITS]
2. The scheme reference number is: [REF_NUMBER]
3. A copy of the prescribed information provided within 30 days

If the deposit was not properly protected, I expect:
• Immediate protection of the deposit
• Compensation payment as required by law
• Written confirmation of compliance

Please respond within 14 days with the required information.

Yours sincerely,
[TENANT_NAME]
[DATE]`
  },
  {
    category: 'repairs_maintenance',
    title: 'Formal Repair Request',
    description: 'Template to formally request essential repairs with legal obligations',
    severity: 'medium',
    legalBasis: 'Landlord and Tenant Act 1985 - repair obligations',
    templateContent: `Dear [LANDLORD_NAME],

Re: [PROPERTY_ADDRESS] - Formal Repair Request

I am writing to formally notify you of repair issues at the above property that require your immediate attention.

The following repairs are needed:
[REPAIR_LIST]

Under the Landlord and Tenant Act 1985, you have statutory obligations to:
• Keep the structure and exterior in repair
• Keep installations for water, gas, electricity, and sanitation in working order
• Keep installations for heating and hot water in working order

These repairs affect:
☐ Health and safety of occupants
☐ Structural integrity of the property  
☐ Essential services (water/heating/electricity)
☐ Prevention of further damage

I have documented these issues with photographs taken on [DATE] and can provide these if required.

Please confirm in writing:
1. When these repairs will be carried out
2. Arrangements for access to the property
3. Contact details for the contractors

Under the Housing Health and Safety Rating System (HHSRS), serious repair issues can be reported to the local authority. I hope we can resolve these matters cooperatively without involving external agencies.

I look forward to your prompt response within 14 days and swift resolution of these issues.

Yours sincerely,
[TENANT_NAME]
[DATE]`
  },
  {
    category: 'rent_increase',
    title: 'Challenge Excessive Rent Increase',
    description: 'Template to challenge improper or excessive rent increases',
    severity: 'high',
    legalBasis: 'Housing Act 1988 - rent increase procedures and limitations',
    templateContent: `Dear [LANDLORD_NAME],

Re: [PROPERTY_ADDRESS] - Rent Increase Notice Dated [DATE]

I am writing in response to your notice of rent increase from £[OLD_RENT] to £[NEW_RENT] per month, representing an increase of [PERCENTAGE]%.

I wish to formally challenge this increase on the following grounds:

Legal Requirements:
For assured shorthold tenancies, rent increases must follow proper procedures:
• Minimum 6 months between increases
• Proper notice period (usually 1 month)
• Use of prescribed form (Section 13 notice) where applicable

Market Rate Assessment:
The proposed increase appears excessive compared to:
• Current market rates for similar properties in the area
• The condition and amenities of the property
• Recent increases already applied

I have researched comparable properties and believe the market rent for a property of this type and condition is approximately £[MARKET_RATE] per month.

Procedural Concerns:
☐ Insufficient notice period provided
☐ Incorrect notice format used
☐ Increase within 6 months of previous increase
☐ No justification provided for the increase

I propose a rent of £[COUNTER_OFFER] per month, which reflects:
• The current condition of the property
• Market rates for similar properties
• Outstanding repair issues

If you wish to proceed with the increase, I may refer this matter to the First-tier Tribunal (Property Chamber) for determination of a fair market rent.

I look forward to your response within 14 days.

Yours sincerely,
[TENANT_NAME]
[DATE]`
  },
  {
    category: 'harassment_privacy',
    title: 'Address Landlord Harassment',
    description: 'Template to address harassment or illegal entry by landlord',
    severity: 'high',
    legalBasis: 'Protection from Eviction Act 1977 - harassment and illegal entry',
    templateContent: `Dear [LANDLORD_NAME],

Re: [PROPERTY_ADDRESS] - Harassment and Right to Quiet Enjoyment

I am writing to formally complain about recent incidents that constitute harassment and breach my right to quiet enjoyment of the property.

Incidents:
[INCIDENT_DETAILS]

Legal Position:
Under the Protection from Eviction Act 1977 and common law, tenants have the right to:
• Quiet enjoyment of the property without interference
• 24 hours' notice (except in emergencies) before landlord entry  
• Refuse entry except in genuine emergencies
• Live free from harassment or intimidation

The incidents described above constitute:
☐ Harassment under the Protection from Eviction Act 1977
☐ Breach of quiet enjoyment
☐ Trespass (if entry without permission)
☐ Potential criminal offence

Immediate Requirements:
I require your immediate confirmation that:
1. You will respect my right to quiet enjoyment
2. Proper notice will be given for any future visits
3. Entry will only occur with my consent or in genuine emergencies
4. All harassment will cease immediately

Consequences:
Continued harassment may result in:
• Complaint to local authority
• Police involvement (harassment is a criminal offence)
• Legal action for damages
• Application for injunction

I trust you will take immediate steps to rectify this situation and prevent any recurrence.

Yours sincerely,
[TENANT_NAME]
[DATE]`
  },
  {
    category: 'eviction_notice',
    title: 'Challenge Invalid Eviction Notice',
    description: 'Template to challenge improperly served eviction notices',
    severity: 'high',
    legalBasis: 'Housing Act 1988 - Section 8 and Section 21 notice requirements',
    templateContent: `Dear [LANDLORD_NAME],

Re: [PROPERTY_ADDRESS] - Invalid Eviction Notice

I am writing in response to your eviction notice dated [DATE], which I believe to be invalid for the following reasons:

Notice Type: [SECTION 8/SECTION 21]

Legal Requirements Not Met:
☐ Insufficient notice period (minimum 2 months for S21, varies for S8)
☐ Incorrect prescribed form not used
☐ Deposit not properly protected (invalidates S21)
☐ Required certificates not provided (EPC, Gas Safety)
☐ Prescribed information not served with deposit protection
☐ Notice period expires before fixed term ends
☐ Improper grounds specified (Section 8 only)
☐ Notice not properly served

Specific Defects:
[SPECIFIC_ISSUES]

Legal Position:
A valid eviction notice must comply strictly with statutory requirements. Any defect in form, content, or service may render the notice invalid.

For Section 21 notices specifically:
• Deposit must be properly protected throughout tenancy
• All prescribed information must have been provided
• Required certificates must be current and provided
• Cannot be served within first 4 months of tenancy

Response:
Due to the invalid nature of this notice, I do not accept it as effective. Any court proceedings based on this notice would likely fail.

If you wish to serve a valid notice, you must:
1. Correct all defects identified above  
2. Use the correct prescribed form
3. Allow proper notice periods
4. Ensure all statutory requirements are met

I remain willing to discuss any concerns you may have about the tenancy through proper legal channels.

Yours sincerely,
[TENANT_NAME]
[DATE]`
  },
  {
    category: 'utilities_charges',
    title: 'Challenge Unfair Utility Charges',
    description: 'Template to challenge excessive or improperly calculated utility charges',
    severity: 'medium', 
    legalBasis: 'Landlord and Tenant Act 1985 - service charge provisions',
    templateContent: `Dear [LANDLORD_NAME],

Re: [PROPERTY_ADDRESS] - Service Charges and Utility Billing

I am writing to query the service charges and utility bills for the period [DATE_RANGE], totaling £[AMOUNT].

Concerns Raised:
☐ No breakdown of charges provided
☐ Charges appear excessive compared to usage
☐ No evidence of actual costs incurred
☐ Profit element included in charges
☐ Charges for services not provided or requested

Legal Requirements:
Under the Landlord and Tenant Act 1985:
• Service charges must be reasonable
• Landlords can only recover actual costs incurred
• Detailed breakdown must be provided on request
• Supporting evidence must be available for inspection
• No profit element is permitted

Requested Information:
Please provide within 21 days:
1. Detailed breakdown of all charges
2. Copies of supplier invoices and bills
3. Method of apportionment between tenants/properties
4. Evidence of services actually provided
5. Calculation showing how my share was determined

Service Charge Rights:
I am entitled to:
• Challenge charges at the First-tier Tribunal
• Inspect supporting documentation
• Receive reasonable service at reasonable cost
• Have charges independently audited

If excessive charges are found, I may be entitled to:
• Refund of overpaid amounts
• Legal costs in challenging the charges
• Set-off against future payments

Pending your response with the requested information, I reserve my position regarding payment of disputed amounts.

Yours sincerely,
[TENANT_NAME]
[DATE]`
  },
  {
    category: 'contract_terms',
    title: 'Challenge Unfair Contract Terms',
    description: 'Template to challenge unfair or illegal terms in tenancy agreement',
    severity: 'medium',
    legalBasis: 'Consumer Rights Act 2015 - unfair contract terms',
    templateContent: `Dear [LANDLORD_NAME],

Re: [PROPERTY_ADDRESS] - Unfair Contract Terms

I am writing regarding certain terms in the tenancy agreement that I believe may be unfair and potentially unenforceable.

Terms in Question:
[SPECIFIC_TERMS]

Legal Analysis:
Under the Consumer Rights Act 2015, contract terms may be unfair if they:
• Create significant imbalance between parties' rights and obligations
• Are contrary to good faith
• Cause detriment to consumers
• Are not necessary to protect legitimate interests

Potentially Unfair Terms:
☐ Excessive penalty clauses
☐ Terms preventing legitimate use of property
☐ Unreasonable restrictions on tenant rights
☐ Clauses excluding landlord liability inappropriately
☐ Terms allowing arbitrary rent increases
☐ Excessive notice requirements for tenant

Specific Concerns:
1. [TERM 1]: This appears disproportionate because [REASON]
2. [TERM 2]: This conflicts with statutory rights because [REASON]
3. [TERM 3]: This creates unfair advantage because [REASON]

Legal Effect:
Unfair terms are not binding on consumers and cannot be enforced. The rest of the contract remains valid unless it cannot operate without the unfair terms.

Resolution Sought:
I request that you:
1. Acknowledge these terms are unenforceable
2. Confirm they will not be relied upon
3. Consider amending the agreement to remove unfair terms
4. Provide written confirmation of your position

Alternative terms that would be fair and reasonable:
[PROPOSED_ALTERNATIVES]

I hope we can resolve this matter cooperatively without need for external determination.

Yours sincerely,
[TENANT_NAME]
[DATE]`
  }
];

// Function to seed the database with default templates
export async function seedResponseTemplates(): Promise<void> {
  console.log('🌱 Seeding response templates...');
  
  try {
    // Check if templates already exist
    const existingTemplates = await storage.getResponseTemplates();
    
    if (existingTemplates.length > 0) {
      console.log(`ℹ️ Found ${existingTemplates.length} existing templates, skipping seed`);
      return;
    }
    
    // Create all default templates
    for (const template of defaultTemplates) {
      await storage.createResponseTemplate(template);
      console.log(`✅ Created template: ${template.title}`);
    }
    
    console.log(`🎉 Successfully seeded ${defaultTemplates.length} response templates`);
    
  } catch (error) {
    console.error('❌ Error seeding response templates:', error);
    throw error;
  }
}

// Export the templates for reference
export { defaultTemplates };