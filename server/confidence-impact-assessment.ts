import { 
  ConfidenceMetrics,
  ImpactAssessment,
  RiskAssessment,
  RiskItem,
  MitigationStrategy,
  ViolationType,
  SeverityLevel,
  LegalViolation,
  EnhancedInsight,
  AnalysisContext,
  DocumentType
} from './legal-framework-types';

/**
 * Enhanced Legal Framework - Confidence Intervals and Impact Assessment
 * This module provides sophisticated confidence scoring and impact assessment algorithms
 */

/**
 * Calculate comprehensive confidence metrics for legal analysis
 */
export function calculateConfidenceMetrics(
  documentContent: string,
  analysisResults: any,
  context: AnalysisContext
): ConfidenceMetrics {
  // Document quality assessment
  const dataQuality = assessDocumentQuality(documentContent);
  
  // Analysis completeness assessment
  const analysisCompleteness = assessAnalysisCompleteness(analysisResults, context);
  
  // Legal certainty assessment
  const legalCertainty = assessLegalCertainty(analysisResults);
  
  // Document clarity assessment
  const documentClarity = assessDocumentClarity(documentContent);
  
  // Factor breakdown
  const factorBreakdown = {
    documentCompleteness: assessDocumentCompleteness(documentContent),
    clauseClarity: assessClauseClarity(documentContent),
    standardCompliance: assessStandardCompliance(documentContent),
    legalComplexity: assessLegalComplexity(analysisResults),
    ambiguityLevel: assessAmbiguityLevel(documentContent)
  };
  
  // Calculate overall confidence as weighted average
  const weights = {
    dataQuality: 0.25,
    analysisCompleteness: 0.25,
    legalCertainty: 0.25,
    documentClarity: 0.25
  };
  
  const overallConfidence = Math.round(
    (dataQuality * weights.dataQuality) +
    (analysisCompleteness * weights.analysisCompleteness) +
    (legalCertainty * weights.legalCertainty) +
    (documentClarity * weights.documentClarity)
  );
  
  return {
    overallConfidence,
    dataQuality,
    analysisCompleteness,
    legalCertainty,
    documentClarity,
    factorBreakdown
  };
}

/**
 * Assess document quality based on content analysis
 */
