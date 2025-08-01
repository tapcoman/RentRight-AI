import { UKRegion, PerformanceMetrics } from './uk-tenancy-laws';

/**
 * Optimized Prompt System for RentRight-AI
 * 
 * This system provides token-efficient prompts while maintaining legal accuracy
 * Features:
 * - Region-specific prompt variations
 * - Document type-specific prompts  
 * - Hierarchical prompt structures
 * - Performance monitoring integration
 */

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  baseTokens: number; // Estimated base token count
  applicableRegions: UKRegion[];
  documentTypes: string[];
  template: string;
  variations?: { [key in UKRegion]?: string };
}

export interface DocumentType {
  type: string;
  keywords: string[];
  promptModifiers: string[];
}

// Document type detection patterns
export const DOCUMENT_TYPES: DocumentType[] = [
  {
    type: 'residential-tenancy',
    keywords: ['tenancy agreement', 'rental agreement', 'lease agreement', 'assured shorthold', 'residential'],
    promptModifiers: ['Focus on tenant rights', 'Check deposit protection', 'Verify repair obligations']
  },
  {
    type: 'commercial-lease',
    keywords: ['commercial lease', 'business premises', 'commercial tenancy', 'office lease', 'retail lease'],
    promptModifiers: ['Focus on business use clauses', 'Check service charges', 'Verify break clauses']
  },
  {
    type: 'lodger-agreement',
    keywords: ['lodger agreement', 'live-in landlord', 'excluded occupancy', 'house share'],
    promptModifiers: ['Note excluded occupancy status', 'Check notice periods', 'Verify access rights']
  },
  {
    type: 'student-accommodation',
    keywords: ['student accommodation', 'university housing', 'halls of residence', 'student tenancy'],
    promptModifiers: ['Check academic year alignment', 'Verify joint liability', 'Review parental guarantees']
  }
];

// Core optimized prompt templates
export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'efficient-analysis',
    name: 'Efficient Legal Analysis',
    description: 'Streamlined prompt for standard tenancy analysis',
    baseTokens: 350,
    applicableRegions: ['england', 'wales', 'scotland', 'northern-ireland'],
    documentTypes: ['residential-tenancy', 'lodger-agreement'],
    template: `Analyze this UK residential tenancy document for legal compliance and tenant protection.

REGIONAL LAW: Apply {REGION} housing legislation.
FOCUS AREAS: 
• Tenant rights & protections
• Financial terms & deposits  
• Notice periods & termination
• Repair obligations
• Prohibited terms

OUTPUT FORMAT (JSON):
{
  "propertyDetails": {"address":"", "type":"", "confidence":""},
  "financialTerms": {"monthlyRent":"", "deposit":"", "confidence":""},
  "leasePeriod": {"start":"", "end":"", "type":"", "confidence":""},
  "parties": {"landlord":"", "tenant":"", "confidence":""},
  "insights": [{"title":"", "content":"", "type":"", "indicators":[]}],
  "recommendations": [{"content":""}],
  "complianceScore": 0,
  "compliance": {"score":0, "level":"", "summary":""}
}

DOCUMENT:
{CONTENT}`,
    variations: {
      'wales': 'Apply Renting Homes (Wales) Act 2016 - occupation contracts, enhanced tenant rights.',
      'scotland': 'Apply Private Housing (Tenancies) (Scotland) Act 2016 - PRT rules, no Section 21.',
      'northern-ireland': 'Apply Private Tenancies (Northern Ireland) Order 2006 - NI specific provisions.'
    }
  },
  {
    id: 'fast-prescreening',
    name: 'Fast Pre-screening',
    description: 'Quick initial document assessment',
    baseTokens: 200,
    applicableRegions: ['england', 'wales', 'scotland', 'northern-ireland'],
    documentTypes: ['residential-tenancy', 'commercial-lease', 'lodger-agreement'],
    template: `Quick UK tenancy compliance check for {REGION}.

SCAN FOR:
• Prohibited fees (Tenant Fees Act compliance)
• Deposit protection requirements
• Unfair contract terms
• Missing safety certificates
• Invalid notice periods

Rate issues: CRITICAL/MODERATE/MINOR
Provide compliance score (0-100).

DOCUMENT EXCERPT:
{CONTENT}`
  },
  {
    id: 'detailed-clause-analysis',
    name: 'Detailed Clause Analysis',
    description: 'Deep analysis for complex documents',
    baseTokens: 500,
    applicableRegions: ['england', 'wales', 'scotland', 'northern-ireland'],
    documentTypes: ['commercial-lease', 'complex-residential'],
    template: `Comprehensive {REGION} tenancy law analysis. Examine each clause for legal compliance.

LEGAL FRAMEWORK ({REGION}):
{REGIONAL_LAWS}

CLAUSE-BY-CLAUSE REVIEW:
• Identify problematic terms
• Cite specific legal violations
• Rate severity (HIGH/MEDIUM/LOW)
• Suggest alternatives

CRITICAL AREAS:
• Consumer Rights Act fairness
• Statutory repair obligations  
• Deposit/fee restrictions
• Termination procedures

DOCUMENT:
{CONTENT}`
  }
];

