import { ViolationType, DocumentType, AnalysisContext } from './legal-framework-types';

/**
 * Enhanced Legal Framework - Modular Prompt Templates
 * This module provides structured, modular prompt templates for different legal analysis types
 */

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  documentTypes: DocumentType[];
  analysisType: 'primary' | 'secondary' | 'specialized';
  template: string;
  systemInstructions: string;
  priority: number; // Higher priority templates are used first
  requiredContext?: string[];
}

export interface AnalysisPromptConfig {
  baseTemplate: PromptTemplate;
  contextualPrompts: PromptTemplate[];
  specializationPrompts: PromptTemplate[];
  validationPrompts: PromptTemplate[];
}

/**
 * Base template for all UK tenancy agreement analysis
 */
export const BASE_TENANCY_ANALYSIS_TEMPLATE: PromptTemplate = {
  id: 'base_tenancy_analysis',
  name: 'Base UK Tenancy Analysis',
  description: 'Core template for analyzing UK residential tenancy agreements',
  documentTypes: ['residential_tenancy', 'assured_shorthold_tenancy', 'periodic_tenancy'],
  analysisType: 'primary',
  priority: 100,
  template: `
Please analyze this UK residential tenancy agreement according to current UK housing laws and professional standards.

**DOCUMENT CONTENT:**
{documentContent}

**ANALYSIS FRAMEWORK:**
Apply the Enhanced Legal Protection Framework with hyper-vigilant tenant protection stance.

**REQUIRED OUTPUT STRUCTURE:**
Provide analysis in JSON format with these mandatory sections:
- propertyDetails (address, propertyType, size, confidence)
- financialTerms (monthlyRent, totalDeposit, depositProtection, permittedFees, prohibitedFees, confidence)
- leasePeriod (startDate, endDate, tenancyType, noticePeriod, confidence)
- parties (landlord, tenant, guarantor, agent, confidence)
- insights (array with title, content, type, indicators, rating, violationType, severity, impactScore, legalBasis)
- recommendations (array with content, priority, legalJustification, implementationDifficulty)
- complianceScore (0-100)
- compliance (score, level, summary, detailedBreakdown)
- riskAssessment (overallRisk, specificRisks, mitigationStrategies)
- confidenceMetrics (overallConfidence, dataQuality, analysisCompleteness)

**LEGAL FOCUS AREAS:**
{legalFocusAreas}

**SEVERITY CLASSIFICATION:**
{severityClassification}
`,
  systemInstructions: `
You are an expert UK housing law analyst with specialized knowledge in tenant protection.
Apply the Enhanced Legal Protection Framework with maximum thoroughness.
This is a premium analysis service - provide substantial value through comprehensive insights.
Always err on the side of caution when identifying potential legal issues.
`
};

/**
 * Specialized template for deposit-related analysis
 */
export const DEPOSIT_ANALYSIS_TEMPLATE: PromptTemplate = {
  id: 'deposit_specialized_analysis',
  name: 'Deposit Protection Specialized Analysis',
  description: 'Deep analysis of deposit terms and protection compliance',
  documentTypes: ['residential_tenancy', 'assured_shorthold_tenancy'],
  analysisType: 'specialized',
  priority: 90,
  template: `
**DEPOSIT PROTECTION DEEP ANALYSIS**

Focus specifically on deposit-related clauses and compliance with:
- Housing Act 2004 (Deposit Protection)
- Tenant Fees Act 2019 (Deposit Limits)
- Deregulation Act 2015 (Deposit Protection Requirements)

**KEY ANALYSIS POINTS:**
1. Deposit amount vs 5-week limit
2. Protection scheme specification (TDS, DPS, MyDeposits)
3. Timeline compliance (30-day protection requirement)
4. Prescribed information provision
5. Deposit return procedures
6. Deduction terms and fairness
7. Check-in/check-out procedures
8. Dispute resolution processes

**VIOLATION DETECTION:**
- Deposits exceeding 5 weeks' rent (except luxury properties over £50k/year)
- Missing protection scheme details
- Unclear deduction terms
- Unfair wear and tear clauses
- Professional cleaning requirements without reciprocal landlord obligation

Provide specialized insights with:
- violationType: "deposit_violation"
- severity: Based on legal seriousness
- impactScore: Financial impact on tenant
- legalBasis: Specific statute and section references
`,
  systemInstructions: `
Perform exhaustive analysis of all deposit-related terms.
Flag even minor compliance issues as they can void Section 21 notices.
Calculate precise financial impacts on tenants.
Reference specific legal requirements and penalties.
`
};

/**
 * Specialized template for repair responsibility analysis
 */
