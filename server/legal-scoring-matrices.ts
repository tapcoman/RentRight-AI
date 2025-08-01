import { 
  ViolationType, 
  SeverityLevel, 
  LegalArea, 
  ViolationScoringMatrix, 
  WeightedScoringConfig,
  ComplianceScoring,
  LegalViolation,
  EnhancedInsight
} from './legal-framework-types';

/**
 * Enhanced Legal Framework - Weighted Scoring Matrices
 * This module provides comprehensive scoring systems for different violation types
 */

/**
 * Base impact scores for different violation types
 * These represent the fundamental severity of each violation type
 */
export const VIOLATION_BASE_SCORES: Record<ViolationType, number> = {
  // Critical violations that directly harm tenants
  'deposit_violation': 85,           // High financial impact
  'prohibited_fees': 90,             // Direct Tenant Fees Act violation
  'discrimination': 95,              // Equality Act violation
  'safety_compliance': 88,           // Health and safety risk
  'unfair_terms': 75,               // Consumer Rights Act issues
  
  // Serious violations affecting rights
  'repair_responsibility': 80,       // Statutory obligations
  'notice_procedure': 78,           // Security of tenure
  'access_rights': 70,              // Privacy and quiet enjoyment
  'termination_clauses': 75,        // Security of tenure
  
  // Moderate violations affecting living conditions
  'rent_increase_procedures': 65,    // Financial stability
  'maintenance_obligations': 60,     // Property standards
  'utility_responsibilities': 55,    // Living costs
  'insurance_requirements': 50,      // Risk allocation
  
  // Minor violations affecting lifestyle
  'subletting_restrictions': 45,     // Flexibility limitations
  'pet_restrictions': 40,           // Lifestyle limitations
  'occupancy_limits': 42,           // Living arrangements
  'property_alterations': 38,       // Personalization restrictions
  
  // Administrative and procedural issues
  'dispute_resolution': 35,         // Process fairness
  'data_protection': 30,            // Privacy protection
  'consumer_rights': 50,            // General consumer protection
  'housing_standards': 70,          // Living standards
  
  // Compliance and regulatory issues
  'planning_compliance': 25,        // Regulatory compliance
  'licensing_requirements': 45,     // Legal operation
  'energy_efficiency': 35,          // Environmental and cost
  'fire_safety': 85,               // Life safety
  'gas_safety': 90,                // Life safety
  'electrical_safety': 85,         // Life safety
  'general_compliance': 40          // Miscellaneous compliance
};

/**
 * Severity multipliers applied to base scores
 * These adjust the base score based on how severe the specific instance is
 */
export const SEVERITY_MULTIPLIERS: Record<SeverityLevel, number> = {
  'critical': 1.5,      // 150% of base score
  'serious': 1.2,       // 120% of base score
  'moderate': 1.0,      // 100% of base score (no change)
  'minor': 0.7,         // 70% of base score
  'informational': 0.3  // 30% of base score
};

/**
 * Legal area weights for compliance scoring
 * These represent the relative importance of different legal areas
 */
export const LEGAL_AREA_WEIGHTS: Record<LegalArea, number> = {
  // Core tenant protection laws
  'tenant_fees_act': 20,              // Heavily weighted due to direct financial impact
  'housing_act_1988': 18,             // Security of tenure
  'landlord_tenant_act_1985': 16,     // Repair obligations
  'consumer_rights_act': 15,          // Fair terms
  'deposit_protection': 12,           // Financial protection
  
  // Safety and standards
  'housing_health_safety': 10,        // Living standards
  'homes_fitness_act': 8,             // Habitability
  'gas_safety_regulations': 7,        // Safety compliance
  'electrical_safety_standards': 7,   // Safety compliance
  'fire_safety_order': 6,             // Safety compliance
  
  // Administrative and procedural
  'deregulation_act': 5,              // Administrative procedures
  'right_to_rent': 4,                 // Immigration compliance
  'energy_performance_regulations': 3, // Energy efficiency
  'general_data_protection': 2,       // Data privacy
  
  // Specialized areas
  'renters_reform_bill': 8,           // Emerging tenant rights
  'business_tenancies_act': 5,        // Commercial leases only
  'agricultural_holdings_act': 2,     // Specialized tenancies
  'housing_act_1996': 4,             // Social housing
  'localism_act': 3,                 // Local authority housing
  'planning_acts': 2,                // Planning compliance
  'building_regulations': 4          // Building standards
};