// Regional law summaries for efficient prompting
export const REGIONAL_LAW_SUMMARIES: { [key in UKRegion]: string } = {
  'england': 'Housing Act 1988, Tenant Fees Act 2019, Consumer Rights Act 2015, Landlord & Tenant Act 1985',
  'wales': 'Renting Homes (Wales) Act 2016, Housing (Wales) Act 2014, Rent Smart Wales licensing',
  'scotland': 'Private Housing (Tenancies) (Scotland) Act 2016, Tenant Fees (Scotland) Act 2022, Repairing Standard',
  'northern-ireland': 'Private Tenancies (NI) Order 2006, Houses in Multiple Occupation Act (NI) 2016'
};

/**
 * Detects document type from content
 */
export function detectDocumentType(content: string): string {
  const lowerContent = content.toLowerCase();
  
  for (const docType of DOCUMENT_TYPES) {
    const matchCount = docType.keywords.filter(keyword => 
      lowerContent.includes(keyword.toLowerCase())
    ).length;
    
    if (matchCount >= 1) {
      return docType.type;
    }
  }
  
  return 'residential-tenancy'; // Default fallback
}

/**
 * Selects optimal prompt template based on document characteristics
 */
export function selectOptimalPrompt(
  documentLength: number,
  region: UKRegion,
  documentType: string,
  requiresDetailedAnalysis: boolean = false
): PromptTemplate {
  
  // For very large documents or when detailed analysis is requested
  if (documentLength > 15000 || requiresDetailedAnalysis) {
    return PROMPT_TEMPLATES.find(t => t.id === 'detailed-clause-analysis')!;
  }
  
  // For quick initial screening
  if (documentLength < 3000) {
    return PROMPT_TEMPLATES.find(t => t.id === 'fast-prescreening')!;
  }
  
  // Standard efficient analysis for most cases
  return PROMPT_TEMPLATES.find(t => t.id === 'efficient-analysis')!;
}

/**
 * Builds optimized prompt with regional and document-specific variations
 */
export function buildOptimizedPrompt(
  template: PromptTemplate,
  content: string,
  region: UKRegion,
  documentType: string,
  maxContentLength: number = 8000
): { prompt: string; estimatedTokens: number; truncated: boolean } {
  
  let prompt = template.template;
  let truncated = false;
  
  // Apply regional variation if available
  const regionalVariation = template.variations?.[region];
  if (regionalVariation) {
    prompt = prompt.replace('{REGIONAL_LAWS}', REGIONAL_LAW_SUMMARIES[region]);
  }
  
  // Truncate content if necessary to stay within token limits
  let processedContent = content;
  if (content.length > maxContentLength) {
    // Smart truncation - keep beginning and end, summarize middle
    const keepLength = Math.floor(maxContentLength * 0.4);
    const beginning = content.substring(0, keepLength);
    const ending = content.substring(content.length - keepLength);
    processedContent = `${beginning}\n\n[... MIDDLE SECTION TRUNCATED FOR EFFICIENCY ...]\n\n${ending}`;
    truncated = true;
  }
  
  // Replace placeholders
  prompt = prompt
    .replace('{REGION}', region.toUpperCase())
    .replace('{CONTENT}', processedContent)
    .replace('{REGIONAL_LAWS}', REGIONAL_LAW_SUMMARIES[region]);
  
  // Estimate token count (rough approximation: 1 token ≈ 4 characters)
  const estimatedTokens = Math.ceil(prompt.length / 4);
  
  return {
    prompt,
    estimatedTokens,
    truncated
  };
}