export const REPAIR_RESPONSIBILITY_TEMPLATE: PromptTemplate = {
  id: 'repair_responsibility_analysis',
  name: 'Repair Responsibility Analysis',
  description: 'Analysis of landlord vs tenant repair obligations',
  documentTypes: ['residential_tenancy', 'assured_shorthold_tenancy'],
  analysisType: 'specialized',
  priority: 85,
  template: `
**REPAIR RESPONSIBILITY ANALYSIS**

Analyze repair and maintenance clauses against:
- Landlord and Tenant Act 1985, Section 11
- Housing Act 2004 (HHSRS)
- Homes (Fitness for Human Habitation) Act 2018
- Consumer Rights Act 2015

**STATUTORY LANDLORD RESPONSIBILITIES:**
1. Structure and exterior maintenance
2. Heating and water installations
3. Electrical installations
4. Gas installations and safety
5. Sanitary facilities
6. Windows and external doors

**PROHIBITED TENANT OBLIGATIONS:**
- Structural repairs
- Major system maintenance
- External property maintenance
- Safety installations

**ANALYSIS FRAMEWORK:**
For each repair clause, determine:
- Legal compliance with Section 11
- Fair allocation of responsibilities
- Clarity of obligations
- Procedures for reporting and addressing repairs
- Time limits for landlord response
- Consequences of non-compliance

Rate each repair clause on tenant protection scale:
- Excellent (81-100): Full landlord statutory compliance
- Good (61-80): Compliant with minor tenant-friendly additions
- Fair (41-60): Legally compliant but basic
- Poor (0-40): Potential statutory violations or unfair shifting of responsibility
`,
  systemInstructions: `
Identify any attempt to shift statutory landlord responsibilities to tenants.
Even subtle language that could be interpreted as tenant liability should be flagged.
Consider the practical impact on tenants of repair procedures and timescales.
`
};

/**
 * Template for eviction and notice analysis
 */
export const EVICTION_NOTICE_TEMPLATE: PromptTemplate = {
  id: 'eviction_notice_analysis',
  name: 'Eviction and Notice Procedures Analysis',
  description: 'Analysis of eviction procedures and notice requirements',
  documentTypes: ['residential_tenancy', 'assured_shorthold_tenancy'],
  analysisType: 'specialized',
  priority: 80,
  template: `
**EVICTION AND NOTICE ANALYSIS**

Examine notice and eviction clauses against:
- Housing Act 1988 (Section 21 and Section 8)
- Deregulation Act 2015
- Tenant Fees Act 2019
- Homes (Fitness for Human Habitation) Act 2018

**SECTION 21 REQUIREMENTS:**
1. Proper prescribed information provided
2. Gas safety certificate given
3. EPC provided
4. How to Rent guide provided
5. Deposit properly protected
6. Two-month notice period
7. Cannot be served in first 4 months

**SECTION 8 GROUNDS:**
Analyze any specific grounds mentioned and their fairness.

**NOTICE PERIOD ANALYSIS:**
- Periodic tenancy: 1 month minimum (tenant to landlord)
- Fixed term: Notice periods during and after term
- Early termination clauses
- Break clauses and conditions

**UNFAIR TERMS TO FLAG:**
- Shortened notice periods
- Automatic termination clauses
- Penalty clauses for early termination
- Waiver of statutory notice rights

Provide insights with:
- Legal compliance assessment
- Tenant protection level
- Potential challenges to validity
- Recommended improvements
`,
  systemInstructions: `
Pay special attention to any clauses that could undermine tenant security of tenure.
Check for compliance with all prerequisites for valid Section 21 notices.
Flag any terms that could accelerate eviction unfairly.
`
};

/**
 * Template for fees and charges analysis
 */
export const FEES_CHARGES_TEMPLATE: PromptTemplate = {
  id: 'fees_charges_analysis',
  name: 'Fees and Charges Compliance Analysis',
  description: 'Comprehensive analysis of all fees and charges under Tenant Fees Act 2019',
  documentTypes: ['residential_tenancy', 'assured_shorthold_tenancy'],
  analysisType: 'specialized',
  priority: 95,
  template: `
**TENANT FEES ACT 2019 COMPLIANCE ANALYSIS**

**PERMITTED PAYMENTS:**
1. Rent
2. Refundable tenancy deposit (max 5 weeks for rent under £50k/year, 6 weeks for rent £50k+/year)
3. Refundable holding deposit (max 1 week's rent)
4. Payments in default (rent arrears, lost keys, contract variations)
5. Utilities and council tax
6. Television licence
7. Interest on late rent (max 3% above Bank of England base rate)

**PROHIBITED PAYMENTS TO IDENTIFY:**
- Administration fees
- Referencing fees
- Credit check fees
- Guarantor fees
- Inventory fees
- Check-in/check-out fees
- Professional cleaning fees (unless property was professionally cleaned before tenancy)
- Renewal fees
- Early termination fees (beyond genuine losses)

**DETAILED ANALYSIS REQUIRED:**
For each fee or charge mentioned:
1. Classification (permitted/prohibited/unclear)
2. Amount assessment (reasonable vs excessive)
3. Legal justification or violation
4. Impact on tenant affordability
5. Recommendations for compliance

**VIOLATION SEVERITY:**
- Direct prohibited fees: SERIOUS (penalty up to £5,000)
- Excessive permitted fees: MODERATE
- Unclear fee structures: MINOR

Calculate total potential prohibited fees and legal exposure.
`,
  systemInstructions: `
Apply zero tolerance to prohibited fees - any hint of non-compliance should be flagged.
Calculate the financial impact of prohibited fees on tenants.
Consider the cumulative effect of multiple small fees.
Reference specific Tenant Fees Act enforcement penalties.
`
};

