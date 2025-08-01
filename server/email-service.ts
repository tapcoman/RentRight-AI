import nodemailer, { createTransport, Transporter } from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { MailDataRequired } from '@sendgrid/helpers/classes/mail';
import { User, Document, Analysis } from '@shared/schema';

// Email service options
interface EmailServiceOptions {
  host?: string;
  port?: number;
  auth?: {
    user: string;
    pass: string;
  };
  secure?: boolean;
  useTestAccount?: boolean;
  sendgridApiKey?: string;
  useSendGrid?: boolean;
  defaultSender?: string; // Default email address to use as sender
}

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

/**
 * Email service for sending emails to users
 */
class EmailService {
  private transporter: Transporter | null = null;
  private testAccount: any = null;
  private fromAddress: string = '';
  private readonly appName: string = 'RentRight AI';
  private readonly baseUrl: string = '';
  
  private useSendGrid: boolean = false;
  private defaultSender: string = '';
  
  constructor(options?: EmailServiceOptions) {
    this.baseUrl = process.env.APP_URL || `https://${process.env.REPL_SLUG || 'rentrightai'}.replit.app`;
    
    // Use SendGrid if API key is provided
    if (options?.useSendGrid || options?.sendgridApiKey) {
      this.useSendGrid = true;
      // Set SendGrid API key if provided directly or from environment
      const apiKey = options?.sendgridApiKey || process.env.SENDGRID_API_KEY;
      if (apiKey) {
        sgMail.setApiKey(apiKey);
        
        // Handle defaultSender in priority order:
        // 1. Sender specified directly in options
        // 2. Default sender from environment (SENDGRID_FROM_EMAIL)
        // 3. Default fallback address
        if (options?.defaultSender) {
          this.defaultSender = options.defaultSender;
        } else {
          this.defaultSender = process.env.SENDGRID_FROM_EMAIL || 'noreply@rentrightai.com';
        }
        
        this.fromAddress = this.defaultSender;
        
        // Validate email format
        if (!this.fromAddress.includes('@')) {
          console.error(`WARNING: Invalid sender email format "${this.fromAddress}". Email sending may fail.`);
        }
        
        console.log(`SendGrid configured successfully with sender: ${this.fromAddress}`);
        return;
      } else {
        console.warn('SendGrid API key not provided, falling back to test account');
      }
    }
    
    // Initialize with test account if specifically requested or no other options
    if (options?.useTestAccount || !options) {
      this.initTestAccount();
      return;
    }
    
    // Standard SMTP configuration
    this.fromAddress = options.auth?.user || `noreply@${this.baseUrl.replace('https://', '')}`;
    
    this.transporter = createTransport({
      host: options.host,
      port: options.port || 587,
      secure: options.secure || false,
      auth: options.auth,
    });
    
    console.log('SMTP email transport configured');
  }
  