/**
 * Creates chunked prompts for very large documents
 */
export function createChunkedPrompts(
  content: string,
  region: UKRegion,
  chunkSize: number = 6000,
  overlap: number = 500
): Array<{ prompt: string; chunkIndex: number; isLastChunk: boolean }> {
  
  const chunks: Array<{ prompt: string; chunkIndex: number; isLastChunk: boolean }> = [];
  const contentLength = content.length;
  
  for (let i = 0; i < contentLength; i += chunkSize - overlap) {
    const chunkEnd = Math.min(i + chunkSize, contentLength);
    const chunk = content.substring(i, chunkEnd);
    const isLastChunk = chunkEnd >= contentLength;
    const chunkIndex = Math.floor(i / (chunkSize - overlap));
    
    const chunkPrompt = `Analyze this ${isLastChunk ? 'FINAL' : `PART ${chunkIndex + 1}`} section of a UK ${region.toUpperCase()} tenancy document.

${isLastChunk ? 
  'FINAL ANALYSIS: Provide complete JSON analysis based on ALL parts reviewed.' :
  'PARTIAL ANALYSIS: Note key issues, continue reading remaining parts.'
}

CHUNK ${chunkIndex + 1}:
${chunk}`;

    chunks.push({
      prompt: chunkPrompt,
      chunkIndex,
      isLastChunk
    });
  }
  
  return chunks;
}

/**
 * Performance-optimized prompt for parallel processing
 */
export function createParallelAnalysisPrompts(
  content: string,
  region: UKRegion
): {
  legalCompliancePrompt: string;
  financialTermsPrompt: string;
  riskAssessmentPrompt: string;
} {
  
  const baseContext = `UK ${region.toUpperCase()} tenancy document analysis.`;
  
  return {
    legalCompliancePrompt: `${baseContext}
TASK: Legal compliance check only.
FOCUS: Statutory violations, prohibited terms, missing requirements.
OUTPUT: JSON with complianceScore, critical issues list.
DOCUMENT: ${content.substring(0, 4000)}`,

    financialTermsPrompt: `${baseContext}
TASK: Financial terms extraction only.
FOCUS: Rent, deposits, fees, charges, payment terms.
OUTPUT: JSON with monthlyRent, deposit, fees, confidence scores.
DOCUMENT: ${content.substring(0, 4000)}`,

    riskAssessmentPrompt: `${baseContext}
TASK: Risk assessment only.
FOCUS: Tenant protection level, unfair terms, enforcement risks.
OUTPUT: JSON with risk level, protection score, key concerns.
DOCUMENT: ${content.substring(0, 4000)}`
  };
}

/**
 * Token usage optimization utilities
 */
export class TokenOptimizer {
  static removeRedundantSpaces(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }
  
  static abbreviateCommonTerms(text: string): string {
    const abbreviations: { [key: string]: string } = {
      'Landlord and Tenant Act 1985': 'LTA 1985',
      'Consumer Rights Act 2015': 'CRA 2015',
      'Tenant Fees Act 2019': 'TFA 2019',
      'Housing Act 1988': 'HA 1988',
      'the Landlord': 'LL',
      'the Tenant': 'T',
      'the Property': 'Property',
      'Assured Shorthold Tenancy': 'AST'
    };
    
    let optimized = text;
    Object.entries(abbreviations).forEach(([full, abbrev]) => {
      optimized = optimized.replace(new RegExp(full, 'g'), abbrev);
    });
    
    return optimized;
  }
  
  static extractKeyPhrases(text: string, maxPhrases: number = 20): string[] {
    const keyPhrasePatterns = [
      /rent.{0,30}(month|weekly|annual)/gi,
      /deposit.{0,30}(protection|scheme)/gi,
      /notice.{0,30}(period|month|weeks)/gi,
      /(prohibited|banned).{0,30}(fee|charge)/gi,
      /repair.{0,30}(obligation|responsibility)/gi
    ];
    
    const phrases: string[] = [];
    keyPhrasePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        phrases.push(...matches.slice(0, 3)); // Limit per pattern
      }
    });
    
    return phrases.slice(0, maxPhrases);
  }
}