/**
 * Template for commercial property analysis
 */
export const COMMERCIAL_PROPERTY_TEMPLATE: PromptTemplate = {
  id: 'commercial_property_analysis',
  name: 'Commercial Property Lease Analysis',
  description: 'Analysis template for commercial property leases',
  documentTypes: ['commercial_lease', 'business_tenancy'],
  analysisType: 'primary',
  priority: 70,
  template: `
**COMMERCIAL LEASE ANALYSIS**

Analyze commercial lease against:
- Landlord and Tenant Act 1954 (Business Tenancies)
- Law of Property Act 1925
- Consumer Rights Act 2015 (if applicable to small businesses)
- Commercial rent review provisions
- Service charge regulations

**KEY COMMERCIAL CONSIDERATIONS:**
1. Security of tenure provisions
2. Rent review mechanisms
3. Service charge transparency
4. Repair and insurance obligations
5. Permitted use restrictions
6. Assignment and subletting rights
7. Break clauses and conditions
8. Termination procedures

**UNFAIR TERMS IN COMMERCIAL CONTEXT:**
- Unreasonable rent review provisions
- Excessive service charges
- Disproportionate repair obligations
- Restrictive use clauses
- Unfair break clause conditions

Note: Commercial leases have different protections than residential tenancies.
Focus on business impact and fairness rather than consumer protection laws.
`,
  systemInstructions: `
Commercial leases operate under different legal frameworks than residential tenancies.
Focus on business fairness and commercial reasonableness.
Consider the sophistication level of the tenant business.
`
};

/**
 * Template for edge cases and complex scenarios
 */
export const EDGE_CASE_ANALYSIS_TEMPLATE: PromptTemplate = {
  id: 'edge_case_analysis',
  name: 'Edge Cases and Complex Scenarios',
  description: 'Template for handling unusual or complex legal scenarios',
  documentTypes: ['all'],
  analysisType: 'specialized',
  priority: 60,
  template: `
**EDGE CASE AND COMPLEX SCENARIO ANALYSIS**

**COMPLEX SCENARIO DETECTION:**
Identify if document contains:
1. Multiple property types (residential/commercial mix)
2. Unusual tenancy structures (company lets, diplomatic tenancies)
3. Shared ownership arrangements
4. Rent-to-rent arrangements
5. Holiday let conversions
6. Student accommodation specific terms
7. Agricultural tenancies
8. Crown estate properties
9. Social housing transfers

**SPECIALIZED LEGAL FRAMEWORKS:**
Apply relevant specialized legislation:
- Student accommodation: Consumer protection
- Holiday lets: Planning and licensing requirements
- Agricultural: Agricultural Holdings Act / Agricultural Tenancies Act
- Social housing: Housing Act 1996, Localism Act 2011

**UNUSUAL CLAUSE ANALYSIS:**
- Hybrid commercial/residential terms
- International law references
- Unusual payment structures
- Non-standard termination procedures
- Complex utility arrangements
- Shared facility usage rights

**RISK ASSESSMENT:**
Higher scrutiny for:
- Novel legal structures
- Untested clause combinations
- Cross-jurisdictional elements
- Unbalanced risk allocation
`,
  systemInstructions: `
When encountering edge cases, provide conservative analysis.
Recommend specialist legal advice for complex scenarios.
Clearly indicate areas of legal uncertainty.
Flag any experimental or untested legal structures.
`
};

/**
 * Template for validation and secondary analysis
 */