/**
 * Context modifiers for different situations
 * These adjust scores based on specific circumstances
 */
export const CONTEXT_MODIFIERS: Record<string, number> = {
  // Tenant vulnerability factors
  'vulnerable_tenant': 1.3,           // Increased protection for vulnerable tenants
  'first_time_tenant': 1.2,          // Less experienced, needs more protection
  'student_accommodation': 1.15,      // Often targeted with unfair terms
  'low_income_tenant': 1.25,         // Greater financial impact
  'elderly_tenant': 1.2,             // Potentially vulnerable
  'disabled_tenant': 1.3,            // Additional protections needed
  
  // Property factors
  'social_housing': 0.9,              // Different standards and protections
  'luxury_property': 0.95,           // Some different rules (e.g., deposit limits)
  'commercial_element': 0.8,         // Mixed use has different considerations
  'short_term_let': 1.1,             // Less protection, more risk
  'company_let': 0.85,               // Corporate tenant has different protections
  
  // Market factors
  'high_demand_area': 1.1,           // Landlords may push boundaries
  'low_demand_area': 0.95,           // Less competitive pressure
  'new_build': 0.9,                 // Modern standards, fewer issues
  'older_property': 1.1,             // More potential compliance issues
  
  // Landlord factors
  'professional_landlord': 0.9,      // More likely to be compliant
  'first_time_landlord': 1.1,        // More likely to make mistakes
  'letting_agent_managed': 0.95,     // Professional management
  'council_landlord': 0.8,           // Different regulatory framework
  'housing_association': 0.8,        // Regulated social landlord
  
  // Document factors
  'standard_template': 0.9,          // Less likely to have unusual problems
  'bespoke_agreement': 1.1,          // More risk of non-standard terms
  'multiple_properties': 0.95,       // Economies of scale in compliance
  'complex_arrangement': 1.2         // Higher risk of problems
};

/**
 * Violation type groupings for category-based analysis
 */
export const VIOLATION_CATEGORIES = {
  'FINANCIAL': [
    'deposit_violation',
    'prohibited_fees',
    'rent_increase_procedures',
    'utility_responsibilities'
  ],
  'SAFETY': [
    'safety_compliance',
    'fire_safety',
    'gas_safety',
    'electrical_safety',
    'housing_standards'
  ],
  'RIGHTS': [
    'access_rights',
    'discrimination',
    'unfair_terms',
    'consumer_rights',
    'termination_clauses'
  ],
  'OBLIGATIONS': [
    'repair_responsibility',
    'maintenance_obligations',
    'insurance_requirements',
    'notice_procedure'
  ],
  'LIFESTYLE': [
    'pet_restrictions',
    'occupancy_limits',
    'property_alterations',
    'subletting_restrictions'
  ],
  'COMPLIANCE': [
    'planning_compliance',
    'licensing_requirements',
    'energy_efficiency',
    'general_compliance',
    'data_protection'
  ]
} as const;

/**
 * Default weighted scoring configuration
 */
export const DEFAULT_SCORING_CONFIG: WeightedScoringConfig = {
  categoryWeights: LEGAL_AREA_WEIGHTS,
  severityWeights: SEVERITY_MULTIPLIERS,
  violationTypeWeights: VIOLATION_BASE_SCORES,
  contextModifiers: CONTEXT_MODIFIERS,
  tenantProtectionBias: 75, // Bias towards tenant protection
  conservatismFactor: 80    // Conservative in flagging issues
};

/**
 * Calculate weighted impact score for a legal violation
 */
