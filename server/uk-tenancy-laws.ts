import { Insight } from '@shared/schema';
import { LEGAL_PRECEDENTS_2024, getCasesForTenancyIssue, formatLegalCitation } from './legal-precedents-2024';

/**
 * UK Tenancy Law Knowledge Base for pre-screening documents
 * This enhances analysis accuracy by detecting common legal issues
 * before the full AI analysis begins
 * 
 * NOW INCLUDES REGIONAL UK LAW VARIATIONS:
 * - England-specific provisions
 * - Wales-specific housing regulations
 * - Scottish tenancy law differences
 * - Northern Ireland housing law variations
 */

// Regional jurisdictions
export type UKRegion = 'england' | 'wales' | 'scotland' | 'northern-ireland';

// Performance tracking interface
export interface PerformanceMetrics {
  analysisStartTime: number;
  analysisEndTime?: number;
  promptTokensUsed?: number;
  responseTokensUsed?: number;
  region: UKRegion;
  documentType: string;
  chunksProcessed: number;
}

// Regional law variations interface
export interface RegionalLawVariation {
  region: UKRegion;
  lawName: string;
  year: number;
  section?: string;
  description: string;
  applicableFrom?: string;
  supersedes?: string[];
}

interface LawReference {
  name: string;
  section?: string;
  year: number;
  description: string;
  region?: UKRegion; // Which UK region this law applies to
  variations?: RegionalLawVariation[]; // Regional variations of this law
}

interface IssuePattern {
  pattern: RegExp;
  title: string;
  content: string;
  type: "primary" | "accent" | "warning";
  lawReference: LawReference;
  indicators?: string[];
  applicableRegions?: UKRegion[]; // Which regions this pattern applies to
  regionalVariations?: { [key in UKRegion]?: { title?: string; content?: string; } };
}

/**
 * Regional UK tenancy law variations
 */
const REGIONAL_LAW_VARIATIONS: RegionalLawVariation[] = [
  // Wales-specific laws
  {
    region: 'wales',
    lawName: 'Renting Homes (Wales) Act',
    year: 2016,
    description: 'Replaces assured shorthold tenancies with occupation contracts, provides enhanced tenant rights',
    applicableFrom: '2022-12-01'
  },
  {
    region: 'wales',
    lawName: 'Rent Smart Wales',
    year: 2015,
    description: 'Mandatory landlord and agent licensing scheme in Wales'
  },
  {
    region: 'wales',
    lawName: 'Housing (Wales) Act',
    year: 2014,
    section: 'Part 1',
    description: 'Welsh-specific housing standards and homelessness provisions'
  },
  // Scotland-specific laws
  {
    region: 'scotland',
    lawName: 'Private Housing (Tenancies) (Scotland) Act',
    year: 2016,
    description: 'Introduces private residential tenancies (PRT) replacing assured shorthold tenancies',
    applicableFrom: '2017-12-01'
  },
  {
    region: 'scotland',
    lawName: 'Rent Pressure Zone (Scotland) Regulations',
    year: 2017,
    description: 'Limits rent increases in designated areas'
  },
  {
    region: 'scotland',
    lawName: 'Housing (Scotland) Act',
    year: 2006,
    description: 'Scottish housing standards and tenancy deposit schemes'
  },
  {
    region: 'scotland',
    lawName: 'Repairing Standard (Scotland) Regulations',
    year: 2006,
    description: 'Scottish-specific property repair standards'
  },
  // Northern Ireland-specific laws
  {
    region: 'northern-ireland',
    lawName: 'Private Tenancies (Northern Ireland) Order',
    year: 2006,
    description: 'Northern Ireland private tenancy regulations and deposit protection'
  },
  {
    region: 'northern-ireland',
    lawName: 'Houses in Multiple Occupation Act (Northern Ireland)',
    year: 2016,
    description: 'HMO licensing and standards in Northern Ireland'
  }
];

/**
 * Common UK tenancy law references with regional variations
 */
