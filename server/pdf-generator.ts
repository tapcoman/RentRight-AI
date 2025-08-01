import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont, Color } from 'pdf-lib';

// Define our own RGB type since it's not exported from pdf-lib
type RGB = ReturnType<typeof rgb>;
import { Document } from '../shared/schema';
import { Analysis } from '../shared/schema';
import { logoSvg, footerText, legalDisclaimerText } from './logo-utils';

// Helper function for RGB with alpha (transparency not supported directly by pdf-lib)
// Just using rgb for simplicity, ignoring the alpha value
function rgbWithAlpha(r: number, g: number, b: number, _alpha: number): RGB {
  return rgb(r, g, b);
}

/**
 * Enhanced PDF Report Generator for RentRight AI
 * Creates a professional multi-page PDF with detailed analysis results
 */

// Helper function to sanitize text for PDF
function sanitizeText(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    .replace(/[\u2010-\u2015]/g, '-') // Unicode hyphens to standard hyphen
    .replace(/[\u2018\u2019]/g, "'") // Smart quotes to straight quotes
    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes to straight quotes
    .replace(/…/g, '...') // Ellipsis to three dots
    .replace(/[^\x00-\x7F]/g, ' '); // Replace non-ASCII with space
}

// Helper to split text into lines that fit width
function splitTextIntoLines(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  if (!text) return [''];
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const potentialLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(potentialLine, fontSize);
    
    if (width <= maxWidth) {
      currentLine = potentialLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

// Define insight interface for TypeScript
interface Insight {
  type: string;
  title: string;
  content: string;
  indicators?: string[];
  rating?: {
    label: string;
    value: number;
  };
}

// PDF page helper class
class PDFReportPage {
  page: PDFPage;
  width: number;
  height: number;
  yPosition: number;
  pageNumber: number;
  totalPages: number;
  
  // Standard formatting elements
  regularFont: PDFFont;
  boldFont: PDFFont;
  primaryColor = rgb(0.17, 0.32, 0.51); // #2C5282 (dark blue)
  secondaryColor = rgb(0.38, 0.64, 0.88); // #6193E0 (lighter blue)
  grayColor = rgb(0.5, 0.5, 0.5);
  redColor = rgb(0.8, 0.2, 0.2);
  yellowColor = rgb(0.95, 0.7, 0.1);
  greenColor = rgb(0.2, 0.7, 0.3);
  
  constructor(page: PDFPage, regularFont: PDFFont, boldFont: PDFFont, pageNumber: number, totalPages: number) {
    this.page = page;
    const { width, height } = page.getSize();
    this.width = width;
    this.height = height;
    this.yPosition = height - 50; // Start position
    this.regularFont = regularFont;
    this.boldFont = boldFont;
    this.pageNumber = pageNumber;
    this.totalPages = totalPages;
  }
  
  // Draw text with automatic line wrapping
  drawText(text: string | null | undefined, x: number, size: number, 
           font: PDFFont = this.regularFont, color = this.primaryColor, maxWidth?: number): number {
    const safeText = sanitizeText(text);
    
    if (maxWidth) {
      const lines = splitTextIntoLines(safeText, font, size, maxWidth);
      let lineY = this.yPosition;
      
      for (const line of lines) {
        this.page.drawText(line, { x, y: lineY, size, font, color });
        lineY -= size + 2; // Line spacing
      }
      
      this.yPosition = lineY;
      return lineY; // Return new Y position
    } else {
      this.page.drawText(safeText, { x, y: this.yPosition, size, font, color });
      this.yPosition -= (size + 2);
      return this.yPosition;
    }
  }
  
  // Add a section header with divider line
  addSectionHeader(title: string): void {
    this.drawText(title, 50, 18, this.boldFont, this.primaryColor);
    
    // Draw divider line 
    this.page.drawLine({
      start: { x: 50, y: this.yPosition },
      end: { x: this.width - 50, y: this.yPosition },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    
    this.yPosition -= 20; // Space after header
  }
  
  // Add a header with RentRight AI branding
  async addHeaderLogo(pdfDoc: PDFDocument): Promise<void> {
    try {
      // Create branded header text instead of an image
      this.page.drawText("RentRight AI", {
        x: this.width - 250,
        y: this.height - 50,
        size: 28,
        font: this.boldFont,
        color: this.primaryColor,
      });
      
      // Add a colored rectangle as a design element
      this.page.drawRectangle({
        x: this.width - 260,
        y: this.height - 55,
        width: 5,
        height: 40,
        color: this.secondaryColor,
      });
    } catch (error) {
      console.error("Error creating header:", error);
      // Continue without the header if there's an error
    }
  }
  
  // Add a footer with page numbers
  addFooter(): void {
    const footerY = 30;
    
    // Page numbers
    this.page.drawText(`Page ${this.pageNumber} of ${this.totalPages}`, {
      x: this.width - 150,
      y: footerY,
      size: 10,
      font: this.regularFont,
      color: this.grayColor,
    });
    
    // Footer text
    this.page.drawText(footerText, {
      x: 50,
      y: footerY,
      size: 10,
      font: this.regularFont,
      color: this.grayColor,
    });
  }
  
  // Check if we need a new page based on content height
  needsNewPage(requiredHeight: number): boolean {
    // Reserve space for footer (30 points)
    return this.yPosition - requiredHeight < 50;
  }

  // Draw a rectangle with optional fill and border
  drawRectangle(x: number, y: number, width: number, height: number, 
                fillColor?: RGB, borderWidth: number = 0, borderColor?: RGB): void {
    // Use a single rectangle with border properties
    this.page.drawRectangle({
      x,
      y,
      width,
      height,
      color: fillColor,
      borderColor: borderWidth > 0 ? borderColor : undefined,
      borderWidth: borderWidth > 0 ? borderWidth : undefined
    });
  }
  
  // Draw a compliance indicator (traffic light system)
  drawComplianceIndicator(x: number, y: number, complianceLevel: 'high' | 'medium' | 'low'): void {
    const circleRadius = 8;
    const spacing = 22;
    
    // Draw three circles for the traffic light
    // Red circle (top)
    this.drawCircle(
      x, 
      y, 
      circleRadius, 
      complianceLevel === 'low' ? this.redColor : rgb(0.8, 0.8, 0.8)
    );
    
    // Yellow circle (middle)
    this.drawCircle(
      x, 
      y - spacing, 
      circleRadius, 
      complianceLevel === 'medium' ? this.yellowColor : rgb(0.8, 0.8, 0.8)
    );
    
    // Green circle (bottom)
    this.drawCircle(
      x, 
      y - (spacing * 2), 
      circleRadius, 
      complianceLevel === 'high' ? this.greenColor : rgb(0.8, 0.8, 0.8)
    );
    
    // Draw a containing rectangle
    this.drawRectangle(
      x - circleRadius - 5, 
      y + 5, 
      (circleRadius * 2) + 10, 
      (spacing * 2) + 10, 
      undefined, 
      1, 
      this.grayColor
    );
  }
  
  // Updated drawCircle method to match updated PDFLib API
  drawCircle(x: number, y: number, radius: number, fillColor?: RGB): void {
    // Use PDFLib's drawCircle API
    this.page.drawCircle({
      x,
      y,
      size: radius * 2, // size is diameter in PDFLib
      color: fillColor
    });
  }
}

export async function generateSimplePdfReport(document: Document, analysis: Analysis): Promise<Buffer> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Embed fonts
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Parse analysis results
  let analysisResults: any = null;
  try {
    if (typeof analysis.results === 'string') {
      analysisResults = JSON.parse(analysis.results);
    } else {
      analysisResults = analysis.results;
    }
  } catch (error) {
    console.error("Error parsing analysis results:", error);
    // Create a simple error PDF
    const errorPage = pdfDoc.addPage([595, 842]); // A4 size
    errorPage.drawText('Error: Unable to parse analysis results', {
      x: 50,
      y: 500,
      size: 14,
      font: boldFont,
      color: rgb(0.8, 0.2, 0.2),
    });
    
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
  
  // Extract insights by type for analysis
  const warningInsights = analysisResults?.insights?.filter((insight: Insight) => insight.type === 'warning') || [];
  const accentInsights = analysisResults?.insights?.filter((insight: Insight) => insight.type === 'accent') || [];
  const standardInsights = analysisResults?.insights?.filter((insight: Insight) => 
    insight.type !== 'warning' && insight.type !== 'accent') || [];
  
  // Use the AI-generated compliance score directly from the analysis results
  // Let the AI dictate the scoring system, don't override with our calculation
  const complianceScore = analysisResults?.complianceScore || 
                         analysisResults?.compliance?.score || 
                         analysisResults?.score || 
                         100; // Default to 100 only if no score is provided
  
  // Determine compliance level based on score
  let complianceLevel: 'high' | 'medium' | 'low' = 'medium';
  if (complianceScore >= 80) {
    complianceLevel = 'high';
  } else if (complianceScore >= 50) {
    complianceLevel = 'medium';
  } else {
    complianceLevel = 'low';
  }
  
  // Score labels and colors
  let scoreLabel = 'Unknown';
  let scoreColor = rgb(0.5, 0.5, 0.5);
  
  if (complianceScore >= 80) {
    scoreLabel = 'Good - Generally Fair Agreement';
    scoreColor = rgb(0.2, 0.7, 0.3); // Green
  } else if (complianceScore >= 50) {
    scoreLabel = 'Moderate - Some Concerns';
    scoreColor = rgb(0.95, 0.7, 0.1); // Yellow/Amber
  } else {
    scoreLabel = 'Poor - Multiple Serious Issues';
    scoreColor = rgb(0.8, 0.2, 0.2); // Red
  }
  
  // Estimate total pages based on content
  const estimatedPagesForInsights = Math.ceil((warningInsights.length + accentInsights.length + standardInsights.length) / 5);
  const estimatedTotalPages = 2 + estimatedPagesForInsights; // Cover page, summary page, and insight pages
  
  // Initialize pages array
  const pages: PDFReportPage[] = [];
  
  // COVER PAGE (page 1)
  const coverPage = new PDFReportPage(
    pdfDoc.addPage([595, 842]), 
    regularFont, 
    boldFont, 
    1, 
    estimatedTotalPages
  );
  
  // Add logo to cover page
  await coverPage.addHeaderLogo(pdfDoc);
  
  // Add title with large text
  coverPage.yPosition = coverPage.height - 250; // Position title in the middle
  coverPage.drawText('LEASE AGREEMENT ANALYSIS', 50, 36, boldFont, rgb(0.17, 0.32, 0.51));
  coverPage.drawText('COMPREHENSIVE REPORT', 50, 28, regularFont, rgb(0.38, 0.64, 0.88));
  coverPage.yPosition -= 40;
  
  // Add document details
  coverPage.yPosition -= 30;
  coverPage.drawText(`Document: ${document.filename}`, 50, 14, regularFont);
  coverPage.drawText(`Analysis Date: ${new Date(analysis.completedAt || Date.now()).toLocaleDateString()}`, 50, 14, regularFont);
  
  // Add compliance score in large format on cover with traffic light indicator
  coverPage.yPosition -= 60;
  
  // Draw traffic light indicator
  const trafficLightX = coverPage.width - 150;
  const trafficLightY = coverPage.yPosition - 20;
  const indicatorRadius = 20;
  const indicatorSpacing = 50;
  
  // Draw traffic light housing - use SVG for rounded corners
  const housingX = trafficLightX - 30;
  const housingY = trafficLightY - 80;
  const housingWidth = 60;
  const housingHeight = 160;
  const cornerRadius = 10;
  
  // Instead of using complex SVG for rounded corners, use simple rectangle
  // and simulate rounded corners with multiple shapes if needed
  coverPage.page.drawRectangle({
    x: housingX,
    y: housingY,
    width: housingWidth,
    height: housingHeight,
    color: rgb(0.2, 0.2, 0.2),
    borderColor: rgb(0.1, 0.1, 0.1),
    borderWidth: 2
  });
  
  // Draw red light (always grayed out unless it's the active level)
  const redColor = complianceLevel === 'low' ? rgb(0.9, 0.2, 0.2) : rgbWithAlpha(0.4, 0.2, 0.2, 0.3);
  coverPage.page.drawCircle({
    x: trafficLightX,
    y: trafficLightY,
    size: indicatorRadius,
    color: redColor,
    borderColor: rgb(0.1, 0.1, 0.1),
    borderWidth: 1
  });
  
  // Draw amber/yellow light (always grayed out unless it's the active level)
  const amberColor = complianceLevel === 'medium' ? rgb(0.95, 0.7, 0.1) : rgbWithAlpha(0.4, 0.3, 0.1, 0.3);
  coverPage.page.drawCircle({
    x: trafficLightX,
    y: trafficLightY - indicatorSpacing,
    size: indicatorRadius,
    color: amberColor,
    borderColor: rgb(0.1, 0.1, 0.1),
    borderWidth: 1
  });
  
  // Draw green light (always grayed out unless it's the active level)
  const greenColor = complianceLevel === 'high' ? rgb(0.2, 0.7, 0.3) : rgbWithAlpha(0.2, 0.4, 0.2, 0.3);
  coverPage.page.drawCircle({
    x: trafficLightX,
    y: trafficLightY - (indicatorSpacing * 2),
    size: indicatorRadius,
    color: greenColor,
    borderColor: rgb(0.1, 0.1, 0.1),
    borderWidth: 1
  });
  
  // Draw compliance text
  coverPage.drawText(`Compliance Score: ${complianceScore}%`, 50, 24, boldFont, scoreColor);
  coverPage.drawText(`Assessment: ${scoreLabel}`, 50, 18, regularFont, scoreColor);
  
  // Short disclaimer at bottom of cover
  coverPage.yPosition = 120;
  coverPage.drawText("This analysis is AI-generated and does not constitute legal advice.", 50, 10, regularFont, rgb(0.8, 0.2, 0.2), coverPage.width - 100);
  
  // Add footer
  coverPage.addFooter();
  pages.push(coverPage);
  
  // SUMMARY PAGE (page 2)
  const summaryPage = new PDFReportPage(
    pdfDoc.addPage([595, 842]), 
    regularFont, 
    boldFont, 
    2,
    estimatedTotalPages
  );
  
  // Add logo and title
  await summaryPage.addHeaderLogo(pdfDoc);
  summaryPage.drawText('ANALYSIS SUMMARY', 50, 24, boldFont, rgb(0.17, 0.32, 0.51));
  summaryPage.yPosition -= 20;
  
  // Add compliance assessment section
  summaryPage.addSectionHeader('COMPLIANCE ASSESSMENT');
  
  // Create a visual representation of the compliance score using a bar
  const barWidth = 400;
  const barHeight = 20;
  const barX = 70;
  const barY = summaryPage.yPosition - 30;
  
  // Background (gray) bar
  summaryPage.page.drawRectangle({
    x: barX,
    y: barY,
    width: barWidth,
    height: barHeight,
    color: rgb(0.9, 0.9, 0.9),
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 1,
  });
  
  // Filled (colored) bar based on score
  const filledWidth = (complianceScore / 100) * barWidth;
  summaryPage.page.drawRectangle({
    x: barX,
    y: barY,
    width: filledWidth,
    height: barHeight,
    color: scoreColor,
  });
  
  // Score text
  summaryPage.page.drawText(`${complianceScore}%`, {
    x: barX + filledWidth - 30,
    y: barY + 6,
    size: 12,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
  
  summaryPage.yPosition = barY - 20;
  summaryPage.drawText(`Assessment: ${scoreLabel}`, 70, 14, regularFont, scoreColor);
  summaryPage.yPosition -= 20;
  
  // Key Issues Section
  summaryPage.addSectionHeader('KEY ISSUES IDENTIFIED');
  
  if (warningInsights && warningInsights.length > 0) {
    summaryPage.drawText(`Found ${warningInsights.length} potential legal or compliance issues:`, 70, 12, regularFont);
    summaryPage.yPosition -= 10;
    
    // Show summary of issues
    for (let i = 0; i < Math.min(warningInsights.length, 5); i++) {
      const insight = warningInsights[i];
      const bulletPoint = `• ${insight.title || 'Issue not specified'}`;
      summaryPage.drawText(bulletPoint, 70, 12, boldFont, rgb(0.8, 0.2, 0.2));
    }
    
    if (warningInsights.length > 5) {
      summaryPage.drawText(`• Plus ${warningInsights.length - 5} more issues detailed in following pages`, 70, 12, regularFont);
    }
  } else if (accentInsights.length > 0) {
    summaryPage.drawText('No serious issues identified, but some improvements suggested:', 70, 12, regularFont, rgb(0.95, 0.7, 0.1));
    summaryPage.yPosition -= 10;
    
    // Display accent insights
    for (let i = 0; i < Math.min(accentInsights.length, 3); i++) {
      const insight = accentInsights[i];
      const bulletPoint = `• ${insight.title || 'Suggestion'}`;
      summaryPage.drawText(bulletPoint, 70, 12, regularFont, rgb(0.95, 0.7, 0.1));
    }
  } else {
    summaryPage.drawText('No specific issues identified. This agreement appears to be fair and compliant.', 70, 12, regularFont, rgb(0.2, 0.7, 0.3));
  }
  
  summaryPage.yPosition -= 30;
  
  // Property Details Section
  summaryPage.addSectionHeader('PROPERTY & FINANCIAL DETAILS');
  
  // Extract property details
  const propertyDetails = analysisResults?.propertyDetails || 
                          analysisResults?.property ||
                          {};
  
  // Address
  summaryPage.drawText('Property Address:', 70, 12, boldFont);
  summaryPage.drawText(propertyDetails.address || 'Not specified', 200, 12, regularFont, undefined, summaryPage.width - 250);
  
  // Rent
  summaryPage.drawText('Monthly Rent:', 70, 12, boldFont);
  summaryPage.drawText(propertyDetails.rent || propertyDetails.monthlyRent || 'Not specified', 200, 12, regularFont);
  
  // Deposit
  summaryPage.drawText('Security Deposit:', 70, 12, boldFont);
  summaryPage.drawText(propertyDetails.deposit || propertyDetails.securityDeposit || 'Not specified', 200, 12, regularFont);
  
  summaryPage.yPosition -= 20;
  
  // Lease Period Section
  summaryPage.addSectionHeader('LEASE PERIOD & PARTIES');
  
  // Extract lease period details
  const leasePeriod = analysisResults?.leasePeriod || 
                      analysisResults?.tenancyPeriod ||
                      {};
  
  // Start Date
  summaryPage.drawText('Start Date:', 70, 12, boldFont);
  summaryPage.drawText(leasePeriod.startDate || 'Not specified', 200, 12, regularFont);
  
  // End Date
  summaryPage.drawText('End Date:', 70, 12, boldFont);
  summaryPage.drawText(leasePeriod.endDate || 'Not specified', 200, 12, regularFont);
  
  // Tenancy Type
  summaryPage.drawText('Tenancy Type:', 70, 12, boldFont);
  summaryPage.drawText(leasePeriod.tenancyType || 'Not specified', 200, 12, regularFont);
  
  // Add footer
  summaryPage.addFooter();
  pages.push(summaryPage);
  
  // DETAILED INSIGHTS PAGES
  let currentPage = new PDFReportPage(
    pdfDoc.addPage([595, 842]), 
    regularFont, 
    boldFont,
    3,
    estimatedTotalPages
  );
  
  await currentPage.addHeaderLogo(pdfDoc);
  currentPage.drawText('DETAILED ANALYSIS', 50, 24, boldFont, rgb(0.17, 0.32, 0.51));
  currentPage.yPosition -= 20;
  
  let sectionCounter = 1;
  
  // Helper function to split text into lines for proper wrapping
  const splitTextIntoLines = (text: string, charsPerLine: number): string[] => {
    if (!text) return [];
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      // Check if adding this word would exceed the line length
      if ((currentLine + word).length > charsPerLine) {
        // Add the current line to lines array
        if (currentLine.length > 0) {
          lines.push(currentLine.trim());
          currentLine = '';
        }
        
        // Handle very long words that exceed chars per line on their own
        if (word.length > charsPerLine) {
          // Break the word into chunks
          let remaining = word;
          while (remaining.length > charsPerLine) {
            lines.push(remaining.substring(0, charsPerLine));
            remaining = remaining.substring(charsPerLine);
          }
          currentLine = remaining + ' ';
        } else {
          currentLine = word + ' ';
        }
      } else {
        currentLine += word + ' ';
      }
    });
    
    // Add the last line if it's not empty
    if (currentLine.trim().length > 0) {
      lines.push(currentLine.trim());
    }
    
    return lines;
  };
  
  // Function to add an insight to the current page
  const addInsight = (insight: Insight, index: number, type: string) => {
    // Check if we need a new page
    if (currentPage.needsNewPage(150)) { // 150 is estimated height for an insight
      // Add footer to current page
      currentPage.addFooter();
      
      // Create new page
      const pageNumber = pages.length + 1;
      currentPage = new PDFReportPage(
        pdfDoc.addPage([595, 842]),
        regularFont,
        boldFont,
        pageNumber,
        estimatedTotalPages
      );
      
      // Add header to new page
      currentPage.drawText('DETAILED ANALYSIS (CONTINUED)', 50, 24, boldFont, rgb(0.17, 0.32, 0.51));
      currentPage.yPosition -= 20;
      
      pages.push(currentPage);
    }
    
    // Title with section number
    currentPage.drawText(`${sectionCounter}. ${insight.title || 'Unnamed Issue'}`, 50, 16, boldFont, 
      type === 'warning' ? rgb(0.8, 0.2, 0.2) : 
      type === 'accent' ? rgb(0.95, 0.7, 0.1) : 
      rgb(0.17, 0.32, 0.51));
    
    sectionCounter++;
    currentPage.yPosition -= 5;
    
    // Type indicator
    let typeText = '';
    if (type === 'warning') {
      typeText = 'SERIOUS ISSUE - May indicate non-compliance with UK law';
    } else if (type === 'accent') {
      typeText = 'CONCERN - May be unfavorable to tenant but legally compliant';
    } else {
      typeText = 'INFORMATION - Contextual details about agreement';
    }
    
    currentPage.drawText(typeText, 70, 10, boldFont, 
      type === 'warning' ? rgb(0.8, 0.2, 0.2) : 
      type === 'accent' ? rgb(0.95, 0.7, 0.1) : 
      rgb(0.5, 0.5, 0.5));
    
    currentPage.yPosition -= 15;
    
    // Full content
    currentPage.drawText(insight.content || 'No details provided', 70, 11, regularFont, rgb(0, 0, 0), currentPage.width - 140);
    
    // Add the relevant indicators if available
    if (insight.indicators && insight.indicators.length > 0) {
      currentPage.yPosition -= 5;
      const references = `Reference clauses: ${insight.indicators.join(', ')}`;
      currentPage.drawText(references, 70, 10, regularFont, rgb(0.5, 0.5, 0.5));
    }
    
    currentPage.yPosition -= 25; // Extra space after each insight
  };
  
  // Process all insights by type for better organization
  
  // First, add warning insights (most important)
  if (warningInsights.length > 0) {
    currentPage.addSectionHeader('SERIOUS LEGAL ISSUES');
    warningInsights.forEach((insight: Insight, index: number) => {
      addInsight(insight, index, 'warning');
    });
  }
  
  // Then add accent insights (concerns but not violations)
  if (accentInsights.length > 0) {
    // Add section header, but check if we need a new page first
    if (currentPage.needsNewPage(100)) {
      // Add footer to current page
      currentPage.addFooter();
      
      // Create new page
      const pageNumber = pages.length + 1;
      currentPage = new PDFReportPage(
        pdfDoc.addPage([595, 842]),
        regularFont,
        boldFont,
        pageNumber,
        estimatedTotalPages
      );
      
      // Add header to new page
      currentPage.drawText('DETAILED ANALYSIS (CONTINUED)', 50, 24, boldFont, rgb(0.17, 0.32, 0.51));
      currentPage.yPosition -= 20;
      
      pages.push(currentPage);
    }
    
    currentPage.addSectionHeader('POTENTIAL CONCERNS');
    accentInsights.forEach((insight: Insight, index: number) => {
      addInsight(insight, index, 'accent');
    });
  }
  
  // Finally add standard insights
  if (standardInsights.length > 0) {
    // Add section header, but check if we need a new page first
    if (currentPage.needsNewPage(100)) {
      // Add footer to current page
      currentPage.addFooter();
      
      // Create new page
      const pageNumber = pages.length + 1;
      currentPage = new PDFReportPage(
        pdfDoc.addPage([595, 842]),
        regularFont,
        boldFont,
        pageNumber,
        estimatedTotalPages
      );
      
      // Add header to new page
      currentPage.drawText('DETAILED ANALYSIS (CONTINUED)', 50, 24, boldFont, rgb(0.17, 0.32, 0.51));
      currentPage.yPosition -= 20;
      
      pages.push(currentPage);
    }
    
    currentPage.addSectionHeader('ADDITIONAL INFORMATION');
    standardInsights.forEach((insight: Insight, index: number) => {
      addInsight(insight, index, 'standard');
    });
  }
  
  // Add the last page to pages array if not already added
  if (pages.indexOf(currentPage) === -1) {
    currentPage.addFooter();
    pages.push(currentPage);
  }
  
  // Add enhanced tenant recommendations page
  const recsPage = new PDFReportPage(
    pdfDoc.addPage([595, 842]),
    regularFont,
    boldFont,
    pages.length + 1,
    pages.length + 1 // Update total pages count
  );
  
  await recsPage.addHeaderLogo(pdfDoc);
  recsPage.drawText('TENANT RECOMMENDATIONS', 50, 24, boldFont, rgb(0.17, 0.32, 0.51));
  recsPage.yPosition -= 20;
  
  // Green checkmark in circle icon (as text approximation)
  const checkmarkIcon = "✓";
  
  // Recommendations section with matching styling from the Analysis Panel
  recsPage.addSectionHeader('EXPERT RECOMMENDATIONS');
  
  // Use the actual recommendations from analysis results if available
  const recommendations = analysisResults?.recommendations || [];
  
  if (recommendations.length > 0) {
    // Display each recommendation in a similar style to the UI
    recommendations.forEach((recommendation: any, index: number) => {
      // Draw recommendation box
      const boxY = recsPage.yPosition;
      const boxHeight = 70; // Estimated height for the box
      const boxWidth = recsPage.width - 100;
      
      // Draw box with light green background (like in UI)
      recsPage.page.drawRectangle({
        x: 50,
        y: boxY,
        width: boxWidth,
        height: boxHeight,
        color: rgbWithAlpha(0.2, 0.7, 0.3, 0.1),
        borderColor: rgbWithAlpha(0.2, 0.7, 0.3, 0.2),
        borderWidth: 1
      });
      
      // Draw circle using the drawCircle method
      const circleX = 70;
      const circleY = boxY - 20;
      
      // Use direct circle drawing instead of SVG path
      recsPage.page.drawCircle({
        x: circleX,
        y: circleY,
        size: 20, // Diameter = 2*radius
        color: rgbWithAlpha(0.2, 0.7, 0.3, 0.1)
      });
      
      // Draw checkmark
      recsPage.drawText(checkmarkIcon, 66, 14, boldFont, rgb(0.2, 0.7, 0.3));
      
      // Draw recommendation title and content
      recsPage.drawText(`Recommendation ${index + 1}:`, 90, 13, boldFont, rgb(0.1, 0.1, 0.1));
      recsPage.yPosition -= 20;
      
      // Draw recommendation content with text wrapping
      const contentLines = splitTextIntoLines(recommendation.content || "", 60); // Approx. chars per line
      contentLines.forEach(line => {
        recsPage.drawText(line, 90, 11, regularFont, rgb(0.3, 0.3, 0.3));
        recsPage.yPosition -= 15;
      });
      
      // Add some space between recommendations
      recsPage.yPosition -= 10;
      
      // Check if we need a new page
      if (recsPage.yPosition < 150) {
        recsPage.addFooter();
        pages.push(recsPage);
        
        // Create a new page for remaining recommendations
        // We use a new variable to avoid modifying the constant
        let nextPage = new PDFReportPage(
          pdfDoc.addPage([595, 842]),
          regularFont,
          boldFont,
          pages.length + 1,
          pages.length + 1
        );
        
        // We need to use a function for async operations
        const setupNewPage = async () => {
          await nextPage.addHeaderLogo(pdfDoc);
          nextPage.drawText('TENANT RECOMMENDATIONS (CONTINUED)', 50, 24, boldFont, rgb(0.17, 0.32, 0.51));
          nextPage.yPosition -= 20;
        };
        
        // Execute async function
        setupNewPage().then(() => {
          // We can't continue after this point in the async function
          // This loop will terminate since we've added a footer and pushed to pages
        });
        
        // Break out of the loop - we'll start a new page after this
        return;
      }
    });
  } else {
    // Generate recommendations based on insights if none are explicitly provided
    // This maintains backward compatibility with older analysis results
    if (warningInsights.length > 0) {
      recsPage.drawText('Based on our analysis, this agreement has several issues that require attention:', 50, 12, regularFont);
      recsPage.yPosition -= 25;
      
      // Draw recommendation box 1
      const boxY1 = recsPage.yPosition;
      const boxHeight = 60;
      const boxWidth = recsPage.width - 100;
      
      // Draw box with light green background
      recsPage.page.drawRectangle({
        x: 50,
        y: boxY1 - boxHeight,
        width: boxWidth,
        height: boxHeight,
        color: rgbWithAlpha(0.2, 0.7, 0.3, 0.1),
        borderColor: rgbWithAlpha(0.2, 0.7, 0.3, 0.2),
        borderWidth: 1
      });
      
      // Draw circle using the simple approach
      const circleX = 70;
      const circleY = boxY1 - 20;
      
      // Use direct circle drawing
      recsPage.page.drawCircle({
        x: circleX,
        y: circleY,
        size: 20, // Diameter = 2*radius (10)
        color: rgbWithAlpha(0.2, 0.7, 0.3, 0.1)
      });
      recsPage.drawText(checkmarkIcon, 66, 14, boldFont, rgb(0.2, 0.7, 0.3));
      recsPage.drawText('Recommendation 1:', 90, 13, boldFont, rgb(0.1, 0.1, 0.1));
      recsPage.yPosition -= 20;
      recsPage.drawText('Consider consulting with a tenancy solicitor to review this agreement.', 90, 11, regularFont, rgb(0.3, 0.3, 0.3));
      recsPage.drawText('This analysis identified legal compliance issues that may need professional advice.', 90, 11, regularFont, rgb(0.3, 0.3, 0.3));
      recsPage.yPosition -= 25;
      
      // Draw recommendation box 2
      const boxY2 = recsPage.yPosition;
      recsPage.drawRectangle(50, boxY2 - boxHeight, boxWidth, boxHeight, rgbWithAlpha(0.2, 0.7, 0.3, 0.1), 1, rgbWithAlpha(0.2, 0.7, 0.3, 0.2));
      recsPage.drawCircle(70, boxY2 - 20, 10, rgbWithAlpha(0.2, 0.7, 0.3, 0.1));
      recsPage.drawText(checkmarkIcon, 66, 14, boldFont, rgb(0.2, 0.7, 0.3));
      recsPage.drawText('Recommendation 2:', 90, 13, boldFont, rgb(0.1, 0.1, 0.1));
      recsPage.yPosition -= 20;
      recsPage.drawText('Address the serious issues highlighted in this report.', 90, 11, regularFont, rgb(0.3, 0.3, 0.3));
      recsPage.drawText('Prioritize resolving the serious issues before signing.', 90, 11, regularFont, rgb(0.3, 0.3, 0.3));
      recsPage.yPosition -= 25;
      
      // Draw recommendation box 3
      const boxY3 = recsPage.yPosition;
      recsPage.drawRectangle(50, boxY3 - boxHeight, boxWidth, boxHeight, rgbWithAlpha(0.2, 0.7, 0.3, 0.1), 1, rgbWithAlpha(0.2, 0.7, 0.3, 0.2));
      recsPage.drawCircle(70, boxY3 - 20, 10, rgbWithAlpha(0.2, 0.7, 0.3, 0.1));
      recsPage.drawText(checkmarkIcon, 66, 14, boldFont, rgb(0.2, 0.7, 0.3));
      recsPage.drawText('Recommendation 3:', 90, 13, boldFont, rgb(0.1, 0.1, 0.1));
      recsPage.yPosition -= 20;
      recsPage.drawText('Request amendments to problematic clauses.', 90, 11, regularFont, rgb(0.3, 0.3, 0.3));
      recsPage.drawText('Consider discussing the identified issues with your landlord or agent.', 90, 11, regularFont, rgb(0.3, 0.3, 0.3));
    } else if (accentInsights.length > 0) {
      recsPage.drawText('Based on our analysis, this agreement is generally compliant but has some areas for improvement:', 50, 12, regularFont);
      recsPage.yPosition -= 25;
      
      // Draw recommendation box 1
      const boxY1 = recsPage.yPosition;
      const boxHeight = 60;
      const boxWidth = recsPage.width - 100;
      recsPage.drawRectangle(50, boxY1 - boxHeight, boxWidth, boxHeight, rgbWithAlpha(0.2, 0.7, 0.3, 0.1), 1, rgbWithAlpha(0.2, 0.7, 0.3, 0.2));
      recsPage.drawCircle(70, boxY1 - 20, 10, rgbWithAlpha(0.2, 0.7, 0.3, 0.1));
      recsPage.drawText(checkmarkIcon, 66, 14, boldFont, rgb(0.2, 0.7, 0.3));
      recsPage.drawText('Recommendation 1:', 90, 13, boldFont, rgb(0.1, 0.1, 0.1));
      recsPage.yPosition -= 20;
      recsPage.drawText('Consider negotiating improvements to unfavorable terms.', 90, 11, regularFont, rgb(0.3, 0.3, 0.3));
      recsPage.drawText('The potential concerns identified may be negotiable with your landlord.', 90, 11, regularFont, rgb(0.3, 0.3, 0.3));
      recsPage.yPosition -= 25;
      
      // Draw recommendation box 2
      const boxY2 = recsPage.yPosition;
      recsPage.drawRectangle(50, boxY2 - boxHeight, boxWidth, boxHeight, rgbWithAlpha(0.2, 0.7, 0.3, 0.1), 1, rgbWithAlpha(0.2, 0.7, 0.3, 0.2));
      recsPage.drawCircle(70, boxY2 - 20, 10, rgbWithAlpha(0.2, 0.7, 0.3, 0.1));
      recsPage.drawText(checkmarkIcon, 66, 14, boldFont, rgb(0.2, 0.7, 0.3));
      recsPage.drawText('Recommendation 2:', 90, 13, boldFont, rgb(0.1, 0.1, 0.1));
      recsPage.yPosition -= 20;
      recsPage.drawText('Ensure you fully understand all terms before signing.', 90, 11, regularFont, rgb(0.3, 0.3, 0.3));
      recsPage.drawText('Review all terms carefully before signing.', 90, 11, regularFont, rgb(0.3, 0.3, 0.3));
    } else {
      recsPage.drawText('Based on our analysis, this agreement appears to be fair and legally compliant:', 50, 12, regularFont, rgb(0.2, 0.7, 0.3));
      recsPage.yPosition -= 25;
      
      // Draw recommendation box 1
      const boxY1 = recsPage.yPosition;
      const boxHeight = 60;
      const boxWidth = recsPage.width - 100;
      recsPage.drawRectangle(50, boxY1 - boxHeight, boxWidth, boxHeight, rgbWithAlpha(0.2, 0.7, 0.3, 0.1), 1, rgbWithAlpha(0.2, 0.7, 0.3, 0.2));
      recsPage.drawCircle(70, boxY1 - 20, 10, rgbWithAlpha(0.2, 0.7, 0.3, 0.1));
      recsPage.drawText(checkmarkIcon, 66, 14, boldFont, rgb(0.2, 0.7, 0.3));
      recsPage.drawText('Recommendation 1:', 90, 13, boldFont, rgb(0.1, 0.1, 0.1));
      recsPage.yPosition -= 20;
      recsPage.drawText('Proceed with confidence.', 90, 11, regularFont, rgb(0.3, 0.3, 0.3));
      recsPage.drawText('Our analysis did not identify any significant issues with this agreement.', 90, 11, regularFont, rgb(0.3, 0.3, 0.3));
      recsPage.yPosition -= 25;
      
      // Draw recommendation box 2
      const boxY2 = recsPage.yPosition;
      recsPage.drawRectangle(50, boxY2 - boxHeight, boxWidth, boxHeight, rgbWithAlpha(0.2, 0.7, 0.3, 0.1), 1, rgbWithAlpha(0.2, 0.7, 0.3, 0.2));
      recsPage.drawCircle(70, boxY2 - 20, 10, rgbWithAlpha(0.2, 0.7, 0.3, 0.1));
      recsPage.drawText(checkmarkIcon, 66, 14, boldFont, rgb(0.2, 0.7, 0.3));
      recsPage.drawText('Recommendation 2:', 90, 13, boldFont, rgb(0.1, 0.1, 0.1));
      recsPage.yPosition -= 20;
      recsPage.drawText('Keep a copy for your records.', 90, 11, regularFont, rgb(0.3, 0.3, 0.3));
      recsPage.drawText('Always maintain good documentation of your tenancy agreements.', 90, 11, regularFont, rgb(0.3, 0.3, 0.3));
    }
  }
  
  recsPage.yPosition -= 40;
  
  // Legal Disclaimer section
  recsPage.addSectionHeader('LEGAL DISCLAIMER');
  recsPage.drawText(legalDisclaimerText, 50, 11, regularFont, rgb(0.5, 0.5, 0.5), recsPage.width - 100);
  
  // Add footer
  recsPage.addFooter();
  pages.push(recsPage);
  
  // Update all page numbers with correct total
  const actualTotalPages = pages.length;
  pages.forEach((page, index) => {
    page.totalPages = actualTotalPages;
    page.addFooter(); // Re-add footer with updated page count
  });
  
  // Finish and return the PDF
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}