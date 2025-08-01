import { PDFDocument, PDFPage, rgb, StandardFonts, PDFFont, Color } from 'pdf-lib';
import { Document, Analysis } from "@shared/schema";

type RGB = ReturnType<typeof rgb>;

// Helper function for RGB with alpha (transparency not supported directly by pdf-lib)
// Just using rgb for simplicity, ignoring the alpha value
function rgbWithAlpha(r: number, g: number, b: number, _alpha: number): RGB {
  return rgb(r, g, b);
}

function sanitizeText(text: string | null | undefined): string {
  return text ? text.replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim() : 'Not specified';
}

function splitTextIntoLines(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const lines: string[] = [];
  const words = text.split(' ');
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const width = font.widthOfTextAtSize(currentLine + ' ' + word, fontSize);
    
    if (width > maxWidth) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += (currentLine ? ' ' : '') + word;
    }
  }
  
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }
  
  return lines;
}

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

class PDFReportPage {
  page: PDFPage;
  width: number;
  height: number;
  yPosition: number;
  pageNumber: number;
  totalPages: number;
  
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
    this.regularFont = regularFont;
    this.boldFont = boldFont;
    this.width = page.getWidth();
    this.height = page.getHeight();
    this.yPosition = this.height - 100; // Initial position below top margin
    this.pageNumber = pageNumber;
    this.totalPages = totalPages;
  }
  
  drawText(text: string | null | undefined, fontSize: number, 
           font: PDFFont = this.regularFont, color = this.primaryColor, maxWidth?: number): void {
    const content = sanitizeText(text);
    
    if (maxWidth) {
      const lines = splitTextIntoLines(content, font, fontSize, maxWidth);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        this.page.drawText(line, {
          x: 50, 
          y: this.yPosition,
          size: fontSize,
          font: font,
          color: color
        });
        this.yPosition -= fontSize + 4; // Add spacing between lines
      }
    } else {
      // Single line
      this.page.drawText(content, {
        x: 50, 
        y: this.yPosition,
        size: fontSize,
        font: font,
        color: color
      });
      this.yPosition -= fontSize + 4; // Add spacing after text
    }
  }
  
  addSectionHeader(title: string): void {
    // Add horizontal line
    this.page.drawLine({
      start: { x: 50, y: this.yPosition },
      end: { x: this.width - 50, y: this.yPosition },
      thickness: 1,
      color: this.grayColor
    });
    
    this.yPosition -= 20;
    
    // Add section title
    this.page.drawText(title, {
      x: 50,
      y: this.yPosition,
      size: 14,
      font: this.boldFont,
      color: this.primaryColor
    });
    
    this.yPosition -= 20;
  }
  
  async addHeaderLogo(pdfDoc: PDFDocument): Promise<void> {
    // Add "RentRight AI" text as logo
    this.page.drawText('RentRight AI', {
      x: 50,
      y: this.height - 50,
      size: 24,
      font: this.boldFont,
      color: this.primaryColor
    });
    
    this.page.drawText('AI-Powered Tenancy Agreement Analysis', {
      x: 50,
      y: this.height - 70,
      size: 12,
      font: this.regularFont,
      color: this.secondaryColor
    });
  }
  
  addFooter(): void {
    const footerText = `Page ${this.pageNumber} of ${this.totalPages} | RentRight AI Analysis Report | ${new Date().toLocaleDateString()}`;
    
    this.page.drawText(footerText, {
      x: this.width / 2 - this.regularFont.widthOfTextAtSize(footerText, 8) / 2,
      y: 30,
      size: 8,
      font: this.regularFont,
      color: this.grayColor
    });
  }
  
  needsNewPage(requiredHeight: number): boolean {
    // Check if there's enough space for content + footer margin
    return this.yPosition - requiredHeight < 50;
  }
}