const UK_TENANCY_LAWS: Record<string, LawReference> = {
  TENANT_FEES_ACT: {
    name: "Tenant Fees Act",
    year: 2019,
    description: "Prohibits landlords and letting agents from charging certain fees to tenants and caps deposits",
    region: 'england',
    variations: [
      {
        region: 'wales',
        lawName: 'Renting Homes (Wales) Act - Fee Provisions',
        year: 2016,
        description: 'Similar fee restrictions under Welsh occupation contracts'
      },
      {
        region: 'scotland',
        lawName: 'Tenant Fees (Scotland) Act',
        year: 2022,
        description: 'Scottish tenant fee ban with stricter enforcement',
        applicableFrom: '2022-09-30'
      },
      {
        region: 'northern-ireland',
        lawName: 'Private Tenancies Order - Fee Restrictions',
        year: 2006,
        description: 'Limited fee restrictions, deposit caps may differ'
      }
    ]
  },
  HOUSING_ACT: {
    name: "Housing Act",
    section: "Section 21",
    year: 1988,
    description: "Regulates no-fault evictions and notice periods",
    region: 'england',
    variations: [
      {
        region: 'wales',
        lawName: 'Renting Homes (Wales) Act',
        year: 2016,
        description: 'No-fault evictions require 6 months notice, enhanced tenant protections'
      },
      {
        region: 'scotland',
        lawName: 'Private Housing (Tenancies) (Scotland) Act',
        year: 2016,
        description: 'No-fault evictions abolished for private residential tenancies'
      },
      {
        region: 'northern-ireland',
        lawName: 'Private Tenancies Order',
        year: 2006,
        description: 'Similar no-fault provisions but different notice periods'
      }
    ]
  },
  LANDLORD_TENANT_ACT: {
    name: "Landlord and Tenant Act",
    section: "Section 11",
    year: 1985,
    description: "Defines landlord's repair and maintenance responsibilities",
    region: 'england',
    variations: [
      {
        region: 'wales',
        lawName: 'Renting Homes (Wales) Act - Repair Obligations',
        year: 2016,
        description: 'Enhanced landlord repair duties under occupation contracts'
      },
      {
        region: 'scotland',
        lawName: 'Repairing Standard (Scotland) Regulations',
        year: 2006,
        description: 'Scottish-specific repair standards and enforcement mechanisms'
      },
      {
        region: 'northern-ireland',
        lawName: 'Private Tenancies Order - Repair Duties',
        year: 2006,
        description: 'Similar repair obligations with local enforcement procedures'
      }
    ]
  },
  CONSUMER_RIGHTS_ACT: {
    name: "Consumer Rights Act",
    year: 2015,
    description: "Requires fairness in contract terms and prohibits unfair terms in tenancy agreements"
  },
  DEREGULATION_ACT: {
    name: "Deregulation Act",
    year: 2015,
    description: "Sets requirements for serving Section 21 notices and deposit protection"
  },
  HOUSING_HEALTH_SAFETY: {
    name: "Housing Health and Safety Rating System",
    year: 2004,
    description: "Sets standards for property conditions and safety"
  },
  DEPOSIT_PROTECTION: {
    name: "Housing Act (Deposit Protection)",
    year: 2004,
    description: "Requires tenant deposits to be protected in a government-approved scheme",
    region: 'england',
    variations: [
      {
        region: 'wales',
        lawName: 'Renting Homes (Wales) Act - Security Deposits',
        year: 2016,
        description: 'Enhanced deposit protection with stricter timescales'
      },
      {
        region: 'scotland',
        lawName: 'Tenancy Deposit Schemes (Scotland) Regulations',
        year: 2011,
        description: 'Scottish deposit protection scheme with different approved providers'
      },
      {
        region: 'northern-ireland',
        lawName: 'Tenancy Deposit Scheme (Northern Ireland)',
        year: 2013,
        description: 'Northern Ireland deposit protection requirements'
      }
    ]
  },
  RIGHT_TO_RENT: {
    name: "Immigration Act (Right to Rent)",
    year: 2014,
    description: "Requires landlords to check immigration status of tenants",
    region: 'england',
    variations: [
      {
        region: 'wales',
        lawName: 'Immigration Act (Right to Rent) - Wales',
        year: 2014,
        description: 'Same requirements as England'
      },
      {
        region: 'scotland',
        lawName: 'Not Applicable',
        year: 2014,
        description: 'Right to Rent checks not required in Scotland'
      },
      {
        region: 'northern-ireland',
        lawName: 'Not Applicable',
        year: 2014,
        description: 'Right to Rent checks not required in Northern Ireland'
      }
    ]
  },
  RENTERS_RIGHTS_BILL: {
    name: "Renters' Rights Bill",
    year: 2024,
    description: "Proposed legislation to abolish Section 21 no-fault evictions and strengthen tenant protections",
    region: 'england',
    variations: [
      {
        region: 'england',
        lawName: "Renters' Rights Bill (England)",
        year: 2024,
        description: 'Abolishes Section 21 notices and enhances tenant security'
      }
    ]
  },
  HMO_ADDITIONAL_LICENSING: {
    name: "Housing Act (HMO Additional Licensing)",
    year: 2004,
    description: "Enhanced HMO licensing requirements following 2024 case law developments",
    region: 'england',
    variations: [
      {
        region: 'england',
        lawName: 'Housing Act (HMO Additional Licensing) - England',
        year: 2004,
        description: 'Strict enforcement with significant penalties for non-compliance'
      }
    ]
  },
  ELECTRICAL_SAFETY_STANDARDS: {
    name: "Electrical Safety Standards in the Private Rented Sector",
    year: 2020,
    description: "Mandatory electrical safety checks for private rental properties",
    region: 'england',
    variations: [
      {
        region: 'england',
        lawName: 'Electrical Safety Standards (England) Regulations',
        year: 2020,
        description: 'EICR certificates required every 5 years'
      }
    ]
  }
};

/**
 * Region detection logic - analyzes document content to determine UK region
 */