  /**
   * Initialize a test email account using Ethereal
   */
  private async initTestAccount() {
    try {
      // Create a test account at ethereal.email
      this.testAccount = await nodemailer.createTestAccount();
      
      // Create a SMTP transporter object
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: this.testAccount.user,
          pass: this.testAccount.pass,
        },
      });
      
      this.fromAddress = this.testAccount.user;
      console.log('Email test account created: ', this.testAccount.user);
    } catch (error) {
      console.error('Failed to create test email account:', error);
    }
  }
  
  /**
   * Send an email
   * 
   * @param options Email options including recipient, subject, and content
   * @returns Information about the sent email or null if sending failed
   */
  async sendEmail(options: EmailOptions): Promise<any> {
    // Validate email address to avoid errors
    if (!options.to || typeof options.to !== 'string' || !options.to.includes('@')) {
      console.error(`Invalid recipient email address: "${options.to}"`);
      return null;
    }
    
    // Process HTML content to ensure it's well-formed
    const hasHtmlContent = !!options.html;
    
    // Extract plaintext from HTML if text not provided but HTML is
    let plainText = options.text;
    if (!plainText && hasHtmlContent) {
      plainText = options.html!
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')  // Remove style tags and their content
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags and their content
        .replace(/<[^>]*>/g, '')  // Remove all remaining HTML tags
        .replace(/&nbsp;/g, ' ')  // Replace non-breaking spaces with regular spaces
        .replace(/\s+/g, ' ')     // Collapse multiple whitespace characters
        .trim();                   // Trim leading/trailing whitespace
    }
    
    console.log(`Email service status: useSendGrid=${this.useSendGrid}, fromAddress=${this.fromAddress}, testAccount=${!!this.testAccount}`);
    
    // Use SendGrid if configured
    if (this.useSendGrid) {
      try {
        // Make sure we have a valid fromAddress
        if (!this.fromAddress || !this.fromAddress.includes('@')) {
          console.error(`Invalid sender email address: "${this.fromAddress}". Using default fallback.`);
          this.fromAddress = 'noreply@rentrightai.com';
        }
        
        // Format the sender properly as { email: '...', name: '...' }
        // This ensures proper formatting for SendGrid
        const formattedFrom = {
          email: this.fromAddress,
          name: this.appName
        };
        
        // Check if HTML is a complete document or just a fragment
        let htmlContent = options.html || '';
        if (hasHtmlContent && !htmlContent.includes('<!DOCTYPE html>')) {
          // Wrap the HTML fragment in a proper document
          htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>${options.subject || 'RentRight AI Notification'}</title>
</head>
<body style="font-family: Arial, sans-serif; -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.6; margin: 0; padding: 0;">
    ${htmlContent}
</body>
</html>`;
        }
        
        // Create SendGrid message with text and html
        // Make sure we always have content (text must be a non-empty string)
        const msg: MailDataRequired = {
          to: options.to,
          from: formattedFrom,
          subject: options.subject || 'RentRight AI Notification',
          text: plainText || 'Please view this email with an HTML-compatible email client.',
          html: htmlContent,
          mailSettings: {
            sandboxMode: {
              enable: process.env.NODE_ENV === 'test' // Enable sandbox mode only in test environment
            }
          },
          trackingSettings: {
            clickTracking: {
              enable: true
            },
            openTracking: {
              enable: true
            }
          }
        };

        // Add attachments if provided
        if (options.attachments && options.attachments.length > 0) {
          msg.attachments = options.attachments.map(attachment => ({
            filename: attachment.filename,
            content: attachment.content.toString('base64'),
            type: attachment.contentType,
            disposition: 'attachment'
          }));
        }
        
        // Verify SendGrid API key is set
        const apiKey = process.env.SENDGRID_API_KEY;
        if (!apiKey) {
          console.error('SendGrid API key not found in environment variables');
          throw new Error('SendGrid API key not configured');
        }
        
        // Double-check that the API key is set in SendGrid client
        // This is necessary in case the client wasn't initialized properly
        sgMail.setApiKey(apiKey);
        
        console.log(`Sending email via SendGrid to ${options.to} from ${formattedFrom.email}`);
        console.log(`Email subject: ${msg.subject}`);
        
        // Add message ID for tracking
        const messageId = `rent-right-ai-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        
        if (!msg.headers) {
          msg.headers = {};
        }
        msg.headers['X-Message-ID'] = messageId;
        msg.headers['X-RentRight-AI'] = 'Email-Report';
        msg.headers['List-Unsubscribe'] = `<mailto:unsubscribe@rentrightai.co.uk?subject=Unsubscribe-${messageId}>`;
        
        const response = await sgMail.send(msg);
        console.log(`SendGrid email sent successfully, response status: ${response[0]?.statusCode}, message ID: ${messageId}`);
        return response;
      } catch (error: any) {
        console.error('SendGrid email sending failed:', error);
        
        // Log detailed error information
        if (error.response) {
          console.error('SendGrid error details:', error.response.body);
        } else {
          console.error('SendGrid error without response details', error.message || error);
        }
        
        // If SendGrid fails, fall back to test account for development
        if (process.env.NODE_ENV !== 'production') {
          console.log('Falling back to test account...');
          // Continue to nodemailer path
        } else {
          return null;
        }
      }
    }
    
    // Standard nodemailer path for test account or SMTP
    if (!this.transporter) {
      if (process.env.NODE_ENV !== 'production') {
        // In development, initialize a test account if none exists
        if (!this.testAccount) {
          await this.initTestAccount();
        }
      } else {
        console.error('Email service not configured');
        return null;
      }
    }
    
    if (!this.transporter) {
      console.error('Failed to initialize email transporter');
      return null;
    }
    
    try {
      // Check if HTML is a complete document or just a fragment
      let htmlContent = options.html || '';
      if (hasHtmlContent && !htmlContent.includes('<!DOCTYPE html>')) {
        // Wrap the HTML fragment in a proper document
        htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>${options.subject || 'RentRight AI Notification'}</title>
</head>
<body style="font-family: Arial, sans-serif; -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.6; margin: 0; padding: 0;">
    ${htmlContent}
</body>
</html>`;
      }
      
      // Generate a message ID for tracking
      const messageId = `rent-right-ai-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      const info = await this.transporter.sendMail({
        from: `"${this.appName}" <${this.fromAddress}>`,
        to: options.to,
        subject: options.subject,
        text: plainText,
        html: htmlContent,
        messageId: `<${messageId}@rentrightai.co.uk>`,
        headers: {
          'X-Message-ID': messageId,
          'X-RentRight-AI': 'Email-Report',
          'List-Unsubscribe': `<mailto:unsubscribe@rentrightai.co.uk?subject=Unsubscribe-${messageId}>`
        }
      });
      
      // Log test URL for development
      if (this.testAccount) {
        const getTestMessageUrl = (await import('nodemailer')).getTestMessageUrl;
        console.log('Email preview URL: %s', getTestMessageUrl(info));
      }
      
      return info;
    } catch (error) {
      console.error('Failed to send email:', error);
      return null;
    }
  }
  
  /**
   * Send a document access email with a signed URL
   * 
   * @param user User to send the email to
   * @param document Document being shared
   * @param analysis Analysis results
   * @param signedUrlToken The signed URL token for secure access
   * @returns Information about the sent email
   */
  async sendDocumentAccessEmail(
    email: string,
    document: Document,
    analysis: Analysis,
    signedUrlToken: string
  ): Promise<any> {
    const downloadUrl = `${this.baseUrl}/documents/download/${signedUrlToken}`;
    
    const subject = `Your RentRight AI Analysis Report is Ready`;
    
    const text = `
      Hello,
      
      Your tenancy agreement analysis report for "${document.filename}" is ready. You can access it securely using the link below:
      
      ${downloadUrl}
      
      This link will expire in 24 hours for security purposes.
      
      Thank you for using RentRight AI!
      
      The RentRight AI Team
    `;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #EC7134; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; margin-bottom: 0;">
          <!-- Logo and branding -->
          <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 5px;">
            <div style="font-size: 28px; font-weight: bold; color: white; display: flex; align-items: center; justify-content: center;">
              <span>Rent<span style="color: #FFFAF5;">Right</span></span>
              <span style="background-color: #FFFAF5; color: #EC7134; font-size: 13px; border-radius: 9999px; padding: 2px 6px; margin-left: 5px; font-weight: bold;">AI</span>
            </div>
          </div>
          <p style="color: white; margin: 5px 0 0 0;">AI-Powered Tenancy Agreement Analysis</p>
        </div>
        <div style="background-color: #FFFAF5; padding: 20px; border-radius: 0 0 5px 5px; border: 1px solid #F3EEE4; border-top: none;">
          <h2 style="color: #EC7134; margin-top: 0;">Your Analysis Report is Ready</h2>
          <p>Hello,</p>
          <p>Your tenancy agreement analysis report for "<strong>${document.filename}</strong>" is ready. You can access it securely using the link below:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${downloadUrl}" style="background-color: #EC7134; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Download Your Report</a>
          </p>
          <p><em>This link will expire in 24 hours for security purposes.</em></p>
          <p>Thank you for using RentRight AI!</p>
          <p>The RentRight AI Team</p>
        </div>
      </div>
    `;
    
    // Log the email being sent for debugging
    console.log(`Sending document access email to ${email} for document ${document.id}`);
    
    return this.sendEmail({
      to: email,
      subject,
      text,
      html,
    });
  }

  /**
   * Send analysis report directly to customer after payment
   * 
   * @param email Customer's email address
   * @param document Document that was analyzed
   * @param analysis Analysis results
   * @returns Information about the sent email
   */
  async sendAnalysisReportEmail(
    email: string,
    document: Document,
    analysis: Analysis
  ): Promise<any> {
    // Initial validation: Check if email is provided
    if (!email) {
      console.warn('No email provided for analysis report');
      return null;
    }
    
    // Email format validation
    if (typeof email !== 'string' || !email.includes('@')) {
      console.error(`Invalid email format provided: "${email}"`);
      return null;
    }
    
    // Document validation
    if (!document || !document.id || !document.filename) {
      console.error('Invalid document object provided for email');
      console.error('Document:', JSON.stringify(document));
      return null;
    }
    
    // Analysis validation
    if (!analysis || !analysis.results) {
      console.error('Invalid analysis object provided for email');
      console.error('Analysis:', JSON.stringify(analysis));
      return null;
    }
    
    console.log(`Preparing to send analysis report email to: ${email}`);
    console.log(`Email configuration: SendGrid=${this.useSendGrid}, FromAddress=${this.fromAddress}`);

    // Ensure we have correct absolute URL with full hostname
    // This should match the route pattern used in the frontend
    const viewUrl = `${this.baseUrl}/analysis/${document.id}/report`;
    
    // Get summary information from analysis results
    const results = analysis.results || {};
    // For TypeScript, treat results as any so we can safely access dynamic properties
    const resultsAny = results as any;
    
    // Get compliance score directly from the analysis results
    // Use the AI-provided compliance score directly for consistency across the app
    let complianceScore;
    if (resultsAny.complianceScore !== undefined) {
      complianceScore = resultsAny.complianceScore;
    } else if (resultsAny.compliance?.score !== undefined) {
      complianceScore = resultsAny.compliance.score;
    } else {
      // Fallback
      complianceScore = 'N/A';
    }
    
    // Get compliance level based on score or directly from compliance object
    let complianceLevel;
    if (resultsAny.compliance?.level) {
      complianceLevel = resultsAny.compliance.level;
    } else if (complianceScore !== 'N/A') {
      // Determine level based on score
      if (complianceScore >= 75) {
        complianceLevel = 'green';
      } else if (complianceScore >= 41) {
        complianceLevel = 'yellow';
      } else {
        complianceLevel = 'red';
      }
    } else {
      complianceLevel = 'Unknown';
    }
    
    // Convert level to user-friendly text
    let complianceLevelText;
    if (complianceLevel === 'green') {
      complianceLevelText = 'Good Protection';
    } else if (complianceLevel === 'yellow') {
      complianceLevelText = 'Fair Protection';
    } else if (complianceLevel === 'red') {
      complianceLevelText = 'Poor Protection';
    } else {
      complianceLevelText = 'Unknown';
    }
    
    const insightCount = (resultsAny.insights || []).length;
    
    // Color mapping for compliance level
    const levelColors = {
      'green': '#4CAF50',
      'yellow': '#FFC107', 
      'red': '#F44336',
      'Unknown': '#9E9E9E'
    };
    const complianceColor = levelColors[complianceLevel as keyof typeof levelColors] || levelColors.Unknown;
    
    const subject = `Your RentRight AI Tenancy Agreement Analysis Results`;
    
    // Create plain text version first
    const text = `
Hello,

Thank you for using RentRight AI to analyze your tenancy agreement "${document.filename}".

Analysis Summary:
- Compliance Score: ${complianceScore}%
- Compliance Level: ${complianceLevelText}
- Issues Identified: ${insightCount}

View your full analysis report here:
${viewUrl}

If you have any questions about your analysis, please reply to this email.

Thank you,
The RentRight AI Team
    `.trim();
    
    // Simplify HTML for better email client compatibility
    let recommendationsHtml = '';
    if (resultsAny.recommendations && resultsAny.recommendations.length > 0) {
      const recItems = resultsAny.recommendations.slice(0, 2).map((recommendation: any, index: number) => {
        return `
          <div style="margin-bottom: 15px; padding: 12px; border-radius: 5px; background-color: #f0fdf4; border: 1px solid #dcfce7;">
            <h4 style="margin-top: 0; color: #166534;">
              <span style="display: inline-block; width: 20px; height: 20px; background-color: #22C55E; color: white; border-radius: 50%; text-align: center; margin-right: 8px; font-size: 12px;">✓</span>
              Recommendation ${index + 1}
            </h4>
            <p style="margin-bottom: 0;">${recommendation.content}</p>
          </div>
        `;
      }).join('');
      
      const moreText = resultsAny.recommendations.length > 2 
        ? `<p style="text-align: center; font-style: italic;">Plus ${resultsAny.recommendations.length - 2} more recommendations in the full report.</p>` 
        : '';
      
      recommendationsHtml = `
        <div style="background-color: #FFFFFF; border: 1px solid #E0E0E0; border-radius: 4px; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #22C55E;">Tenant Recommendations</h3>
          ${recItems}
          ${moreText}
        </div>
      `;
    }
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>RentRight AI Analysis Results</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto;">
          <!-- Header -->
          <tr>
            <td align="center" bgcolor="#EC7134" style="padding: 20px; border-radius: 5px 5px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <span style="font-size: 28px; font-weight: bold; color: white;">Rent<span style="color: #FFFAF5;">Right</span></span>
                          <span style="background-color: #FFFAF5; color: #EC7134; font-size: 13px; border-radius: 9999px; padding: 2px 6px; margin-left: 5px; font-weight: bold; display: inline-block;">AI</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="color: white; margin: 5px 0 0 0;">AI-Powered Tenancy Agreement Analysis</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td bgcolor="#FFFAF5" style="padding: 20px; border-radius: 0 0 5px 5px; border: 1px solid #F3EEE4; border-top: none;">
              <h2 style="color: #EC7134; margin-top: 0;">Your Tenancy Agreement Analysis Results</h2>
              
              <p>Hello,</p>
              
              <p>Thank you for using RentRight AI to analyze your tenancy agreement "<strong>${document.filename}</strong>".</p>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border: 1px solid #E0E0E0; border-radius: 4px; margin: 20px 0;">
                <tr>
                  <td style="padding: 15px;">
                    <h3 style="margin-top: 0; color: #333333;">Analysis Summary</h3>
                    
                    <table width="100%" cellpadding="5" cellspacing="0" border="0">
                      <tr>
                        <td width="150" style="font-weight: bold;">Compliance Score:</td>
                        <td>${complianceScore}%</td>
                      </tr>
                      <tr>
                        <td width="150" style="font-weight: bold;">Compliance Level:</td>
                        <td style="color: ${complianceColor}; font-weight: bold;">${complianceLevelText}</td>
                      </tr>
                      <tr>
                        <td width="150" style="font-weight: bold;">Issues Identified:</td>
                        <td>${insightCount}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              ${recommendationsHtml}
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 30px 0;">
                    <a href="${viewUrl}" style="background-color: #EC7134; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View Full Analysis Report</a>
                  </td>
                </tr>
              </table>
              
              <p>If you have any questions about your analysis, please reply to this email.</p>
              
              <p>Thank you,<br>The RentRight AI Team</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
    
    // Log the email being sent for debugging
    console.log(`Sending analysis report email to ${email} for document ${document.id}`);
    
    return this.sendEmail({
      to: email,
      subject,
      text, // Plain text version helps with delivery and readability in text-only clients
      html,
    });
  }
}

// Create and export a default instance
// Check for SendGrid configuration in environment variables
const sendgridApiKey = process.env.SENDGRID_API_KEY;

// Use SendGrid if API key is available, otherwise fall back to test account
const sendgridFromEmail = process.env.SENDGRID_FROM_EMAIL;

// Log detailed configuration information
console.log(`Email service configuration: 
  - SendGrid API Key: ${sendgridApiKey ? 'Present' : 'Missing'} 
  - SendGrid From Email: ${sendgridFromEmail || 'Missing'}`);

// Create and export a default instance with more detailed configuration
export const emailService = new EmailService(
  sendgridApiKey 
    ? { 
        useSendGrid: true, 
        sendgridApiKey,
        // Explicitly include the from email if available
        ...(sendgridFromEmail ? { defaultSender: sendgridFromEmail } : {})
      } 
    : { useTestAccount: true }
);