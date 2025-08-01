import { Insight } from '@shared/schema';

/**
 * UK Tenancy Law Knowledge Base for pre-screening documents
 * This enhances analysis accuracy by detecting common legal issues
 * before the full AI analysis begins
 */

interface LawReference {
  name: string;
  section?: string;
  year: number;
  description: string;
}

interface IssuePattern {
  pattern: RegExp;
  title: string;
  content: string;
  type: "primary" | "accent" | "warning";
  lawReference: LawReference;
  indicators?: string[];
}

/**
 * Common UK tenancy law references
 */
const UK_TENANCY_LAWS: Record<string, LawReference> = {
  TENANT_FEES_ACT: {
    name: "Tenant Fees Act",
    year: 2019,
    description: "Prohibits landlords and letting agents from charging certain fees to tenants and caps deposits"
  },
  HOUSING_ACT: {
    name: "Housing Act",
    section: "Section 21",
    year: 1988,
    description: "Regulates no-fault evictions and notice periods"
  },
  LANDLORD_TENANT_ACT: {
    name: "Landlord and Tenant Act",
    section: "Section 11",
    year: 1985,
    description: "Defines landlord's repair and maintenance responsibilities"
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
    description: "Requires tenant deposits to be protected in a government-approved scheme"
  },
  RIGHT_TO_RENT: {
    name: "Immigration Act (Right to Rent)",
    year: 2014,
    description: "Requires landlords to check immigration status of tenants"
  }
};

/**
 * Common patterns to identify potentially problematic clauses
 */
const ISSUE_PATTERNS: IssuePattern[] = [
  // Prohibited fee patterns under Tenant Fees Act 2019
  {
    pattern: /(\bfee|\bcharge|\bpayment).{0,50}(\bprohibited|\bbanned|\billegal|\bcleaning|\badministration|\breferencing|\binventory)/gi,
    title: "Potential Prohibited Fee",
    content: "The agreement may contain prohibited fees under the Tenant Fees Act 2019. This is legally non-compliant.",
    type: "warning",
    lawReference: UK_TENANCY_LAWS.TENANT_FEES_ACT,
    indicators: ["Prohibited Fee", "Tenant Fees Act Violation"]
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
  
  // Section 21 restrictions
  {
    pattern: /(section 21|eviction|notice to quit|terminate).{0,100}(gas safety|electrical safety|epc|how to rent|deposit protection)/gi,
    title: "Section 21 Compliance Information",
    content: "The agreement references requirements for valid Section 21 notices, which is good practice. Landlords must provide specific documents to serve valid eviction notices.",
    type: "primary",
    lawReference: UK_TENANCY_LAWS.HOUSING_ACT
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
  }
];

/**
 * Pre-screens a document content for known UK tenancy law issues
 * This is used before the main AI analysis to improve accuracy
 * 
 * @param documentContent The full document content as string
 * @returns Array of Insight objects for known issues
 */
export function preScreenDocumentForLegalIssues(documentContent: string): Insight[] {
  if (!documentContent || documentContent.trim() === '') {
    return [];
  }
  
  console.log("Pre-screening document for UK tenancy law issues...");
  
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
      
      // Create an insight for this issue
      const insight: Insight = {
        title: issuePattern.title,
        content: issuePattern.content + (positions.length > 1 
          ? ` This pattern appears ${positions.length} times in the agreement.` 
          : ''),
        type: issuePattern.type,
        indicators: issuePattern.indicators || [
          `Based on ${issuePattern.lawReference.name} ${issuePattern.lawReference.year}`,
          `Found at position ${positions[0]}`
        ]
      };
      
      insights.push(insight);
    }
  });
  
  if (insights.length > 0) {
    console.log(`Pre-analysis detected ${insights.length} potential issues`);
  } else {
    console.log("No known issues detected in pre-screening");
  }
  
  return insights;
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
}

export function checkUKTenancyCompliance(documentContent: string): {
  results: ComplianceResult[];
  score: number;
} {
  if (!documentContent) {
    return { results: [], score: 0 };
  }
  
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
  
  // Calculate compliance score (percentage of requirements met)
  const compliantItems = complianceRequirements.filter(req => req.found).length;
  const score = Math.round((compliantItems / complianceRequirements.length) * 100);
  
  return {
    results: complianceRequirements,
    score
  };
}