export function detectUKRegion(documentContent: string, address?: string): UKRegion {
  const content = (documentContent + ' ' + (address || '')).toLowerCase();
  
  // Scottish indicators
  const scottishIndicators = [
    'private residential tenancy', 'prt tenancy', 'scottish secure tenancy',
    'repairing standard', 'rent pressure zone', 'tribunal scotland',
    'housing (scotland) act', 'private housing (tenancies) (scotland)',
    'glasgow', 'edinburgh', 'aberdeen', 'dundee', 'stirling',
    'scottish government', 'scotland postcode', 'eh1', 'g1', 'ab1', 'dd1'
  ];
  
  // Welsh indicators
  const welshIndicators = [
    'occupation contract', 'renting homes wales', 'rent smart wales',
    'housing (wales) act', 'welsh government', 'cardiff', 'swansea',
    'newport', 'bangor', 'wrexham', 'cf', 'sa', 'np', 'll', 'sy23'
  ];
  
  // Northern Ireland indicators
  const niIndicators = [
    'private tenancies northern ireland', 'houses in multiple occupation northern ireland',
    'northern ireland housing executive', 'belfast', 'derry', 'londonderry',
    'lisburn', 'newry', 'armagh', 'bt1', 'bt2', 'bt3', 'bt4'
  ];
  
  // Check for indicators
  if (scottishIndicators.some(indicator => content.includes(indicator))) {
    return 'scotland';
  }
  
  if (welshIndicators.some(indicator => content.includes(indicator))) {
    return 'wales';
  }
  
  if (niIndicators.some(indicator => content.includes(indicator))) {
    return 'northern-ireland';
  }
  
  // Default to England if no specific indicators found
  return 'england';
}

/**
 * Get region-specific law reference
 */
export function getRegionalLawReference(lawKey: string, region: UKRegion): LawReference {
  const baseLaw = UK_TENANCY_LAWS[lawKey];
  if (!baseLaw) return baseLaw;
  
  // Check for regional variations
  const variation = baseLaw.variations?.find(v => v.region === region);
  if (variation) {
    return {
      name: variation.lawName,
      year: variation.year,
      section: variation.section,
      description: variation.description,
      region: region
    };
  }
  
  return baseLaw;
}

/**
 * Performance monitoring utility
 */
export function startPerformanceTracking(region: UKRegion, documentType: string): PerformanceMetrics {
  return {
    analysisStartTime: Date.now(),
    region,
    documentType,
    chunksProcessed: 0
  };
}

export function endPerformanceTracking(metrics: PerformanceMetrics, promptTokens?: number, responseTokens?: number): PerformanceMetrics {
  return {
    ...metrics,
    analysisEndTime: Date.now(),
    promptTokensUsed: promptTokens,
    responseTokensUsed: responseTokens
  };
}

/**
 * Common patterns to identify potentially problematic clauses with regional variations
 */