// Legal disclaimer text for the bottom of reports
const legalDisclaimerText = 
  "DISCLAIMER: This analysis is generated using artificial intelligence and is provided for informational purposes only. " +
  "It does not constitute legal advice. The analysis may not be comprehensive or fully accurate in all circumstances. " +
  "You should consult with a qualified legal professional before making any decisions based on this report. " +
  "RentRight AI does not guarantee the accuracy or completeness of this report and accepts no liability for decisions made based on its contents.";

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
  
  coverPage.page.drawText('TENANCY AGREEMENT ANALYSIS', {
    x: 50,
    y: coverPage.yPosition,
    size: 36,
    font: boldFont,
    color: rgb(0.17, 0.32, 0.51)
  });
  
  coverPage.yPosition -= 40;
  
  coverPage.page.drawText('COMPREHENSIVE REPORT', {
    x: 50,
    y: coverPage.yPosition,
    size: 28,
    font: regularFont,
    color: rgb(0.38, 0.64, 0.88)
  });
  
  coverPage.yPosition -= 40;
  
  // Add document details
  coverPage.yPosition -= 30;
  
  coverPage.page.drawText(`Document: ${document.filename}`, {
    x: 50,
    y: coverPage.yPosition,
    size: 14,
    font: regularFont
  });
  
  coverPage.yPosition -= 20;
  
  coverPage.page.drawText(`Analysis Date: ${new Date(analysis.completedAt || Date.now()).toLocaleDateString()}`, {
    x: 50,
    y: coverPage.yPosition,
    size: 14,
    font: regularFont
  });
  
  // Add compliance score in large format on cover with traffic light indicator
  coverPage.yPosition -= 60;
  
  // Draw traffic light indicator
  const trafficLightX = coverPage.width - 150;
  const trafficLightY = coverPage.yPosition - 20;
  const indicatorRadius = 20;
  const indicatorSpacing = 50;
  
  // Draw traffic light housing
  const housingX = trafficLightX - 30;
  const housingY = trafficLightY - 80;
  const housingWidth = 60;
  const housingHeight = 160;
  
  // Use simple rectangle instead of complex SVG path
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
  const redColor = complianceLevel === 'low' ? rgb(0.9, 0.2, 0.2) : rgb(0.4, 0.2, 0.2);
  coverPage.page.drawCircle({
    x: trafficLightX,
    y: trafficLightY,
    size: indicatorRadius * 2,
    color: redColor,
    borderColor: rgb(0.1, 0.1, 0.1),
    borderWidth: 1
  });
  
  // Draw amber/yellow light (always grayed out unless it's the active level)
  const amberColor = complianceLevel === 'medium' ? rgb(0.95, 0.7, 0.1) : rgb(0.4, 0.3, 0.1);
  coverPage.page.drawCircle({
    x: trafficLightX,
    y: trafficLightY - indicatorSpacing,
    size: indicatorRadius * 2,
    color: amberColor,
    borderColor: rgb(0.1, 0.1, 0.1),
    borderWidth: 1
  });
  
  // Draw green light (always grayed out unless it's the active level)
  const greenColor = complianceLevel === 'high' ? rgb(0.2, 0.7, 0.3) : rgb(0.2, 0.4, 0.2);
  coverPage.page.drawCircle({
    x: trafficLightX,
    y: trafficLightY - (indicatorSpacing * 2),
    size: indicatorRadius * 2,
    color: greenColor,
    borderColor: rgb(0.1, 0.1, 0.1),
    borderWidth: 1
  });
  
  // Draw compliance text
  coverPage.page.drawText(`Compliance Score: ${complianceScore}%`, {
    x: 50,
    y: coverPage.yPosition,
    size: 24,
    font: boldFont,
    color: scoreColor
  });
  
  coverPage.yPosition -= 30;
  
  coverPage.page.drawText(`Assessment: ${scoreLabel}`, {
    x: 50,
    y: coverPage.yPosition,
    size: 18,
    font: regularFont,
    color: scoreColor
  });
  
  // Short disclaimer at bottom of cover
  coverPage.yPosition = 120;
  
  coverPage.page.drawText("This analysis is AI-generated and does not constitute legal advice.", {
    x: 50,
    y: coverPage.yPosition,
    size: 10,
    font: regularFont,
    color: rgb(0.8, 0.2, 0.2)
  });
  
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
  
  summaryPage.page.drawText('ANALYSIS SUMMARY', {
    x: 50,
    y: summaryPage.yPosition,
    size: 24,
    font: boldFont,
    color: rgb(0.17, 0.32, 0.51)
  });
  
  summaryPage.yPosition -= 30;
  
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
  
  summaryPage.page.drawText(`Assessment: ${scoreLabel}`, {
    x: 70,
    y: summaryPage.yPosition,
    size: 14,
    font: regularFont,
    color: scoreColor
  });
  
  summaryPage.yPosition -= 30;
  
  // Key Issues Section
  summaryPage.addSectionHeader('KEY ISSUES IDENTIFIED');
  
  if (warningInsights && warningInsights.length > 0) {
    summaryPage.page.drawText(`Found ${warningInsights.length} potential legal or compliance issues:`, {
      x: 70,
      y: summaryPage.yPosition,
      size: 12,
      font: regularFont
    });
    
    summaryPage.yPosition -= 15;
    
    // Show summary of issues
    for (let i = 0; i < Math.min(warningInsights.length, 5); i++) {
      const insight = warningInsights[i];
      const bulletPoint = `• ${insight.title || 'Issue not specified'}`;
      
      summaryPage.page.drawText(bulletPoint, {
        x: 70,
        y: summaryPage.yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0.8, 0.2, 0.2)
      });
      
      summaryPage.yPosition -= 15;
    }
    
    if (warningInsights.length > 5) {
      summaryPage.page.drawText(`• Plus ${warningInsights.length - 5} more issues detailed in following pages`, {
        x: 70,
        y: summaryPage.yPosition,
        size: 12,
        font: regularFont
      });
      
      summaryPage.yPosition -= 15;
    }
  } else if (accentInsights.length > 0) {
    summaryPage.page.drawText('No serious issues identified, but some improvements suggested:', {
      x: 70,
      y: summaryPage.yPosition,
      size: 12,
      font: regularFont,
      color: rgb(0.95, 0.7, 0.1)
    });
    
    summaryPage.yPosition -= 15;
    
    // Display accent insights
    for (let i = 0; i < Math.min(accentInsights.length, 3); i++) {
      const insight = accentInsights[i];
      const bulletPoint = `• ${insight.title || 'Suggestion'}`;
      
      summaryPage.page.drawText(bulletPoint, {
        x: 70,
        y: summaryPage.yPosition,
        size: 12,
        font: regularFont,
        color: rgb(0.95, 0.7, 0.1)
      });
      
      summaryPage.yPosition -= 15;
    }
  } else {
    summaryPage.page.drawText('No specific issues identified. This agreement appears to be fair and compliant.', {
      x: 70,
      y: summaryPage.yPosition,
      size: 12,
      font: regularFont,
      color: rgb(0.2, 0.7, 0.3)
    });
    
    summaryPage.yPosition -= 15;
  }
  
  summaryPage.yPosition -= 20;
  
  // Property Details Section
  summaryPage.addSectionHeader('PROPERTY & FINANCIAL DETAILS');
  
  // Extract property details
  const propertyDetails = analysisResults?.propertyDetails || 
                        analysisResults?.property ||
                        {};
  
  // Address
  summaryPage.page.drawText('Property Address:', {
    x: 70,
    y: summaryPage.yPosition,
    size: 12,
    font: boldFont
  });
  
  summaryPage.page.drawText(propertyDetails.address || 'Not specified', {
    x: 200,
    y: summaryPage.yPosition,
    size: 12,
    font: regularFont
  });
  
  summaryPage.yPosition -= 15;
  
  // Rent
  summaryPage.page.drawText('Monthly Rent:', {
    x: 70,
    y: summaryPage.yPosition,
    size: 12,
    font: boldFont
  });
  
  summaryPage.page.drawText(propertyDetails.rent || propertyDetails.monthlyRent || 'Not specified', {
    x: 200,
    y: summaryPage.yPosition,
    size: 12,
    font: regularFont
  });
  
  summaryPage.yPosition -= 15;
  
  // Deposit
  summaryPage.page.drawText('Security Deposit:', {
    x: 70,
    y: summaryPage.yPosition,
    size: 12,
    font: boldFont
  });
  
  summaryPage.page.drawText(propertyDetails.deposit || propertyDetails.securityDeposit || 'Not specified', {
    x: 200,
    y: summaryPage.yPosition,
    size: 12,
    font: regularFont
  });
  
  summaryPage.yPosition -= 25;
  
  // Tenancy Period Section
  summaryPage.addSectionHeader('TENANCY PERIOD & PARTIES');
  
  // Extract tenancy period details
  const leasePeriod = analysisResults?.tenancyPeriod || analysisResults?.leasePeriod || 
                    analysisResults?.tenancyPeriod ||
                    {};
  
  // Start Date
  summaryPage.page.drawText('Start Date:', {
    x: 70,
    y: summaryPage.yPosition,
    size: 12,
    font: boldFont
  });
  
  summaryPage.page.drawText(leasePeriod.startDate || 'Not specified', {
    x: 200,
    y: summaryPage.yPosition,
    size: 12,
    font: regularFont
  });
  
  summaryPage.yPosition -= 15;
  
  // End Date
  summaryPage.page.drawText('End Date:', {
    x: 70,
    y: summaryPage.yPosition,
    size: 12,
    font: boldFont
  });
  
  summaryPage.page.drawText(leasePeriod.endDate || 'Not specified', {
    x: 200,
    y: summaryPage.yPosition,
    size: 12,
    font: regularFont
  });
  
  summaryPage.yPosition -= 15;
  
  // Tenancy Type
  summaryPage.page.drawText('Tenancy Type:', {
    x: 70,
    y: summaryPage.yPosition,
    size: 12,
    font: boldFont
  });
  
  summaryPage.page.drawText(leasePeriod.tenancyType || 'Not specified', {
    x: 200,
    y: summaryPage.yPosition,
    size: 12,
    font: regularFont
  });
  
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
  
  currentPage.page.drawText('DETAILED ANALYSIS', {
    x: 50,
    y: currentPage.yPosition,
    size: 24,
    font: boldFont,
    color: rgb(0.17, 0.32, 0.51)
  });
  
  currentPage.yPosition -= 30;
  
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
      currentPage.page.drawText('DETAILED ANALYSIS (CONTINUED)', {
        x: 50,
        y: currentPage.yPosition,
        size: 24,
        font: boldFont,
        color: rgb(0.17, 0.32, 0.51)
      });
      
      currentPage.yPosition -= 30;
      
      pages.push(currentPage);
    }
    
    // Title with section number
    let titleColor = rgb(0.17, 0.32, 0.51);
    if (type === 'warning') {
      titleColor = rgb(0.8, 0.2, 0.2);
    } else if (type === 'accent') {
      titleColor = rgb(0.95, 0.7, 0.1);
    }
    
    currentPage.page.drawText(`${sectionCounter}. ${insight.title || 'Unnamed Issue'}`, {
      x: 50,
      y: currentPage.yPosition,
      size: 16,
      font: boldFont,
      color: titleColor
    });
    
    sectionCounter++;
    currentPage.yPosition -= 20;
    
    // Type indicator
    let typeText = '';
    let typeColor = rgb(0.5, 0.5, 0.5);
    
    if (type === 'warning') {
      typeText = 'SERIOUS ISSUE - May indicate non-compliance with UK law';
      typeColor = rgb(0.8, 0.2, 0.2);
    } else if (type === 'accent') {
      typeText = 'CONCERN - May be unfavorable to tenant but legally compliant';
      typeColor = rgb(0.95, 0.7, 0.1);
    } else {
      typeText = 'INFORMATION - Contextual details about agreement';
    }
    
    currentPage.page.drawText(typeText, {
      x: 70,
      y: currentPage.yPosition,
      size: 10,
      font: boldFont,
      color: typeColor
    });
    
    currentPage.yPosition -= 20;
    
    // Full content
    const contentLines = splitTextIntoLines(insight.content || 'No details provided', 70);
    for (const line of contentLines) {
      currentPage.page.drawText(line, {
        x: 70,
        y: currentPage.yPosition,
        size: 11,
        font: regularFont,
        color: rgb(0, 0, 0)
      });
      
      currentPage.yPosition -= 15;
    }
    
    // Add the relevant indicators if available
    if (insight.indicators && insight.indicators.length > 0) {
      currentPage.yPosition -= 5;
      const references = `Reference clauses: ${insight.indicators.join(', ')}`;
      
      currentPage.page.drawText(references, {
        x: 70,
        y: currentPage.yPosition,
        size: 10,
        font: regularFont,
        color: rgb(0.5, 0.5, 0.5)
      });
      
      currentPage.yPosition -= 15;
    }
    
    currentPage.yPosition -= 15; // Extra space after each insight
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
      currentPage.page.drawText('DETAILED ANALYSIS (CONTINUED)', {
        x: 50,
        y: currentPage.yPosition,
        size: 24,
        font: boldFont,
        color: rgb(0.17, 0.32, 0.51)
      });
      
      currentPage.yPosition -= 30;
      
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
      currentPage.page.drawText('DETAILED ANALYSIS (CONTINUED)', {
        x: 50,
        y: currentPage.yPosition,
        size: 24,
        font: boldFont,
        color: rgb(0.17, 0.32, 0.51)
      });
      
      currentPage.yPosition -= 30;
      
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
  
  recsPage.page.drawText('TENANT RECOMMENDATIONS', {
    x: 50,
    y: recsPage.yPosition,
    size: 24,
    font: boldFont,
    color: rgb(0.17, 0.32, 0.51)
  });
  
  recsPage.yPosition -= 30;
  
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
        y: boxY - boxHeight,
        width: boxWidth,
        height: boxHeight,
        color: rgbWithAlpha(0.2, 0.7, 0.3, 0.1),
        borderColor: rgbWithAlpha(0.2, 0.7, 0.3, 0.2),
        borderWidth: 1
      });
      
      // Draw circle for checkmark
      recsPage.page.drawCircle({
        x: 70,
        y: boxY - 20,
        size: 20, // diameter
        color: rgbWithAlpha(0.2, 0.7, 0.3, 0.1)
      });
      
      // Draw checkmark
      recsPage.page.drawText(checkmarkIcon, {
        x: 66,
        y: boxY - 24,
        size: 14,
        font: boldFont,
        color: rgb(0.2, 0.7, 0.3)
      });
      
      // Draw recommendation title
      recsPage.page.drawText(`Recommendation ${index + 1}:`, {
        x: 90,
        y: boxY - 20,
        size: 13,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1)
      });
      
      // Draw recommendation content with text wrapping
      const contentLines = splitTextIntoLines(recommendation.content || "", 60);
      let currentY = boxY - 40;
      contentLines.forEach(line => {
        recsPage.page.drawText(line, {
          x: 90,
          y: currentY,
          size: 11,
          font: regularFont,
          color: rgb(0.3, 0.3, 0.3)
        });
        currentY -= 15;
      });
      
      // Add some space between recommendations
      recsPage.yPosition = boxY - boxHeight - 20;
      
      // Check if we need a new page
      if (recsPage.yPosition < 150) {
        recsPage.addFooter();
        pages.push(recsPage);
        
        // Create a new page for remaining recommendations
        let newRecsPage = new PDFReportPage(
          pdfDoc.addPage([595, 842]),
          regularFont,
          boldFont,
          pages.length + 1,
          pages.length + 1
        );
        
        // Use the new page and add it to the pages array
        pages.push(newRecsPage);
        
        // Add header
        recsPage.page.drawText('TENANT RECOMMENDATIONS (CONTINUED)', {
          x: 50,
          y: recsPage.yPosition,
          size: 24,
          font: boldFont,
          color: rgb(0.17, 0.32, 0.51)
        });
        
        recsPage.yPosition -= 30;
        recsPage.addSectionHeader('EXPERT RECOMMENDATIONS (CONTINUED)');
      }
    });
  } else {
    // Generate recommendations based on insights if none are explicitly provided
    if (warningInsights.length > 0) {
      recsPage.page.drawText('Based on our analysis, this agreement has several issues that require attention:', {
        x: 50,
        y: recsPage.yPosition,
        size: 12,
        font: regularFont
      });
      
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
      
      // Draw circle
      recsPage.page.drawCircle({
        x: 70,
        y: boxY1 - 20,
        size: 20, // diameter
        color: rgbWithAlpha(0.2, 0.7, 0.3, 0.1)
      });
      
      // Checkmark
      recsPage.page.drawText(checkmarkIcon, {
        x: 66,
        y: boxY1 - 24,
        size: 14,
        font: boldFont,
        color: rgb(0.2, 0.7, 0.3)
      });
      
      // Title
      recsPage.page.drawText('Recommendation 1:', {
        x: 90,
        y: boxY1 - 20,
        size: 13,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1)
      });
      
      // Content
      recsPage.page.drawText('Consider consulting with a tenancy solicitor to review this agreement.', {
        x: 90,
        y: boxY1 - 40,
        size: 11,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      });
      
      recsPage.page.drawText('This analysis identified legal compliance issues that may need professional advice.', {
        x: 90,
        y: boxY1 - 55,
        size: 11,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      });
      
      recsPage.yPosition = boxY1 - boxHeight - 20;
      
      // Draw recommendation box 2
      const boxY2 = recsPage.yPosition;
      
      recsPage.page.drawRectangle({
        x: 50,
        y: boxY2 - boxHeight,
        width: boxWidth,
        height: boxHeight,
        color: rgbWithAlpha(0.2, 0.7, 0.3, 0.1),
        borderColor: rgbWithAlpha(0.2, 0.7, 0.3, 0.2),
        borderWidth: 1
      });
      
      recsPage.page.drawCircle({
        x: 70,
        y: boxY2 - 20,
        size: 20, // diameter
        color: rgbWithAlpha(0.2, 0.7, 0.3, 0.1)
      });
      
      recsPage.page.drawText(checkmarkIcon, {
        x: 66,
        y: boxY2 - 24,
        size: 14,
        font: boldFont,
        color: rgb(0.2, 0.7, 0.3)
      });
      
      recsPage.page.drawText('Recommendation 2:', {
        x: 90,
        y: boxY2 - 20,
        size: 13,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1)
      });
      
      recsPage.page.drawText('Address the serious issues highlighted in this report.', {
        x: 90,
        y: boxY2 - 40,
        size: 11,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      });
      
      recsPage.page.drawText('Prioritize resolving the serious issues before signing.', {
        x: 90,
        y: boxY2 - 55,
        size: 11,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      });
      
      recsPage.yPosition = boxY2 - boxHeight - 20;
      
      // Draw recommendation box 3
      const boxY3 = recsPage.yPosition;
      
      recsPage.page.drawRectangle({
        x: 50,
        y: boxY3 - boxHeight,
        width: boxWidth,
        height: boxHeight,
        color: rgbWithAlpha(0.2, 0.7, 0.3, 0.1),
        borderColor: rgbWithAlpha(0.2, 0.7, 0.3, 0.2),
        borderWidth: 1
      });
      
      recsPage.page.drawCircle({
        x: 70,
        y: boxY3 - 20,
        size: 20, // diameter
        color: rgbWithAlpha(0.2, 0.7, 0.3, 0.1)
      });
      
      recsPage.page.drawText(checkmarkIcon, {
        x: 66,
        y: boxY3 - 24,
        size: 14,
        font: boldFont,
        color: rgb(0.2, 0.7, 0.3)
      });
      
      recsPage.page.drawText('Recommendation 3:', {
        x: 90,
        y: boxY3 - 20,
        size: 13,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1)
      });
      
      recsPage.page.drawText('Request amendments to problematic clauses.', {
        x: 90,
        y: boxY3 - 40,
        size: 11,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      });
      
      recsPage.page.drawText('Consider discussing the identified issues with your landlord or agent.', {
        x: 90,
        y: boxY3 - 55,
        size: 11,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      });
      
      recsPage.yPosition = boxY3 - boxHeight - 20;
      
    } else if (accentInsights.length > 0) {
      recsPage.page.drawText('Based on our analysis, this agreement is generally compliant but has some areas for improvement:', {
        x: 50,
        y: recsPage.yPosition,
        size: 12,
        font: regularFont
      });
      
      recsPage.yPosition -= 25;
      
      // Draw recommendation box 1
      const boxY1 = recsPage.yPosition;
      const boxHeight = 60;
      const boxWidth = recsPage.width - 100;
      
      recsPage.page.drawRectangle({
        x: 50,
        y: boxY1 - boxHeight,
        width: boxWidth,
        height: boxHeight,
        color: rgbWithAlpha(0.2, 0.7, 0.3, 0.1),
        borderColor: rgbWithAlpha(0.2, 0.7, 0.3, 0.2),
        borderWidth: 1
      });
      
      recsPage.page.drawCircle({
        x: 70,
        y: boxY1 - 20,
        size: 20, // diameter
        color: rgbWithAlpha(0.2, 0.7, 0.3, 0.1)
      });
      
      recsPage.page.drawText(checkmarkIcon, {
        x: 66,
        y: boxY1 - 24,
        size: 14,
        font: boldFont,
        color: rgb(0.2, 0.7, 0.3)
      });
      
      recsPage.page.drawText('Recommendation 1:', {
        x: 90,
        y: boxY1 - 20,
        size: 13,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1)
      });
      
      recsPage.page.drawText('Consider negotiating improvements to unfavorable terms.', {
        x: 90,
        y: boxY1 - 40,
        size: 11,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      });
      
      recsPage.page.drawText('The potential concerns identified may be negotiable with your landlord.', {
        x: 90,
        y: boxY1 - 55,
        size: 11,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      });
      
      recsPage.yPosition = boxY1 - boxHeight - 20;
      
      // Draw recommendation box 2
      const boxY2 = recsPage.yPosition;
      
      recsPage.page.drawRectangle({
        x: 50,
        y: boxY2 - boxHeight,
        width: boxWidth,
        height: boxHeight,
        color: rgbWithAlpha(0.2, 0.7, 0.3, 0.1),
        borderColor: rgbWithAlpha(0.2, 0.7, 0.3, 0.2),
        borderWidth: 1
      });
      
      recsPage.page.drawCircle({
        x: 70,
        y: boxY2 - 20,
        size: 20, // diameter
        color: rgbWithAlpha(0.2, 0.7, 0.3, 0.1)
      });
      
      recsPage.page.drawText(checkmarkIcon, {
        x: 66,
        y: boxY2 - 24,
        size: 14,
        font: boldFont,
        color: rgb(0.2, 0.7, 0.3)
      });
      
      recsPage.page.drawText('Recommendation 2:', {
        x: 90,
        y: boxY2 - 20,
        size: 13,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1)
      });
      
      recsPage.page.drawText('Ensure you fully understand all terms before signing.', {
        x: 90,
        y: boxY2 - 40,
        size: 11,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      });
      
      recsPage.page.drawText('Review all terms carefully before signing.', {
        x: 90,
        y: boxY2 - 55,
        size: 11,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      });
      
      recsPage.yPosition = boxY2 - boxHeight - 20;
      
    } else {
      recsPage.page.drawText('Based on our analysis, this agreement appears to be fair and legally compliant:', {
        x: 50,
        y: recsPage.yPosition,
        size: 12,
        font: regularFont,
        color: rgb(0.2, 0.7, 0.3)
      });
      
      recsPage.yPosition -= 25;
      
      // Draw recommendation box 1
      const boxY1 = recsPage.yPosition;
      const boxHeight = 60;
      const boxWidth = recsPage.width - 100;
      
      recsPage.page.drawRectangle({
        x: 50,
        y: boxY1 - boxHeight,
        width: boxWidth,
        height: boxHeight,
        color: rgbWithAlpha(0.2, 0.7, 0.3, 0.1),
        borderColor: rgbWithAlpha(0.2, 0.7, 0.3, 0.2),
        borderWidth: 1
      });
      
      recsPage.page.drawCircle({
        x: 70,
        y: boxY1 - 20,
        size: 20, // diameter
        color: rgbWithAlpha(0.2, 0.7, 0.3, 0.1)
      });
      
      recsPage.page.drawText(checkmarkIcon, {
        x: 66,
        y: boxY1 - 24,
        size: 14,
        font: boldFont,
        color: rgb(0.2, 0.7, 0.3)
      });
      
      recsPage.page.drawText('Recommendation 1:', {
        x: 90,
        y: boxY1 - 20,
        size: 13,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1)
      });
      
      recsPage.page.drawText('Proceed with confidence.', {
        x: 90,
        y: boxY1 - 40,
        size: 11,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      });
      
      recsPage.page.drawText('Our analysis did not identify any significant issues with this agreement.', {
        x: 90,
        y: boxY1 - 55,
        size: 11,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      });
      
      recsPage.yPosition = boxY1 - boxHeight - 20;
      
      // Draw recommendation box 2
      const boxY2 = recsPage.yPosition;
      
      recsPage.page.drawRectangle({
        x: 50,
        y: boxY2 - boxHeight,
        width: boxWidth,
        height: boxHeight,
        color: rgbWithAlpha(0.2, 0.7, 0.3, 0.1),
        borderColor: rgbWithAlpha(0.2, 0.7, 0.3, 0.2),
        borderWidth: 1
      });
      
      recsPage.page.drawCircle({
        x: 70,
        y: boxY2 - 20,
        size: 20, // diameter
        color: rgbWithAlpha(0.2, 0.7, 0.3, 0.1)
      });
      
      recsPage.page.drawText(checkmarkIcon, {
        x: 66,
        y: boxY2 - 24,
        size: 14,
        font: boldFont,
        color: rgb(0.2, 0.7, 0.3)
      });
      
      recsPage.page.drawText('Recommendation 2:', {
        x: 90,
        y: boxY2 - 20,
        size: 13,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1)
      });
      
      recsPage.page.drawText('Keep a copy for your records.', {
        x: 90,
        y: boxY2 - 40,
        size: 11,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      });
      
      recsPage.page.drawText('Always maintain good documentation of your tenancy agreements.', {
        x: 90,
        y: boxY2 - 55,
        size: 11,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      });
      
      recsPage.yPosition = boxY2 - boxHeight - 20;
    }
  }
  
  recsPage.yPosition -= 20;
  
  // Legal Disclaimer section
  recsPage.addSectionHeader('LEGAL DISCLAIMER');
  
  const disclaimerLines = splitTextIntoLines(legalDisclaimerText, 80);
  
  for (const line of disclaimerLines) {
    recsPage.page.drawText(line, {
      x: 50,
      y: recsPage.yPosition,
      size: 11,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    recsPage.yPosition -= 15;
  }
  
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