function assessDocumentQuality(documentContent: string): number {
  let score = 100;
  
  // Length check
  if (documentContent.length < 1000) {
    score -= 30; // Very short document
  } else if (documentContent.length < 2000) {
    score -= 15; // Short document
  }
  
  // Structure indicators
  const hasStructure = /clause|section|paragraph|\d+\./gi.test(documentContent);
  if (!hasStructure) score -= 20;
  
  // Key sections present
  const keyTerms = [
    'rent', 'deposit', 'landlord', 'tenant', 'property', 'term',
    'notice', 'repair', 'maintenance', 'insurance'
  ];
  const missingTerms = keyTerms.filter(term => 
    !new RegExp(term, 'gi').test(documentContent)
  );
  score -= missingTerms.length * 5;
  
  // Quality indicators
  const qualityIndicators = [
    'address', 'date', 'signature', 'witness', 'schedule'
  ];
  const presentIndicators = qualityIndicators.filter(indicator =>
    new RegExp(indicator, 'gi').test(documentContent)
  );
  score += presentIndicators.length * 3;
  
  // Check for placeholder text
  const placeholders = /\[.*?\]|\{.*?\}|_____|TBD|to be confirmed/gi;
  const placeholderMatches = documentContent.match(placeholders);
  if (placeholderMatches) {
    score -= Math.min(30, placeholderMatches.length * 3);
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Assess analysis completeness
 */
function assessAnalysisCompleteness(analysisResults: any, context: AnalysisContext): number {
  let score = 100;
  
  // Required sections check
  const requiredSections = [
    'propertyDetails', 'financialTerms', 'leasePeriod', 'parties',
    'insights', 'recommendations'
  ];
  
  const missingSections = requiredSections.filter(section => 
    !analysisResults[section] || 
    (Array.isArray(analysisResults[section]) && analysisResults[section].length === 0)
  );
  score -= missingSections.length * 15;
  
  // Insights quality check
  if (analysisResults.insights) {
    const insights = analysisResults.insights;
    if (insights.length === 0) {
      score -= 25;
    } else if (insights.length < 3) {
      score -= 10;
    }
    
    // Check for detailed insights
    const detailedInsights = insights.filter((insight: any) => 
      insight.content && insight.content.length > 100
    );
    if (detailedInsights.length < insights.length * 0.5) {
      score -= 15;
    }
  }
  
  // Recommendations quality check
  if (analysisResults.recommendations) {
    const recommendations = analysisResults.recommendations;
    if (recommendations.length === 0) {
      score -= 20;
    } else if (recommendations.length < 2) {
      score -= 10;
    }
  }
  
  // Context-specific requirements
  if (context.analysisDepth === 'comprehensive' || context.analysisDepth === 'expert') {
    if (!analysisResults.legalViolations) score -= 15;
    if (!analysisResults.riskAssessment) score -= 15;
    if (!analysisResults.impactAssessment) score -= 15;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Assess legal certainty of analysis
 */
function assessLegalCertainty(analysisResults: any): number {
  let score = 100;
  
  // Check for legal references
  const hasLegalReferences = analysisResults.insights?.some((insight: any) =>
    insight.legalBasis || insight.indicators?.some((indicator: string) =>
      /act|section|regulation|law/gi.test(indicator)
    )
  );
  
  if (!hasLegalReferences) score -= 25;
  
  // Check for specific citations
  const hasSpecificCitations = analysisResults.insights?.some((insight: any) =>
    insight.content && /\d{4}|section \d+|act \d+/gi.test(insight.content)
  );
  
  if (!hasSpecificCitations) score -= 15;
  
  // Check for uncertainty indicators
  const uncertaintyTerms = ['may', 'might', 'possibly', 'unclear', 'ambiguous', 'uncertain'];
  const insights = analysisResults.insights || [];
  const uncertainInsights = insights.filter((insight: any) =>
    uncertaintyTerms.some(term => 
      insight.content?.toLowerCase().includes(term)
    )
  );
  
  if (uncertainInsights.length > insights.length * 0.3) {
    score -= 20; // Too much uncertainty
  }
  
  // Check for compliance score confidence
  if (analysisResults.complianceScore !== undefined) {
    if (analysisResults.complianceScore === 0 || analysisResults.complianceScore === 100) {
      score -= 10; // Extreme scores are often less reliable
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Assess document clarity
 */
function assessDocumentClarity(documentContent: string): number {
  let score = 100;
  
  // Check for complex sentences
  const sentences = documentContent.split(/[.!?]+/);
  const longSentences = sentences.filter(s => s.length > 200);
  score -= Math.min(20, longSentences.length * 2);
  
  // Check for legal jargon
  const legalJargon = [
    'hereinafter', 'whereupon', 'heretofore', 'whereas', 'forthwith',
    'notwithstanding', 'pursuant to', 'in lieu of'
  ];
  const jargonCount = legalJargon.filter(term =>
    new RegExp(term, 'gi').test(documentContent)
  ).length;
  score -= jargonCount * 3;
  
  // Check for clear structure
  const hasNumbers = /\d+\./g.test(documentContent);
  const hasHeadings = /^[A-Z\s]+:|\n[A-Z\s]+\n/gm.test(documentContent);
  if (hasNumbers) score += 10;
  if (hasHeadings) score += 10;
  
  // Check for defined terms
  const hasDefinitions = /defined as|means|shall mean|definition/gi.test(documentContent);
  if (hasDefinitions) score += 5;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Assess document completeness
 */
function assessDocumentCompleteness(documentContent: string): number {
  let score = 100;
  
  const essentialElements = [
    { term: 'property.*address|premises.*located', weight: 15 },
    { term: 'rent.*amount|monthly.*rent|£\\d+', weight: 15 },
    { term: 'deposit|security.*deposit', weight: 10 },
    { term: 'term.*tenancy|lease.*period|commencement.*date', weight: 10 },
    { term: 'landlord.*name|lessor', weight: 10 },
    { term: 'tenant.*name|lessee', weight: 10 },
    { term: 'repair.*responsibility|maintenance', weight: 10 },
    { term: 'notice.*period|termination', weight: 10 },
    { term: 'insurance', weight: 5 },
    { term: 'utilities|services', weight: 5 }
  ];
  
  essentialElements.forEach(element => {
    if (!new RegExp(element.term, 'gi').test(documentContent)) {
      score -= element.weight;
    }
  });
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Assess clause clarity
 */
function assessClauseClarity(documentContent: string): number {
  let score = 100;
  
  // Check for ambiguous terms
  const ambiguousTerms = [
    'reasonable', 'appropriate', 'satisfactory', 'adequate',
    'fair', 'promptly', 'as soon as possible', 'in due course'
  ];
  
  const ambiguityCount = ambiguousTerms.filter(term =>
    new RegExp(`\\b${term}\\b`, 'gi').test(documentContent)
  ).length;
  
  score -= Math.min(30, ambiguityCount * 3);
  
  // Check for specific measurements and timeframes
  const hasSpecificTerms = /\d+\s*(days?|weeks?|months?|years?)/gi.test(documentContent);
  if (hasSpecificTerms) score += 10;
  
  const hasSpecificAmounts = /£\d+/g.test(documentContent);
  if (hasSpecificAmounts) score += 10;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Assess standard compliance
 */
function assessStandardCompliance(documentContent: string): number {
  let score = 100;
  
  // Check for standard clauses
  const standardClauses = [
    'quiet enjoyment',
    'deposit protection',
    'gas safety',
    'electrical safety',
    'energy performance certificate',
    'right to rent'
  ];
  
  const presentClauses = standardClauses.filter(clause =>
    new RegExp(clause, 'gi').test(documentContent)
  );
  
  score = (presentClauses.length / standardClauses.length) * 100;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Assess legal complexity
 */
function assessLegalComplexity(analysisResults: any): number {
  let score = 0; // Start at 0, higher score = more complex
  
  const insights = analysisResults.insights || [];
  
  // Count serious legal issues
  const seriousIssues = insights.filter((insight: any) =>
    insight.type === 'warning' || 
    (insight.severity && ['critical', 'serious'].includes(insight.severity))
  );
  score += seriousIssues.length * 15;
  
  // Check for multiple legal areas
  const legalAreas = new Set();
  insights.forEach((insight: any) => {
    if (insight.legalBasis) {
      insight.legalBasis.forEach((ref: any) => {
        legalAreas.add(ref.act);
      });
    }
  });
  score += legalAreas.size * 10;
  
  // Check for edge cases
  const edgeCaseTerms = [
    'commercial', 'mixed use', 'company let', 'diplomatic',
    'agricultural', 'holiday let', 'rent to rent'
  ];
  const hasEdgeCases = edgeCaseTerms.some(term =>
    analysisResults.propertyDetails?.propertyType?.toLowerCase().includes(term)
  );
  if (hasEdgeCases) score += 20;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Assess ambiguity level
 */
function assessAmbiguityLevel(documentContent: string): number {
  let score = 0; // Start at 0, higher score = more ambiguous
  
  // Count ambiguous phrases
  const ambiguousPhrases = [
    'as appropriate', 'if necessary', 'where applicable',
    'from time to time', 'at the discretion', 'reasonable',
    'satisfactory', 'adequate', 'fair', 'proper'
  ];
  
  ambiguousPhrases.forEach(phrase => {
    const matches = documentContent.match(new RegExp(phrase, 'gi'));
    if (matches) score += matches.length * 5;
  });
  
  // Check for undefined terms
  const undefinedTerms = documentContent.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  const uniqueTerms = new Set(undefinedTerms);
  if (uniqueTerms.size > 50) score += 15; // Too many potentially undefined terms
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate comprehensive impact assessment
 */
export function calculateImpactAssessment(
  violations: LegalViolation[],
  insights: EnhancedInsight[],
  analysisResults: any,
  context: AnalysisContext
): ImpactAssessment {
  const financialImpact = calculateFinancialImpact(violations, insights, analysisResults);
  const legalImpact = calculateLegalImpact(violations, insights);
  const practicalImpact = calculatePracticalImpact(violations, insights, context);
  
  return {
    financialImpact,
    legalImpact,
    practicalImpact
  };
}

/**
 * Calculate financial impact of violations
 */
function calculateFinancialImpact(
  violations: LegalViolation[],
  insights: EnhancedInsight[],
  analysisResults: any
): ImpactAssessment['financialImpact'] {
  let immediateRisk = 0;
  let ongoingRisk = 0;
  const riskCategories = {
    prohibitedFees: 0,
    excessiveDeposits: 0,
    unfairCharges: 0,
    legalCosts: 0,
    lostRights: 0
  };
  
  // Calculate from violations
  violations.forEach(violation => {
    const impact = violation.financialImpact || 0;
    
    switch (violation.violationType) {
      case 'prohibited_fees':
        immediateRisk += impact;
        riskCategories.prohibitedFees += impact;
        break;
      case 'deposit_violation':
        immediateRisk += impact;
        riskCategories.excessiveDeposits += impact;
        break;
      case 'unfair_terms':
        ongoingRisk += impact * 12; // Annual impact
        riskCategories.unfairCharges += impact;
        break;
      case 'repair_responsibility':
        ongoingRisk += impact * 12;
        riskCategories.lostRights += impact;
        break;
      default:
        if (violation.severity === 'critical' || violation.severity === 'serious') {
          riskCategories.legalCosts += 500; // Estimated legal advice cost
        }
    }
  });
  
  // Extract rent amount for context
  const rentMatch = analysisResults.financialTerms?.monthlyRent?.match(/£(\d+)/);
  const monthlyRent = rentMatch ? parseInt(rentMatch[1]) : 1000;
  
  // Add percentage-based risks
  if (ongoingRisk === 0 && violations.length > 0) {
    ongoingRisk = monthlyRent * 0.1 * violations.length; // Estimate ongoing risk
  }
  
  const totalExposure = immediateRisk + ongoingRisk;
  
  return {
    immediateRisk: Math.round(immediateRisk),
    ongoingRisk: Math.round(ongoingRisk),
    totalExposure: Math.round(totalExposure),
    riskCategories: {
      prohibitedFees: Math.round(riskCategories.prohibitedFees),
      excessiveDeposits: Math.round(riskCategories.excessiveDeposits),
      unfairCharges: Math.round(riskCategories.unfairCharges),
      legalCosts: Math.round(riskCategories.legalCosts),
      lostRights: Math.round(riskCategories.lostRights)
    }
  };
}

/**
 * Calculate legal impact
 */
function calculateLegalImpact(
  violations: LegalViolation[],
  insights: EnhancedInsight[]
): ImpactAssessment['legalImpact'] {
  const rightsAtRisk: string[] = [];
  let enforcementRisk = 0;
  let litigationRisk = 0;
  let regulatoryRisk = 0;
  
  violations.forEach(violation => {
    // Identify rights at risk
    switch (violation.violationType) {
      case 'deposit_violation':
        rightsAtRisk.push('Deposit protection rights');
        regulatoryRisk += 20;
        break;
      case 'prohibited_fees':
        rightsAtRisk.push('Protection from unfair fees');
        enforcementRisk += 25;
        regulatoryRisk += 15;
        break;
      case 'repair_responsibility':
        rightsAtRisk.push('Right to habitable property');
        litigationRisk += 15;
        break;
      case 'access_rights':
        rightsAtRisk.push('Right to quiet enjoyment');
        litigationRisk += 10;
        break;
      case 'unfair_terms':
        rightsAtRisk.push('Consumer protection rights');
        litigationRisk += 20;
        break;
      case 'discrimination':
        rightsAtRisk.push('Equality and non-discrimination rights');
        enforcementRisk += 30;
        litigationRisk += 25;
        break;
    }
    
    // Add severity-based risk
    const severityMultiplier = {
      'critical': 1.5,
      'serious': 1.2,
      'moderate': 1.0,
      'minor': 0.7,
      'informational': 0.3
    }[violation.severity] || 1.0;
    
    enforcementRisk *= severityMultiplier;
    litigationRisk *= severityMultiplier;
    regulatoryRisk *= severityMultiplier;
  });
  
  return {
    rightsAtRisk: Array.from(new Set(rightsAtRisk)),
    enforcementRisk: Math.min(100, Math.round(enforcementRisk)),
    litigationRisk: Math.min(100, Math.round(litigationRisk)),
    regulatoryRisk: Math.min(100, Math.round(regulatoryRisk))
  };
}

/**
 * Calculate practical impact on daily living
 */
function calculatePracticalImpact(
  violations: LegalViolation[],
  insights: EnhancedInsight[],
  context: AnalysisContext
): ImpactAssessment['practicalImpact'] {
  let livingConditions = 0;
  let securityOfTenure = 0;
  let dayToDayLiving = 0;
  let futureOptions = 0;
  
  violations.forEach(violation => {
    switch (violation.violationType) {
      case 'repair_responsibility':
      case 'maintenance_obligations':
      case 'safety_compliance':
        livingConditions += 20;
        break;
      case 'notice_procedure':
      case 'termination_clauses':
        securityOfTenure += 25;
        break;
      case 'access_rights':
      case 'pet_restrictions':
      case 'occupancy_limits':
        dayToDayLiving += 15;
        break;
      case 'subletting_restrictions':
      case 'property_alterations':
        futureOptions += 10;
        break;
      case 'rent_increase_procedures':
        securityOfTenure += 15;
        dayToDayLiving += 10;
        break;
    }
    
    // Apply severity multiplier
    const multiplier = {
      'critical': 1.5,
      'serious': 1.2,
      'moderate': 1.0,
      'minor': 0.7,
      'informational': 0.3
    }[violation.severity] || 1.0;
    
    livingConditions *= multiplier;
    securityOfTenure *= multiplier;
    dayToDayLiving *= multiplier;
    futureOptions *= multiplier;
  });
  
  // Consider tenant profile
  if (context.tenantProfile) {
    if (context.tenantProfile.type === 'vulnerable_person') {
      livingConditions *= 1.3;
      dayToDayLiving *= 1.2;
    }
    if (context.tenantProfile.experience === 'first_time') {
      securityOfTenure *= 1.2;
    }
  }
  
  return {
    livingConditions: Math.min(100, Math.round(livingConditions)),
    securityOfTenure: Math.min(100, Math.round(securityOfTenure)),
    dayToDayLiving: Math.min(100, Math.round(dayToDayLiving)),
    futureOptions: Math.min(100, Math.round(futureOptions))
  };
}

/**
 * Calculate confidence interval for a given metric
 */
export function calculateConfidenceInterval(
  value: number,
  confidence: number,
  sampleSize: number = 100
): { lower: number; upper: number; margin: number } {
  // Calculate margin of error based on confidence level
  const zScore = confidence >= 95 ? 1.96 : confidence >= 90 ? 1.645 : 1.28;
  const standardError = Math.sqrt((value * (100 - value)) / sampleSize) / 100;
  const margin = zScore * standardError * 100;
  
  return {
    lower: Math.max(0, Math.round(value - margin)),
    upper: Math.min(100, Math.round(value + margin)),
    margin: Math.round(margin * 100) / 100
  };
}

/**
 * Calibrate confidence based on multiple factors
 */
export function calibrateConfidence(
  baseConfidence: number,
  factors: {
    documentQuality: number;
    analysisDepth: 'basic' | 'standard' | 'comprehensive' | 'expert';
    legalComplexity: number;
    validationPerformed: boolean;
    expertReview: boolean;
  }
): number {
  let adjusted = baseConfidence;
  
  // Document quality adjustment
  if (factors.documentQuality < 50) {
    adjusted *= 0.8;
  } else if (factors.documentQuality > 80) {
    adjusted *= 1.1;
  }
  
  // Analysis depth adjustment
  const depthMultipliers = {
    'basic': 0.85,
    'standard': 1.0,
    'comprehensive': 1.15,
    'expert': 1.25
  };
  adjusted *= depthMultipliers[factors.analysisDepth];
  
  // Legal complexity adjustment (higher complexity = lower confidence)
  if (factors.legalComplexity > 70) {
    adjusted *= 0.9;
  } else if (factors.legalComplexity < 30) {
    adjusted *= 1.05;
  }
  
  // Validation and review adjustments
  if (factors.validationPerformed) adjusted *= 1.1;
  if (factors.expertReview) adjusted *= 1.2;
  
  return Math.max(0, Math.min(100, Math.round(adjusted)));
}