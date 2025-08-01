import { AnalysisPerformanceMonitor } from './enhanced-analysis';
import { analysisCache } from './intelligent-cache';
import { UKRegion } from './uk-tenancy-laws';

/**
 * Performance Dashboard for RentRight-AI
 * 
 * Provides comprehensive performance analytics and monitoring
 * for the AI analysis system including:
 * - Response time metrics
 * - Token usage analytics  
 * - Cache performance
 * - Regional analysis patterns
 * - Cost optimization insights
 */

export interface PerformanceDashboardData {
  overview: {
    totalAnalyses: number;
    averageResponseTime: number;
    averageTokenUsage: number;
    cacheHitRate: number;
    costSavings: number;
  };
  performance: {
    responseTimeBreakdown: {
      fast: number; // < 10s
      medium: number; // 10-30s
      slow: number; // > 30s
    };
    tokenEfficiency: {
      averagePromptTokens: number;
      averageResponseTokens: number;
      totalTokensUsed: number;
      estimatedCost: number;
    };
    regionalPerformance: {
      [key in UKRegion]: {
        count: number;
        avgResponseTime: number;
        avgTokens: number;
      };
    };
  };
  cache: {
    totalEntries: number;
    hitRate: number;
    memoryUsage: number;
    regionBreakdown: { [key in UKRegion]: number };
    documentTypeBreakdown: { [key: string]: number };
  };
  trends: {
    hourlyAnalyses: number[];
    dailyTokenUsage: number[];
    weeklyResponseTimes: number[];
  };
  optimization: {
    recommendations: string[];
    potentialSavings: {
      tokenReduction: number;
      timeReduction: number;
      costReduction: number;
    };
  };
}

export class PerformanceDashboard {
  private static performanceHistory: Array<{
    timestamp: number;
    responseTime: number;
    tokenUsage: number;
    region: UKRegion;
    cached: boolean;
  }> = [];
  
  private static readonly MAX_HISTORY_SIZE = 10000;
  
  /**
   * Records a performance event
   */
  static recordPerformanceEvent(
    responseTime: number,
    tokenUsage: number,
    region: UKRegion,
    cached: boolean = false
  ): void {
    this.performanceHistory.push({
      timestamp: Date.now(),
      responseTime,
      tokenUsage,
      region,
      cached
    });
    
    // Keep history size manageable
    if (this.performanceHistory.length > this.MAX_HISTORY_SIZE) {
      this.performanceHistory = this.performanceHistory.slice(-this.MAX_HISTORY_SIZE);
    }
  }
  
  /**
   * Generates comprehensive dashboard data
   */
  static generateDashboardData(): PerformanceDashboardData {
    const analysisPerformance = AnalysisPerformanceMonitor.getPerformanceReport();
    const cacheStats = analysisCache.getStats();
    
    // Calculate overview metrics
    const overview = this.calculateOverviewMetrics(analysisPerformance, cacheStats);
    
    // Generate performance breakdown
    const performance = this.calculatePerformanceBreakdown(analysisPerformance);
    
    // Get trends data
    const trends = this.calculateTrends();
    
    // Generate optimization recommendations
    const optimization = this.generateOptimizationRecommendations(
      analysisPerformance, 
      cacheStats
    );
    
    return {
      overview,
      performance,
      cache: cacheStats,
      trends,
      optimization
    };
  }
  
  /**
   * Calculates overview metrics
   */
  private static calculateOverviewMetrics(
    analysisPerformance: any,
    cacheStats: any
  ) {
    const totalRequests = this.performanceHistory.length;
    const cachedRequests = this.performanceHistory.filter(h => h.cached).length;
    
    // Calculate cost savings from caching (approximate)
    const avgTokensPerRequest = analysisPerformance.tokenEfficiency.averagePromptTokens + 
                               analysisPerformance.tokenEfficiency.averageResponseTokens;
    const tokensPerDollar = 1000000 / 20; // Rough estimate: $20 per 1M tokens
    const savedTokens = cachedRequests * avgTokensPerRequest;
    const costSavings = savedTokens / tokensPerDollar;
    
    return {
      totalAnalyses: totalRequests,
      averageResponseTime: analysisPerformance.averageResponseTime,
      averageTokenUsage: avgTokensPerRequest,
      cacheHitRate: totalRequests > 0 ? cacheStats.hitRate : 0,
      costSavings: costSavings
    };
  }
  
