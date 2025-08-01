/**
 * Configuration validator for RentRight AI
 * Ensures all required environment variables are properly set
 */

interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateConfiguration(): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required environment variables
  const requiredVars = [
    'DATABASE_URL',
    'OPENAI_API_KEY',
    'STRIPE_SECRET_KEY',
    'ENCRYPTION_KEY'
  ];

  // Check required variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Optional but recommended variables
  const recommendedVars = [
    'VITE_STRIPE_PUBLIC_KEY',
    'SENDGRID_API_KEY',
    'SENDGRID_FROM_EMAIL',
    'RECAPTCHA_SITE_KEY',
    'RECAPTCHA_SECRET_KEY'
  ];

  for (const varName of recommendedVars) {
    if (!process.env[varName]) {
      warnings.push(`Missing recommended environment variable: ${varName}`);
    }
  }

  // Validate specific formats
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('sk-')) {
    errors.push('OPENAI_API_KEY must be a valid OpenAI API key starting with "sk-"');
  }

  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    errors.push('STRIPE_SECRET_KEY must be a valid Stripe secret key starting with "sk_"');
  }

  if (process.env.VITE_STRIPE_PUBLIC_KEY && !process.env.VITE_STRIPE_PUBLIC_KEY.startsWith('pk_')) {
    warnings.push('VITE_STRIPE_PUBLIC_KEY should be a valid Stripe public key starting with "pk_"');
  }

  if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length !== 64) {
    errors.push('ENCRYPTION_KEY must be a 64-character hex string');
  }

  // Check port configuration
  const port = process.env.PORT;
  if (port && (isNaN(parseInt(port, 10)) || parseInt(port, 10) < 1 || parseInt(port, 10) > 65535)) {
    errors.push('PORT must be a valid port number between 1 and 65535');
  }

  // Check rate limiting configuration
  const rateLimitConfigs = [
    'RATE_LIMIT_WINDOW_MS',
    'RATE_LIMIT_MAX_REQUESTS',
    'AUTH_RATE_LIMIT_WINDOW_MS',
    'AUTH_RATE_LIMIT_MAX_REQUESTS',
    'UPLOAD_RATE_LIMIT_WINDOW_MS',
    'UPLOAD_RATE_LIMIT_MAX_REQUESTS',
    'CAPTCHA_RATE_LIMIT_WINDOW_MS',
    'CAPTCHA_RATE_LIMIT_MAX_REQUESTS',
    'SPEED_LIMIT_WINDOW_MS',
    'SPEED_LIMIT_DELAY_AFTER'
  ];

  for (const configName of rateLimitConfigs) {
    const value = process.env[configName];
    if (value && (isNaN(parseInt(value, 10)) || parseInt(value, 10) < 0)) {
      warnings.push(`${configName} should be a positive integer`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function logConfigurationStatus(): void {
  const result = validateConfiguration();
  
  console.log('='.repeat(60));
  console.log('CONFIGURATION VALIDATION');
  console.log('='.repeat(60));
  
  if (result.isValid) {
    console.log('✅ Configuration is valid');
  } else {
    console.log('❌ Configuration has errors');
  }
  
  if (result.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    result.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    result.warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  console.log('='.repeat(60));
}

// Auto-validate on import in development
if (process.env.NODE_ENV !== 'production') {
  const result = validateConfiguration();
  if (!result.isValid) {
    logConfigurationStatus();
  }
}