export const VALIDATION_ANALYSIS_TEMPLATE: PromptTemplate = {
  id: 'validation_analysis',
  name: 'Secondary Validation Analysis',
  description: 'Template for validating and cross-checking primary analysis',
  documentTypes: ['all'],
  analysisType: 'secondary',
  priority: 50,
  template: `
**SECONDARY VALIDATION ANALYSIS**

**PRIMARY ANALYSIS REVIEW:**
Cross-check the primary analysis for:
1. Missed legal violations
2. Incorrect severity assessments
3. Missing statutory references
4. Inconsistent recommendations
5. Overlooked edge cases

**VALIDATION CHECKLIST:**
- All statutory requirements covered
- Severity levels appropriately assigned
- Financial calculations accurate
- Legal citations correct and current
- Recommendations practical and legal

**QUALITY ASSURANCE:**
- Consistency in terminology
- Completeness of analysis
- Clarity of explanations
- Appropriateness of risk levels

**CONFIDENCE CALIBRATION:**
Assess and adjust confidence levels based on:
- Document quality and completeness
- Clarity of terms and conditions
- Presence of standard vs non-standard clauses
- Availability of complete information

Provide validation summary with any corrections or additions.
`,
  systemInstructions: `
Act as a quality assurance reviewer.
Challenge the primary analysis constructively.
Identify any gaps or inconsistencies.
Provide calibrated confidence assessments.
`
};

/**
 * Prompt template registry
 */
export const PROMPT_TEMPLATE_REGISTRY: Map<string, PromptTemplate> = new Map([
  ['base_tenancy_analysis', BASE_TENANCY_ANALYSIS_TEMPLATE],
  ['deposit_specialized_analysis', DEPOSIT_ANALYSIS_TEMPLATE],
  ['repair_responsibility_analysis', REPAIR_RESPONSIBILITY_TEMPLATE],
  ['eviction_notice_analysis', EVICTION_NOTICE_TEMPLATE],
  ['fees_charges_analysis', FEES_CHARGES_TEMPLATE],
  ['commercial_property_analysis', COMMERCIAL_PROPERTY_TEMPLATE],
  ['edge_case_analysis', EDGE_CASE_ANALYSIS_TEMPLATE],
  ['validation_analysis', VALIDATION_ANALYSIS_TEMPLATE],
]);

/**
 * Get appropriate prompt templates based on document type and context
 */
export function getPromptTemplatesForAnalysis(
  documentType: DocumentType,
  analysisContext: AnalysisContext
): AnalysisPromptConfig {
  const availableTemplates = Array.from(PROMPT_TEMPLATE_REGISTRY.values())
    .filter(template => 
      template.documentTypes.includes(documentType) || 
      template.documentTypes.includes('all')
    )
    .sort((a, b) => b.priority - a.priority);

  const baseTemplate = availableTemplates.find(t => t.analysisType === 'primary') 
    || BASE_TENANCY_ANALYSIS_TEMPLATE;

  const contextualPrompts = availableTemplates.filter(t => t.analysisType === 'specialized');
  
  const specializationPrompts = contextualPrompts.filter(t => 
    analysisContext.requiredSpecializations?.some(spec => t.id.includes(spec))
  );

  const validationPrompts = availableTemplates.filter(t => t.analysisType === 'secondary');

  return {
    baseTemplate,
    contextualPrompts,
    specializationPrompts,
    validationPrompts
  };
}

/**
 * Build complete analysis prompt from templates
 */
export function buildAnalysisPrompt(
  documentContent: string,
  config: AnalysisPromptConfig,
  context: AnalysisContext
): string {
  const legalFocusAreas = context.focusAreas?.join('\n- ') || 'Standard UK tenancy law compliance';
  const severityClassification = getSeverityClassificationText();
  
  let prompt = config.baseTemplate.template
    .replace('{documentContent}', documentContent)
    .replace('{legalFocusAreas}', legalFocusAreas)
    .replace('{severityClassification}', severityClassification);

  // Add specialized analysis sections
  if (config.specializationPrompts.length > 0) {
    prompt += '\n\n**SPECIALIZED ANALYSIS SECTIONS:**\n';
    config.specializationPrompts.forEach(spec => {
      prompt += `\n${spec.template}\n`;
    });
  }

  return prompt;
}

/**
 * Get system instructions for a prompt configuration
 */
export function getSystemInstructions(config: AnalysisPromptConfig): string {
  let instructions = config.baseTemplate.systemInstructions;

  // Add specialized instructions
  config.specializationPrompts.forEach(spec => {
    instructions += `\n\n${spec.systemInstructions}`;
  });

  return instructions;
}

/**
 * Helper function to get severity classification text
 */
function getSeverityClassificationText(): string {
  return `
**SEVERITY LEVELS:**
1. CRITICAL (90-100 impact): Direct law violations, tenant rights violations, discriminatory terms
2. SERIOUS (70-89 impact): Prohibited fees, excessive deposits, unfair repair terms, improper notice procedures  
3. MODERATE (40-69 impact): Unclear terms, minimal notice periods, restrictive but legal clauses
4. MINOR (10-39 impact): Standard terms that could be improved, missing beneficial clauses
5. INFORMATIONAL (0-9 impact): Standard compliant terms, explanatory notes

**IMPACT SCORING:**
Calculate cumulative impact of all issues on tenant rights and financial position.
Consider both immediate and long-term consequences of problematic clauses.
`;
}