const ISSUE_PATTERNS: IssuePattern[] = [
  // Prohibited fee patterns under Tenant Fees Act 2019 (with regional variations)
  {
    pattern: /(\bfee|\bcharge|\bpayment).{0,50}(\bprohibited|\bbanned|\billegal|\bcleaning|\badministration|\breferencing|\binventory)/gi,
    title: "Potential Prohibited Fee",
    content: "The agreement may contain prohibited fees under relevant tenant protection legislation. This is legally non-compliant.",
    type: "warning",
    lawReference: UK_TENANCY_LAWS.TENANT_FEES_ACT,
    indicators: ["Prohibited Fee", "Tenant Protection Violation"],
    applicableRegions: ['england', 'wales', 'scotland', 'northern-ireland'],
    regionalVariations: {
      'wales': {
        content: "The agreement may contain prohibited fees under the Renting Homes (Wales) Act 2016. This is legally non-compliant."
      },
      'scotland': {
        content: "The agreement may contain prohibited fees under the Tenant Fees (Scotland) Act 2022. This is legally non-compliant with stricter Scottish enforcement."
      },
      'northern-ireland': {
        content: "The agreement may contain prohibited fees under Northern Ireland tenancy regulations. Check local restrictions."
      }
    }
  },
  
  // Deposit protection issues
  {
    pattern: /deposit.{0,100}(within 30 days|within thirty days|protection scheme|TDS|DPS|mydeposits)/gi,
    title: "Deposit Protection Information",
    content: "The agreement mentions deposit protection requirements, which is legally required. Check that it specifies a government-approved scheme and timely protection.",
    type: "primary",
    lawReference: UK_TENANCY_LAWS.DEPOSIT_PROTECTION,
  },
  {
    pattern: /deposit.{0,30}(exceed|more than).{0,20}(5|five) weeks/gi,
    title: "Excessive Deposit",
    content: "The agreement may specify a deposit exceeding the 5-week rent limit established by the Tenant Fees Act 2019. This is legally non-compliant.",
    type: "warning",
    lawReference: UK_TENANCY_LAWS.TENANT_FEES_ACT,
    indicators: ["Excessive Deposit", "Tenant Fees Act Violation"]
  },
  
  // Repair responsibility issues
  {
    pattern: /(tenant|lessee).{0,50}(respons|liable|obligation).{0,100}(repair|maintain|fix|rectif).{0,100}(structure|exterior|supply|service|utility|gas|electric|water)/gi,
    title: "Potential Repair Responsibility Concerns",
    content: "The agreement may shift landlord repair responsibilities to tenants, contrary to the Landlord and Tenant Act 1985. This is legally non-compliant.",
    type: "warning",
    lawReference: UK_TENANCY_LAWS.LANDLORD_TENANT_ACT,
    indicators: ["Unfair Repair Terms", "Statutory Violation"]
  },
  
  // Right to Rent checks
  {
    pattern: /right.{0,5}to.{0,5}rent.{0,50}(check|verification|immigration)/gi,
    title: "Right to Rent Documentation",
    content: "The agreement mentions right to rent checks, which are legally required under the Immigration Act 2014. Ensure the landlord has verified your immigration status.",
    type: "primary",
    lawReference: UK_TENANCY_LAWS.RIGHT_TO_RENT,
  },
  
  // Unfair terms - preventing rent withholding
  {
    pattern: /(tenant|lessee).{0,50}(not|never|shall not).{0,100}(withhold|deduct|reduce).{0,100}(rent|payment)/gi,
    title: "Rent Withholding Restrictions",
    content: "The agreement may contain terms preventing you from legitimately withholding rent for serious disrepair, which may be legally unfair under the Consumer Rights Act 2015.",
    type: "warning",
    lawReference: UK_TENANCY_LAWS.CONSUMER_RIGHTS_ACT,
    indicators: ["Unfair Term", "Consumer Rights Issue"]
  },
  
  // Unfair terms - pets/children ban
  {
    pattern: /(no|not|never|prohibited|forbidden).{0,20}(pets|animals|children|kids)/gi,
    title: "Potential Unreasonable Ban",
    content: "The agreement contains restrictions on pets or children which, while legally valid, may be unfair depending on the property type and circumstances. This is legal but may not be tenant-friendly.",
    type: "accent",
    lawReference: UK_TENANCY_LAWS.CONSUMER_RIGHTS_ACT,
    indicators: ["Lifestyle Restriction", "Potential Negotiation Point"]
  },
  
  // Landlord access without notice
  {
    pattern: /(landlord|lessor|owner|agent).{0,100}(access|enter|entry|inspect|visit).{0,100}(without notice|any time|anytime|reasonable times)/gi,
    title: "Landlord Access Concerns",
    content: "The agreement may allow landlord access without sufficient notice (normally 24 hours). This could violate your right to quiet enjoyment and may be legally unfair.",
    type: "warning",
    lawReference: UK_TENANCY_LAWS.CONSUMER_RIGHTS_ACT,
    indicators: ["Access Rights", "Quiet Enjoyment"]
  },
  
  // Section 21 restrictions (England/Wales only)
  {
    pattern: /(section 21|eviction|notice to quit|terminate).{0,100}(gas safety|electrical safety|epc|how to rent|deposit protection)/gi,
    title: "No-Fault Eviction Information",
    content: "The agreement references requirements for valid no-fault eviction notices, which is good practice. Landlords must provide specific documents to serve valid eviction notices.",
    type: "primary",
    lawReference: UK_TENANCY_LAWS.HOUSING_ACT,
    applicableRegions: ['england', 'wales'],
    regionalVariations: {
      'wales': {
        title: "Welsh No-Fault Eviction Requirements",
        content: "Under the Renting Homes (Wales) Act, landlords need 6 months notice for no-fault evictions and must meet stricter requirements."
      },
      'scotland': {
        title: "No-Fault Evictions Not Applicable",
        content: "Scotland has abolished no-fault evictions under the Private Housing (Tenancies) (Scotland) Act 2016. Any such clauses are invalid."
      },
      'northern-ireland': {
        content: "Northern Ireland has similar no-fault eviction provisions but with different notice periods and requirements."
      }
    }
  },
  
  // Unfair additional payments or increases
  {
    pattern: /(increase|raise|additional|extra).{0,50}(rent|payment|charge|fee).{0,100}(discretion|reasonable|market|periodic|landlord)/gi,
    title: "Rent Increase Provisions",
    content: "The agreement contains rent increase provisions. Check they are fair, transparent and follow proper procedure. Arbitrary or excessive increases may be legally unfair.",
    type: "accent",
    lawReference: UK_TENANCY_LAWS.CONSUMER_RIGHTS_ACT,
    indicators: ["Financial Terms", "Rent Stability"]
  },
  
  // Unfair or excessive cleaning requirements
  {
    pattern: /(professional|deep).{0,20}(clean|cleaning).{0,100}(end|termination|vacate)/gi,
    title: "End of Tenancy Cleaning Requirements",
    content: "The agreement requires professional cleaning at the end of tenancy, which may be a prohibited requirement under the Tenant Fees Act unless the property was professionally cleaned before you moved in.",
    type: "warning",
    lawReference: UK_TENANCY_LAWS.TENANT_FEES_ACT,
    indicators: ["Cleaning Requirement", "Potential Prohibited Term"]
  },
  
  // Potential unilateral changes
  {
    pattern: /(landlord|lessor|owner).{0,50}(right|discretion|sole).{0,50}(change|alter|amend|modify|update).{0,50}(terms|rules|agreement|conditions)/gi,
    title: "Unilateral Amendment Concerns",
    content: "The agreement may allow the landlord to change terms without your consent, which could be legally unfair under the Consumer Rights Act 2015.",
    type: "warning",
    lawReference: UK_TENANCY_LAWS.CONSUMER_RIGHTS_ACT,
    indicators: ["Unfair Term", "Contract Stability"]
  },
  
  // Early termination fees (Based on 2024 London Tribunal case)
  {
    pattern: /(early.?termination|break.?clause).{0,100}(fee|charge|payment|penalty|cost|expense)/gi,
    title: "Early Termination Fees (2024 Update)",
    content: "The agreement contains early termination fees. Following 2024 London Tribunal decisions, charging tenants for lost rent, re-letting fees, or reduced rent to new tenants constitutes a prohibited payment under the Tenant Fees Act 2019.",
    type: "warning",
    lawReference: UK_TENANCY_LAWS.TENANT_FEES_ACT,
    indicators: ["Prohibited Payment", "2024 Case Law", "Early Termination"],
    applicableRegions: ['england', 'wales', 'scotland']
  },
  
  // HMO licensing requirements (Enhanced based on 2024 case law)
  {
    pattern: /(HMO|house.?in.?multiple.?occupation|shared.?house|licensable|licensing).{0,100}(required|mandatory|council|local.?authority|compliance)/gi,
    title: "HMO Licensing Requirements (2024 Enforcement Update)",
    content: "The property may require HMO licensing. Recent 2024 cases (Housing 35 Plus Ltd v Nottingham) show strict enforcement with £15,000+ penalties. Tenants can claim rent repayment orders from unlicensed HMO operators (upheld in Shah 2024 case).",
    type: "primary",
    lawReference: UK_TENANCY_LAWS.HMO_ADDITIONAL_LICENSING,
    indicators: ["HMO Licensing", "Rent Repayment Rights", "2024 Enforcement", "£15,000 Penalties"]
  },
  
  // Service charge allocation flexibility (Based on Accent Housing 2024)
  {
    pattern: /(service.?charge|management.?fee).{0,100}(proportionate|fair.?proportion|allocation|calculation|method)/gi,
    title: "Service Charge Allocation Method (2024 Court of Appeal)",
    content: "The agreement specifies service charge allocation methods. Following Accent Housing v Howe Properties [2024] EWCA Civ, 'proportionate part' and 'fair proportion' allow flexibility beyond strict mathematical division, but charges must still be reasonable.",
    type: "primary",
    lawReference: UK_TENANCY_LAWS.LANDLORD_TENANT_ACT,
    indicators: ["Service Charges", "2024 Case Law", "Allocation Flexibility"]
  },
  
  // Section 21 notice references (Updated for Renters' Rights Bill)
  {
    pattern: /(section.?21|no.?fault.?eviction|fixed.?term.?tenancy|periodic.?tenancy|notice.?to.?quit).{0,100}(valid|prescribed|deposit.?protection|gas.?safety|EPC|how.?to.?rent)/gi,
    title: "Section 21 Notice Requirements (Renters' Rights Bill 2024)",
    content: "The agreement references Section 21 eviction procedures. Important: The government proposes to abolish Section 21 no-fault evictions by summer 2025 under the Renters' Rights Bill. Current strict compliance requirements remain (Trecarrell House precedent applies).",
    type: "accent",
    lawReference: UK_TENANCY_LAWS.RENTERS_RIGHTS_BILL,
    indicators: ["Section 21 Abolition", "Legislative Change", "Enhanced Security", "2025 Timeline"],
    applicableRegions: ['england']
  },
  
  // Electrical safety requirements (Enhanced pattern)
  {
    pattern: /(electrical|EICR|electrical.?installation|electrical.?safety).{0,100}(certificate|inspection|check|report|compliance|every.?5.?years)/gi,
    title: "Electrical Safety Requirements (2020 Standards)",
    content: "The agreement mentions electrical safety requirements. Under the Electrical Safety Standards in the Private Rented Sector (England) Regulations 2020, landlords must obtain EICR certificates every 5 years and provide copies to tenants.",
    type: "primary",
    lawReference: UK_TENANCY_LAWS.ELECTRICAL_SAFETY_STANDARDS,
    indicators: ["EICR Required", "5-Year Renewals", "Mandatory Standards"],
    applicableRegions: ['england']
  },
  
  // Double recovery of costs (Based on 2024 tribunal ruling)
  {
    pattern: /(re.?letting|letting.?fee|agency.?fee).{0,100}(tenant.?liable|tenant.?responsible|tenant.?pays|recoverable)/gi,
    title: "Double Recovery of Letting Costs (2024 Tribunal)",
    content: "The agreement may make tenants liable for re-letting or agency fees. The 2024 London Tribunal ruled this constitutes 'double recovery' as costs can be transferred to new lettings. This violates the Tenant Fees Act 2019.",
    type: "warning",
    lawReference: UK_TENANCY_LAWS.TENANT_FEES_ACT,
    indicators: ["Double Recovery", "Prohibited Payment", "2024 Tribunal Decision"],
    applicableRegions: ['england', 'wales', 'scotland']
  }
];