  /**
   * Calculates detailed performance breakdown
   */
  private static calculatePerformanceBreakdown(analysisPerformance: any) {
    // Response time categorization
    const responseTimeBreakdown = {
      fast: 0,   // < 10s
      medium: 0, // 10-30s  
      slow: 0    // > 30s
    };
    
    this.performanceHistory.forEach(event => {
      const timeInSeconds = event.responseTime / 1000;
      if (timeInSeconds < 10) responseTimeBreakdown.fast++;
      else if (timeInSeconds < 30) responseTimeBreakdown.medium++;
      else responseTimeBreakdown.slow++;
    });
    
    // Token efficiency
    const tokenEfficiency = {
      averagePromptTokens: analysisPerformance.tokenEfficiency.averagePromptTokens,
      averageResponseTokens: analysisPerformance.tokenEfficiency.averageResponseTokens,
      totalTokensUsed: this.performanceHistory.reduce((total, event) => total + event.tokenUsage, 0),
      estimatedCost: this.performanceHistory.reduce((total, event) => total + event.tokenUsage, 0) * 0.00002 // $0.02 per 1K tokens estimate
    };
    
    // Regional performance
    const regionalPerformance = {
      england: { count: 0, avgResponseTime: 0, avgTokens: 0 },
      wales: { count: 0, avgResponseTime: 0, avgTokens: 0 },
      scotland: { count: 0, avgResponseTime: 0, avgTokens: 0 },
      'northern-ireland': { count: 0, avgResponseTime: 0, avgTokens: 0 }
    } as { [key in UKRegion]: { count: number; avgResponseTime: number; avgTokens: number; } };
    
    // Group by region
    const regionGroups: { [key in UKRegion]: Array<{ responseTime: number; tokenUsage: number; }> } = {
      england: [],
      wales: [],
      scotland: [],
      'northern-ireland': []
    };
    
    this.performanceHistory.forEach(event => {
      regionGroups[event.region].push({
        responseTime: event.responseTime,
        tokenUsage: event.tokenUsage
      });
    });
    
    // Calculate averages for each region
    Object.entries(regionGroups).forEach(([region, events]) => {
      const regionKey = region as UKRegion;
      regionalPerformance[regionKey].count = events.length;
      
      if (events.length > 0) {
        regionalPerformance[regionKey].avgResponseTime = 
          events.reduce((sum, e) => sum + e.responseTime, 0) / events.length;
        regionalPerformance[regionKey].avgTokens = 
          events.reduce((sum, e) => sum + e.tokenUsage, 0) / events.length;
      }
    });
    
    return {
      responseTimeBreakdown,
      tokenEfficiency,
      regionalPerformance
    };
  }
  
  /**
   * Calculates trend data for charts
   */
  private static calculateTrends() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    const oneWeek = 7 * oneDay;
    
    // Hourly analyses (last 24 hours)
    const hourlyAnalyses = new Array(24).fill(0);
    
    // Daily token usage (last 7 days)  
    const dailyTokenUsage = new Array(7).fill(0);
    
    // Weekly response times (last 8 weeks)
    const weeklyResponseTimes = new Array(8).fill(0);
    const weeklyResponseCounts = new Array(8).fill(0);
    
    this.performanceHistory.forEach(event => {
      const age = now - event.timestamp;
      
      // Hourly data
      if (age < oneDay) {
        const hourIndex = Math.floor(age / oneHour);
        if (hourIndex < 24) {
          hourlyAnalyses[23 - hourIndex]++;
        }
      }
      
      // Daily data
      if (age < oneWeek) {
        const dayIndex = Math.floor(age / oneDay);
        if (dayIndex < 7) {
          dailyTokenUsage[6 - dayIndex] += event.tokenUsage;
        }
      }
      
      // Weekly data
      if (age < 8 * oneWeek) {
        const weekIndex = Math.floor(age / oneWeek);
        if (weekIndex < 8) {
          weeklyResponseTimes[7 - weekIndex] += event.responseTime;
          weeklyResponseCounts[7 - weekIndex]++;
        }
      }
    });
    
    // Calculate average response times for weeks
    for (let i = 0; i < weeklyResponseTimes.length; i++) {
      if (weeklyResponseCounts[i] > 0) {
        weeklyResponseTimes[i] /= weeklyResponseCounts[i];
      }
    }
    
