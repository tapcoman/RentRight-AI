import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';
import type { Request, Response, NextFunction } from 'express';

// Add environment vars validation
const RECAPTCHA_SITE_KEY = process.env.RECAPTCHA_SITE_KEY;
const RECAPTCHA_API_KEY = process.env.RECAPTCHA_API_KEY;
const RECAPTCHA_PROJECT_ID = process.env.RECAPTCHA_PROJECT_ID;

// Flag to check if reCAPTCHA is properly configured
const isRecaptchaConfigured = !!(RECAPTCHA_SITE_KEY && RECAPTCHA_API_KEY && RECAPTCHA_PROJECT_ID);

// Fall back to svg-captcha if Google reCAPTCHA isn't configured
let recaptchaClient: RecaptchaEnterpriseServiceClient | null = null;

// Initialize the reCAPTCHA client if all required environment variables are set
if (isRecaptchaConfigured) {
  try {
    recaptchaClient = new RecaptchaEnterpriseServiceClient({
      apiKey: RECAPTCHA_API_KEY
    });
    console.log('Google reCAPTCHA Enterprise client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Google reCAPTCHA Enterprise client:', error);
  }
}

interface RecaptchaAssessment {
  success: boolean;
  score?: number;
  reason?: string;
  action?: string;
}

/**
 * Assess whether a token from reCAPTCHA is valid and determine its risk score
 * 
 * @param token The reCAPTCHA token to verify
 * @param action The expected action (e.g., 'login', 'upload', etc.)
 * @param ipAddress The IP address of the client
 * @returns An assessment result with success flag and score
 */
export async function assessRecaptchaToken(
  token: string,
  action: string,
  ipAddress: string
): Promise<RecaptchaAssessment> {
  // If reCAPTCHA isn't configured or the client failed to initialize, return a default response
  if (!isRecaptchaConfigured || !recaptchaClient) {
    console.warn('Google reCAPTCHA is not properly configured, skipping verification');
    return { success: true };
  }

  try {
    // Format the full resource name
    const projectPath = `projects/${RECAPTCHA_PROJECT_ID}`;

    // Create the assessment request
    const request = {
      assessment: {
        event: {
          token: token,
          siteKey: RECAPTCHA_SITE_KEY,
          expectedAction: action,
          userIpAddress: ipAddress
        }
      },
      parent: projectPath
    };

    // Call the reCAPTCHA API
    const [response] = await recaptchaClient.createAssessment(request);
    
    // Get the risk analysis from the response
    const { tokenProperties, riskAnalysis } = response;

    // Check if the token is valid
    if (!tokenProperties?.valid) {
      return {
        success: false,
        reason: tokenProperties?.invalidReason ? 
          String(tokenProperties.invalidReason) : 'Invalid token'
      };
    }

    // Check if the action matches what we expected
    if (tokenProperties.action && tokenProperties.action !== action) {
      return {
        success: false,
        reason: 'Action mismatch',
        action: tokenProperties.action ? String(tokenProperties.action) : 'unknown'
      };
    }

    // Get the risk score (1.0 is very likely a good interaction, 0.0 is very likely a bot)
    const score = riskAnalysis?.score || 0;

    // Determine if this interaction is legitimate based on the score
    // You can adjust this threshold based on your risk tolerance
    const isLegitimate = score > 0.5;

    return {
      success: isLegitimate,
      score,
      reason: isLegitimate ? 'Passed risk assessment' : 'Failed risk assessment'
    };
  } catch (error) {
    console.error('Error during reCAPTCHA assessment:', error);
    // On error, treat as verification failure
    return {
      success: false,
      reason: 'reCAPTCHA verification error'
    };
  }
}

/**
 * Middleware to verify reCAPTCHA tokens
 * 
 * @param requiredAction The expected action that should match the token
 */
export function verifyRecaptcha(requiredAction: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // If reCAPTCHA isn't configured, skip the check
    if (!isRecaptchaConfigured) {
      console.warn('Google reCAPTCHA is not configured, skipping verification');
      return next();
    }

    const { recaptchaToken } = req.body;
    
    // No token provided
    if (!recaptchaToken) {
      return res.status(400).json({
        success: false,
        message: 'reCAPTCHA token is required',
        requireRecaptcha: true
      });
    }

    try {
      // Get the client IP address
      const ipAddress = req.ip || req.socket.remoteAddress || '0.0.0.0';
      
      // Assess the token
      const assessment = await assessRecaptchaToken(recaptchaToken, requiredAction, ipAddress);
      
      // If verification failed, return an error
      if (!assessment.success) {
        return res.status(400).json({
          success: false,
          message: 'reCAPTCHA verification failed',
          reason: assessment.reason,
          requireRecaptcha: true
        });
      }
      
      // If the score is available but below a certain high-security threshold,
      // we might want to add additional verification for sensitive operations
      if (assessment.score !== undefined && assessment.score < 0.7) {
        // For sensitive operations (e.g., payment), you might want to add a flag
        req.body.requiresAdditionalVerification = true;
      }
      
      // Verification passed, continue to the next middleware
      next();
    } catch (error) {
      console.error('reCAPTCHA verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verifying reCAPTCHA',
        requireRecaptcha: true
      });
    }
  };
}

// Helper to check if reCAPTCHA is properly configured
export function isGoogleRecaptchaConfigured(): boolean {
  return isRecaptchaConfigured;
}

// Get the site key for frontend use
export function getRecaptchaSiteKey(): string | null {
  return RECAPTCHA_SITE_KEY || null;
}