/**
 * Pre-screens a document content for known UK tenancy law issues with regional awareness
 * This is used before the main AI analysis to improve accuracy
 * 
 * @param documentContent The full document content as string
 * @param region Optional region override, will auto-detect if not provided
 * @param address Optional property address for better region detection
 * @returns Array of Insight objects for known issues with performance metrics
 */
export function preScreenDocumentForLegalIssues(
  documentContent: string, 
  region?: UKRegion, 
  address?: string
): { insights: Insight[]; metrics: PerformanceMetrics } {
  if (!documentContent || documentContent.trim() === '') {
    return { 
      insights: [], 
      metrics: startPerformanceTracking('england', 'unknown') 
    };
  }
  
  // Detect region if not provided
  const detectedRegion = region || detectUKRegion(documentContent, address);
  const metrics = startPerformanceTracking(detectedRegion, 'tenancy-agreement');
  
  console.log(`Pre-screening document for ${detectedRegion.toUpperCase()} tenancy law issues...`);
  
  const insights: Insight[] = [];
  
  // Check document against each known issue pattern
  ISSUE_PATTERNS.forEach(issuePattern => {
    const matches = documentContent.match(issuePattern.pattern);
    
    if (matches && matches.length > 0) {
      // For each match, get contextual information
      const uniqueMatches = Array.from(new Set(matches));
      const matchExamples: string[] = [];
      const positions: number[] = [];
      
      uniqueMatches.forEach(match => {
        const cleanMatch = match.replace(/[\r\n\s]+/g, ' ').trim();
        const matchPosition = documentContent.indexOf(match);
        
        if (matchPosition !== -1) {
          matchExamples.push(cleanMatch);
          positions.push(matchPosition);
          
          // Log potential issue for debugging/analysis
          console.log(`Pre-analysis detected potential issue: ${issuePattern.title}`);
          console.log(`Matching text: "${cleanMatch}"`);
          console.log(`Found in clause at position ${matchPosition}`);
        }
      });
      
      // Apply regional variations if available
      const regionalVariation = issuePattern.regionalVariations?.[detectedRegion];
      const regionalLawRef = getRegionalLawReference(
        Object.keys(UK_TENANCY_LAWS).find(key => UK_TENANCY_LAWS[key] === issuePattern.lawReference) || '',
        detectedRegion
      ) || issuePattern.lawReference;
      
      // Create an insight for this issue with regional context
      const insight: Insight = {
        title: regionalVariation?.title || issuePattern.title,
        content: (regionalVariation?.content || issuePattern.content) + 
          (positions.length > 1 ? ` This pattern appears ${positions.length} times in the agreement.` : '') +
          ` (${detectedRegion.toUpperCase()} law applies)`,
        type: issuePattern.type,
        indicators: issuePattern.indicators || [
          `Based on ${regionalLawRef.name} ${regionalLawRef.year}`,
          `Found at position ${positions[0]}`,
          `Region: ${detectedRegion.toUpperCase()}`
        ]
      };
      
      insights.push(insight);
    }
  });
  
  const finalMetrics = endPerformanceTracking(metrics);
  
  if (insights.length > 0) {
    console.log(`Pre-analysis detected ${insights.length} potential issues for ${detectedRegion.toUpperCase()}`);
  } else {
    console.log(`No known issues detected in pre-screening for ${detectedRegion.toUpperCase()}`);
  }
  
  return { insights, metrics: finalMetrics };
}