    return {
      hourlyAnalyses,
      dailyTokenUsage,
      weeklyResponseTimes
    };
  }
  
  /**
   * Generates optimization recommendations
   */
  private static generateOptimizationRecommendations(
    analysisPerformance: any,
    cacheStats: any
  ) {
    const recommendations: string[] = [];
    const potentialSavings = {
      tokenReduction: 0,
      timeReduction: 0,
      costReduction: 0
    };
    
    // Cache performance recommendations
    if (cacheStats.hitRate < 0.3) {
      recommendations.push("Low cache hit rate detected. Consider implementing document similarity matching to improve cache effectiveness.");
      potentialSavings.timeReduction += 15; // 15% time reduction estimate
      potentialSavings.costReduction += 25; // 25% cost reduction estimate
    }
    
    // Token usage recommendations  
    const avgTokens = analysisPerformance.tokenEfficiency.averagePromptTokens + 
                     analysisPerformance.tokenEfficiency.averageResponseTokens;
    if (avgTokens > 6000) {
      recommendations.push("High token usage detected. Consider implementing more aggressive prompt optimization and document summarization.");
      potentialSavings.tokenReduction += 20; // 20% token reduction estimate
      potentialSavings.costReduction += 20;
    }
    
    // Response time recommendations
    if (analysisPerformance.averageResponseTime > 20000) { // > 20 seconds
      recommendations.push("Slow response times detected. Consider enabling parallel processing for complex documents.");
      potentialSavings.timeReduction += 30; // 30% time reduction estimate
    }
    
    // Regional optimization
    const regionCounts = Object.values(analysisPerformance.regionBreakdown).map(count => Number(count) || 0);
    const maxRegionCount = Math.max(...regionCounts);
    const minRegionCount = Math.min(...regionCounts);
    
    if (maxRegionCount > minRegionCount * 3) {
      recommendations.push("Uneven regional analysis distribution. Consider regional cache preloading for frequently analyzed regions.");
      potentialSavings.timeReduction += 10;
    }
    
    // Memory usage recommendations
    if (cacheStats.memoryUsage > 50 * 1024 * 1024) { // > 50MB
      recommendations.push("High cache memory usage. Consider implementing more aggressive cache eviction policies.");
    }
    
    // Default recommendations if no issues found
    if (recommendations.length === 0) {
      recommendations.push("System performance is good. Continue monitoring for optimization opportunities.");
    }
    
    return {
      recommendations,
      potentialSavings
    };
  }
  
  /**
   * Exports performance data for external analysis
   */
  static exportPerformanceData(): {
    timestamp: string;
    data: PerformanceDashboardData;
    rawEvents: typeof this.performanceHistory;
  } {
    return {
      timestamp: new Date().toISOString(),
      data: this.generateDashboardData(),
      rawEvents: [...this.performanceHistory] // Copy to prevent mutation
    };
  }
  
  /**
   * Resets all performance tracking data
   */
  static resetPerformanceData(): void {
    this.performanceHistory = [];
    console.log("Performance dashboard data reset");
  }
  
  /**
   * Gets real-time performance status
   */
  static getRealTimeStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    activeAnalyses: number;
    avgResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
  } {
    const recentEvents = this.performanceHistory.filter(
      event => Date.now() - event.timestamp < 5 * 60 * 1000 // Last 5 minutes
    );
    
    const avgResponseTime = recentEvents.length > 0 ?
      recentEvents.reduce((sum, event) => sum + event.responseTime, 0) / recentEvents.length : 0;
    
    const cacheHitRate = recentEvents.length > 0 ?
      recentEvents.filter(event => event.cached).length / recentEvents.length : 0;
    
    // Determine status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (avgResponseTime > 30000) status = 'critical'; // > 30s
    else if (avgResponseTime > 15000 || cacheHitRate < 0.2) status = 'warning'; // > 15s or < 20% cache hit
    
    return {
      status,
      activeAnalyses: recentEvents.length,
      avgResponseTime,
      errorRate: 0, // Would need error tracking implementation
      cacheHitRate
    };
  }
}

/**
 * Express route handlers for performance dashboard API
 */
export const performanceDashboardRoutes = {
  getDashboardData: () => PerformanceDashboard.generateDashboardData(),
  getRealTimeStatus: () => PerformanceDashboard.getRealTimeStatus(),
  exportData: () => PerformanceDashboard.exportPerformanceData(),
  resetData: () => {
    PerformanceDashboard.resetPerformanceData();
    return { success: true, message: "Performance data reset" };
  }
};