export function calculateViolationScore(
  violationType: ViolationType,
  severity: SeverityLevel,
  contextFactors: string[] = [],
  config: WeightedScoringConfig = DEFAULT_SCORING_CONFIG
): number {
  // Start with base score for violation type
  let score = config.violationTypeWeights[violationType] || 50;
  
  // Apply severity multiplier
  const severityMultiplier = config.severityWeights[severity] || 1.0;
  score = score * severityMultiplier;
  
  // Apply context modifiers
  let contextMultiplier = 1.0;
  contextFactors.forEach(factor => {
    const modifier = config.contextModifiers[factor];
    if (modifier) {
      contextMultiplier *= modifier;
    }
  });
  score = score * contextMultiplier;
  
  // Apply tenant protection bias
  const protectionBias = config.tenantProtectionBias / 100;
  if (protectionBias > 0.5) {
    // Bias towards higher scores (more protective)
    score = score + (score * (protectionBias - 0.5) * 0.5);
  }
  
  // Ensure score stays within bounds
  score = Math.max(0, Math.min(100, score));
  
  return Math.round(score * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate overall compliance score based on all violations
 */
export function calculateComplianceScore(
  violations: LegalViolation[],
  insights: EnhancedInsight[],
  contextFactors: string[] = [],
  config: WeightedScoringConfig = DEFAULT_SCORING_CONFIG
): ComplianceScoring {
  let totalPenalty = 0;
  let criticalCount = 0;
  let seriousCount = 0;
  let moderateCount = 0;
  let minorCount = 0;
  
  // Calculate penalties from violations
  violations.forEach(violation => {
    const violationScore = calculateViolationScore(
      violation.violationType,
      violation.severity,
      contextFactors,
      config
    );
    
    // Apply penalty based on severity
    let penalty = 0;
    switch (violation.severity) {
      case 'critical':
        penalty = violationScore * 0.4; // Up to 40 point penalty
        criticalCount++;
        break;
      case 'serious':
        penalty = violationScore * 0.25; // Up to 25 point penalty
        seriousCount++;
        break;
      case 'moderate':
        penalty = violationScore * 0.15; // Up to 15 point penalty
        moderateCount++;
        break;
      case 'minor':
        penalty = violationScore * 0.08; // Up to 8 point penalty
        minorCount++;
        break;
      case 'informational':
        penalty = violationScore * 0.02; // Up to 2 point penalty
        break;
    }
    
    totalPenalty += penalty;
  });
  
  // Additional penalties from insights that aren't full violations
  insights.forEach(insight => {
    if (insight.type === 'warning' && insight.severity) {
      const insightScore = calculateViolationScore(
        insight.violationType,
        insight.severity,
        contextFactors,
        config
      );
      
      // Smaller penalty for insights vs full violations
      let penalty = 0;
      switch (insight.severity) {
        case 'critical':
          penalty = insightScore * 0.2;
          break;
        case 'serious':
          penalty = insightScore * 0.12;
          break;
        case 'moderate':
          penalty = insightScore * 0.08;
          break;
        case 'minor':
          penalty = insightScore * 0.04;
          break;
        case 'informational':
          penalty = insightScore * 0.01;
          break;
      }
      
      totalPenalty += penalty;
    }
  });
  
  // Apply conservatism factor
  const conservatismAdjustment = (config.conservatismFactor / 100) - 0.5;
  if (conservatismAdjustment > 0) {
    totalPenalty += totalPenalty * conservatismAdjustment * 0.3;
  }
  
  // Calculate final score
  const baseScore = 100;
  const finalScore = Math.max(0, Math.round(baseScore - totalPenalty));
  
  // Calculate category scores (simplified for now)
  const categoryScores: Record<LegalArea, number> = {} as Record<LegalArea, number>;
  Object.keys(LEGAL_AREA_WEIGHTS).forEach(area => {
    // Calculate category-specific score based on relevant violations
    const relevantViolations = violations.filter(v => 
      isViolationInLegalArea(v.violationType, area as LegalArea)
    );
    
    if (relevantViolations.length === 0) {
      categoryScores[area as LegalArea] = 100; // No issues in this area
    } else {
      const categoryPenalty = relevantViolations.reduce((sum, v) => {
        return sum + calculateViolationScore(v.violationType, v.severity, contextFactors, config) * 0.2;
      }, 0);
      categoryScores[area as LegalArea] = Math.max(0, Math.round(100 - categoryPenalty));
    }
  });
  
  return {
    totalScore: finalScore,
    categoryScores,
    penaltyCalculation: {
      criticalViolations: criticalCount,
      seriousViolations: seriousCount,
      moderateViolations: moderateCount,
      minorViolations: minorCount,
      totalPenalty: Math.round(totalPenalty * 100) / 100
    },
    confidenceAdjustment: 0, // Will be calculated separately
    finalScore
  };
}

/**
 * Determine if a violation type belongs to a legal area
 */
function isViolationInLegalArea(violationType: ViolationType, legalArea: LegalArea): boolean {
  const mapping: Record<LegalArea, ViolationType[]> = {
    'tenant_fees_act': ['prohibited_fees', 'deposit_violation'],
    'housing_act_1988': ['notice_procedure', 'termination_clauses', 'access_rights'],
    'landlord_tenant_act_1985': ['repair_responsibility', 'maintenance_obligations'],
    'consumer_rights_act': ['unfair_terms', 'consumer_rights'],
    'deposit_protection': ['deposit_violation'],
    'housing_health_safety': ['safety_compliance', 'housing_standards'],
    'homes_fitness_act': ['housing_standards', 'safety_compliance'],
    'gas_safety_regulations': ['gas_safety'],
    'electrical_safety_standards': ['electrical_safety'],
    'fire_safety_order': ['fire_safety'],
    'deregulation_act': ['notice_procedure', 'deposit_violation'],
    'right_to_rent': ['discrimination', 'general_compliance'],
    'energy_performance_regulations': ['energy_efficiency'],
    'general_data_protection': ['data_protection'],
    'renters_reform_bill': ['access_rights', 'termination_clauses', 'rent_increase_procedures'],
    'business_tenancies_act': ['general_compliance'],
    'agricultural_holdings_act': ['general_compliance'],
    'housing_act_1996': ['general_compliance'],
    'localism_act': ['general_compliance'],
    'planning_acts': ['planning_compliance'],
    'building_regulations': ['housing_standards', 'safety_compliance']
  };
  
  return mapping[legalArea]?.includes(violationType) || false;
}

/**
 * Get scoring matrix for a specific violation type
 */
export function getViolationScoringMatrix(violationType: ViolationType): ViolationScoringMatrix {
  return {
    violationType,
    baseScore: VIOLATION_BASE_SCORES[violationType] || 50,
    severityMultipliers: SEVERITY_MULTIPLIERS,
    contextModifiers: CONTEXT_MODIFIERS,
    maxScore: 100,
    minScore: 0
  };
}

/**
 * Calculate category-specific risk scores
 */
export function calculateCategoryRiskScores(
  violations: LegalViolation[],
  contextFactors: string[] = []
): Record<keyof typeof VIOLATION_CATEGORIES, number> {
  const categoryScores = {} as Record<keyof typeof VIOLATION_CATEGORIES, number>;
  
  Object.entries(VIOLATION_CATEGORIES).forEach(([category, violationTypes]) => {
    const categoryViolations = violations.filter(v => 
      violationTypes.includes(v.violationType)
    );
    
    if (categoryViolations.length === 0) {
      categoryScores[category as keyof typeof VIOLATION_CATEGORIES] = 0;
    } else {
      const totalScore = categoryViolations.reduce((sum, violation) => {
        return sum + calculateViolationScore(
          violation.violationType,
          violation.severity,
          contextFactors
        );
      }, 0);
      
      categoryScores[category as keyof typeof VIOLATION_CATEGORIES] = 
        Math.min(100, totalScore / categoryViolations.length);
    }
  });
  
  return categoryScores;
}

/**
 * Get recommended severity level based on score
 */
export function getRecommendedSeverity(score: number): SeverityLevel {
  if (score >= 85) return 'critical';
  if (score >= 70) return 'serious';
  if (score >= 40) return 'moderate';
  if (score >= 15) return 'minor';
  return 'informational';
}

/**
 * Calculate dynamic thresholds based on context
 */
export function calculateDynamicThresholds(
  contextFactors: string[],
  config: WeightedScoringConfig = DEFAULT_SCORING_CONFIG
): { critical: number; serious: number; moderate: number; minor: number } {
  const baseCritical = 85;
  const baseSerious = 70;
  const baseModerate = 40;
  const baseMinor = 15;
  
  // Adjust thresholds based on tenant protection bias
  const protectionBias = (config.tenantProtectionBias - 50) / 50; // -1 to 1 scale
  const conservatismFactor = (config.conservatismFactor - 50) / 50; // -1 to 1 scale
  
  // Higher bias and conservatism = lower thresholds (more protective)
  const adjustment = (protectionBias + conservatismFactor) * 0.1; // Max 20% adjustment
  
  return {
    critical: Math.max(75, baseCritical + (baseCritical * adjustment)),
    serious: Math.max(60, baseSerious + (baseSerious * adjustment)),
    moderate: Math.max(30, baseModerate + (baseModerate * adjustment)),
    minor: Math.max(10, baseMinor + (baseMinor * adjustment))
  };
}