/**
 * Analyzes document compliance with key UK tenancy laws
 * Returns an overall compliance assessment
 * 
 * @param documentContent The full document content
 * @returns Compliance results and score
 */
export interface ComplianceResult {
  requirement: string;
  lawReference: string;
  found: boolean;
  region?: UKRegion;
  critical?: boolean; // Whether this is a critical legal requirement
}

export function checkUKTenancyCompliance(
  documentContent: string,
  region?: UKRegion
): {
  results: ComplianceResult[];
  score: number;
  region?: UKRegion;
  criticalIssues?: number;
} {
  if (!documentContent) {
    const detectedRegion = region || 'england';
    return { results: [], score: 0, region: detectedRegion, criticalIssues: 0 };
  }
  
  const detectedRegion = region || detectUKRegion(documentContent);
  console.log(`Checking compliance for ${detectedRegion.toUpperCase()} tenancy laws...`);
  
  // Key compliance requirements for UK tenancy agreements
  const complianceRequirements: ComplianceResult[] = [
    {
      requirement: "Deposit protection scheme specified",
      lawReference: "Housing Act 2004",
      found: /deposit.{0,100}(protection scheme|protected scheme|TDS|DPS|mydeposits|deposit protection)/gi.test(documentContent)
    },
    {
      requirement: "Gas safety certificate mentioned",
      lawReference: "Gas Safety Regulations 1998",
      found: /gas safety (certificate|record|check)/gi.test(documentContent)
    },
    {
      requirement: "Electrical safety checks mentioned",
      lawReference: "Electrical Safety Standards 2020",
      found: /electrical (safety|inspection|certificate|check)/gi.test(documentContent)
    },
    {
      requirement: "Energy Performance Certificate (EPC) mentioned",
      lawReference: "Energy Performance Regulations 2012",
      found: /energy performance certificate|EPC/gi.test(documentContent)
    },
    {
      requirement: "Tenant's right to quiet enjoyment acknowledged",
      lawReference: "Common Law",
      found: /quiet enjoyment|peaceful occupation/gi.test(documentContent)
    },
    {
      requirement: "Landlord repair responsibilities stated",
      lawReference: "Landlord and Tenant Act 1985",
      found: /landlord.{0,50}(responsible|responsibility|obligation).{0,100}(repair|maintain)/gi.test(documentContent)
    },
    {
      requirement: "Tenant's deposit limited to 5 weeks' rent",
      lawReference: "Tenant Fees Act 2019",
      found: !/(deposit|security).{0,30}(exceed|more than).{0,20}(5|five) weeks/gi.test(documentContent)
    },
    {
      requirement: "No prohibited fees (admin, reference, etc.)",
      lawReference: "Tenant Fees Act 2019",
      found: !/(fee|charge|payment).{0,30}(administrative|referencing|credit check|inventory|cleaning)/gi.test(documentContent)
    },
    {
      requirement: "Proper notice periods specified",
      lawReference: "Housing Act 1988",
      found: /(notice period|notice of).{0,50}(1 month|2 months|one month|two months)/gi.test(documentContent)
    },
    {
      requirement: "No unfair terms limiting tenant rights",
      lawReference: "Consumer Rights Act 2015",
      found: !/(tenant|lessee).{0,50}(waive|surrender|give up).{0,50}(right|protection|claim)/gi.test(documentContent)
    }
  ];
  
  // Calculate compliance score with weighted critical requirements
  const compliantItems = complianceRequirements.filter(req => req.found).length;
  const criticalRequirements = complianceRequirements.filter(req => req.critical);
  const criticalCompliant = criticalRequirements.filter(req => req.found).length;
  const criticalIssues = criticalRequirements.length - criticalCompliant;
  
  // Weight critical requirements more heavily (70% of score)
  const criticalScore = criticalRequirements.length > 0 ? 
    (criticalCompliant / criticalRequirements.length) * 70 : 70;
  const nonCriticalScore = complianceRequirements.length > criticalRequirements.length ?
    ((compliantItems - criticalCompliant) / (complianceRequirements.length - criticalRequirements.length)) * 30 : 30;
  
  const score = Math.round(criticalScore + nonCriticalScore);
  
  console.log(`Compliance check complete for ${detectedRegion.toUpperCase()}: ${score}% (${criticalIssues} critical issues)`);
  
  return {
    results: complianceRequirements,
    score,
    region: detectedRegion,
    criticalIssues
  };
}

/**
 * Helper function to check individual compliance requirements
 */
function checkRequirementCompliance(requirement: string, content: string, region: UKRegion): boolean {
  const lowerContent = content.toLowerCase();
  
  switch (requirement) {
    case "Deposit protection scheme specified":
    case "Occupation contract requirements met":
    case "Private Residential Tenancy (PRT) compliance":
      return /deposit.{0,100}(protection scheme|protected scheme|tds|dps|mydeposits|deposit protection)/gi.test(content);
    
    case "Gas safety certificate mentioned":
      return /gas safety (certificate|record|check)/gi.test(content);
    
    case "Electrical safety checks mentioned":
      return /electrical (safety|inspection|certificate|check)/gi.test(content);
    
    case "Energy Performance Certificate (EPC) mentioned":
      return /energy performance certificate|epc/gi.test(content);
    
    case "Tenant's right to quiet enjoyment acknowledged":
      return /quiet enjoyment|peaceful occupation/gi.test(content);
    
    case "Landlord repair responsibilities stated":
      return /landlord.{0,50}(responsible|responsibility|obligation).{0,100}(repair|maintain)/gi.test(content);
    
    case "Tenant's deposit limited to 5 weeks' rent":
    case "Tenant's deposit limited (Scottish rules)":
      return !/(deposit|security).{0,30}(exceed|more than).{0,20}(5|five) weeks/gi.test(content);
    
    case "No prohibited fees (admin, reference, etc.)":
      return !/(fee|charge|payment).{0,30}(administrative|referencing|credit check|inventory|cleaning)/gi.test(content);
    
    case "Proper notice periods specified":
    case "Scottish notice periods specified":
    case "Welsh notice periods specified":
      return /(notice period|notice of).{0,50}(1 month|2 months|one month|two months|6 months|six months)/gi.test(content);
    
    case "No unfair terms limiting tenant rights":
      return !/(tenant|lessee).{0,50}(waive|surrender|give up).{0,50}(right|protection|claim)/gi.test(content);
    
    case "Right to Rent compliance mentioned":
      return /right.{0,5}to.{0,5}rent.{0,50}(check|verification|immigration)/gi.test(content);
    
    default:
      return false;
  }
}

/**
 * Get relevant 2024 case law for specific tenancy issues
 * Integrates with the new legal precedents database
 */
export function getRelevantCaseLaw(documentContent: string): string[] {
  const caseReferences: string[] = [];
  
  // Check for tenant fees issues
  if (/(fee|charge|payment).{0,50}(prohibited|early.?termination)/gi.test(documentContent)) {
    const tenantFeesCases = getCasesForTenancyIssue("tenant fees");
    tenantFeesCases.forEach(case_item => {
      caseReferences.push(formatLegalCitation(case_item));
    });
  }
  
  // Check for HMO-related content
  if (/(HMO|house.?in.?multiple|shared.?house)/gi.test(documentContent)) {
    const hmoCases = getCasesForTenancyIssue("HMO");
    hmoCases.forEach(case_item => {
      caseReferences.push(formatLegalCitation(case_item));
    });
  }
  
  // Check for deposit protection
  if (/deposit.{0,50}(protection|scheme|TDS|DPS)/gi.test(documentContent)) {
    const depositCases = getCasesForTenancyIssue("deposit protection");
    depositCases.forEach(case_item => {
      caseReferences.push(formatLegalCitation(case_item));
    });
  }
  
  // Check for service charges
  if (/(service.?charge|management.?fee)/gi.test(documentContent)) {
    const serviceCases = getCasesForTenancyIssue("service charge");
    serviceCases.forEach(case_item => {
      caseReferences.push(formatLegalCitation(case_item));
    });
  }
  
  return Array.from(new Set(caseReferences)); // Remove duplicates
}

/**
 * Enhanced pre-screening with 2024 legal developments and regional awareness
 */
export function preScreenWithRecentCaseLaw(documentContent: string): {
  insights: Insight[];
  relevantCaseLaw: string[];
  legislativeUpdates: string[];
  regionalCompliance: any;
} {
  const screeningResult = preScreenDocumentForLegalIssues(documentContent);
  const insights = screeningResult.insights;
  const relevantCaseLaw = getRelevantCaseLaw(documentContent);
  
  const legislativeUpdates: string[] = [];
  
  // Check for Section 21 references and add Renters' Rights Bill update
  if (/(section.?21|no.?fault)/gi.test(documentContent)) {
    legislativeUpdates.push("Renters' Rights Bill 2024: Section 21 no-fault evictions to be abolished by summer 2025");
  }
  
  // Check for electrical safety mentions
  if (/(electrical|EICR)/gi.test(documentContent)) {
    legislativeUpdates.push("Electrical Safety Standards 2020: Mandatory EICR certificates required every 5 years");
  }
  
  // Check for HMO licensing
  if (/(HMO|shared.?house)/gi.test(documentContent)) {
    legislativeUpdates.push("2024 HMO Enforcement: £15,000+ penalties for unlicensed operations, rent repayment orders available");
  }
  
  // Check for early termination fees
  if (/(early.?termination|break.?clause).{0,50}(fee|charge)/gi.test(documentContent)) {
    legislativeUpdates.push("2024 Tribunal Decision: Early termination fees and re-letting costs are prohibited payments");
  }
  
  return {
    insights,
    relevantCaseLaw,
    legislativeUpdates,
    regionalCompliance: screeningResult.metrics
  };
}

/**
 * Get 2024 legal precedent summary for AI prompts
 */
export function getLegalPrecedentSummary(): string {
  return `
## 2024-2025 UK Housing Law Updates and Recent Case Law

### Key Recent Cases:
1. **Switaj v McClenaghan [2024] EWCA Civ 1457** - Tenant Fees Act does not apply retrospectively to pre-2019 payments
2. **London Tribunal June 2024** - Early termination fees and re-letting costs constitute prohibited payments (£2,252 penalty)
3. **Housing 35 Plus Ltd v Nottingham City Council (Upper Tribunal 2024)** - Strict HMO licensing enforcement, £15,000 penalties
4. **Shah Rent Repayment Case (Upper Tribunal 2024)** - Rent repayment orders upheld for unlicensed HMO operators
5. **Accent Housing v Howe Properties [2024] EWCA Civ** - Service charge allocation allows flexibility in "proportionate part" calculations
6. **Hajan v London Borough of Brent [2024] EWCA Civ 1260** - Possession claims can be amended to add absolute grounds

### Legislative Developments:
- **Renters' Rights Bill 2024**: Section 21 no-fault evictions to be abolished by summer 2025
- **Enhanced HMO Enforcement**: Stricter licensing requirements with significant penalties
- **Electrical Safety Standards**: EICR certificates mandatory every 5 years (England)

### Key Enforcement Trends:
- Zero tolerance for prohibited payments under Tenant Fees Act 2019
- Increased HMO licensing enforcement with £15,000+ penalties
- Tenant rights strengthening with enhanced rent repayment order availability
- Service charge disputes requiring detailed lease analysis
- Deposit protection compliance strictly enforced (1-3x deposit penalties)
`;
}