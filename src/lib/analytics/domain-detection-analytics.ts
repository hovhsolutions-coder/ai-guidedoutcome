// Real-time Analytics Integration for Domain Detection
// Production-ready metrics collection and analysis

interface AnalyticsEvent {
  event: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  properties: Record<string, any>;
}

export interface DomainDetectionAnalytics {
  // Intake metrics
  intakeStarted: (sessionId: string, metadata?: any) => void;
  intakeCompleted: (sessionId: string, timeToComplete: number, metadata?: any) => void;
  intakeAbandoned: (sessionId: string, timeSpent: number, step: string, metadata?: any) => void;
  
  // Domain detection metrics
  domainDetected: (sessionId: string, domain: string, confidence: number, previousDomain?: string) => void;
  domainChanged: (sessionId: string, fromDomain: string, toDomain: string) => void;
  confidenceDropped: (sessionId: string, fromConfidence: number, toConfidence: number) => void;
  
  // User interaction metrics
  previewHovered: (sessionId: string, duration: number) => void;
  previewClicked: (sessionId: string, target: string) => void;
  modeOverride: (sessionId: string, detectedDomain: string, selectedMode: string) => void;
  
  // Performance metrics
  typingPattern: (sessionId: string, inputLength: number, typingSpeed: number, pauseDuration: number) => void;
  responsivenessPerceived: (sessionId: string, debounceDelay: number, userSatisfaction: number) => void;
}

// Production analytics implementation
class ProductionAnalytics implements DomainDetectionAnalytics {
  private sessionId: string;
  private events: AnalyticsEvent[] = [];
  
  constructor() {
    this.sessionId = this.generateSessionId();
  }
  
  public get currentSessionId(): string {
    return this.sessionId;
  }
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private track(event: string, properties: Record<string, any>): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      properties,
    };
    
    this.events.push(analyticsEvent);
    
    // Send to analytics service
    this.sendToAnalytics(analyticsEvent);
  }
  
  private sendToAnalytics(event: AnalyticsEvent): void {
    // In production, this would send to your analytics service
    // For now, we'll batch and prepare for real integration
    console.log('[ANALYTICS]', JSON.stringify(event));
    
    // TODO: Replace with actual analytics service call
    // Example: fetch('/api/analytics', { method: 'POST', body: JSON.stringify(event) });
  }
  
  // Intake metrics
  intakeStarted = (sessionId: string, metadata?: any) => {
    this.track('intake_started', { sessionId, metadata });
  };
  
  intakeCompleted = (sessionId: string, timeToComplete: number, metadata?: any) => {
    this.track('intake_completed', { 
      sessionId, 
      timeToComplete, 
      completionRate: this.calculateCompletionRate(sessionId),
      metadata 
    });
  };
  
  intakeAbandoned = (sessionId: string, timeSpent: number, step: string, metadata?: any) => {
    this.track('intake_abandoned', { sessionId, timeSpent, step, metadata });
  };
  
  // Domain detection metrics
  domainDetected = (sessionId: string, domain: string, confidence: number, previousDomain?: string) => {
    this.track('domain_detected', { 
      sessionId, 
      domain, 
      confidence, 
      previousDomain,
      isDomainChange: !!previousDomain && previousDomain !== domain
    });
  };
  
  domainChanged = (sessionId: string, fromDomain: string, toDomain: string) => {
    this.track('domain_changed', { sessionId, fromDomain, toDomain });
  };
  
  confidenceDropped = (sessionId: string, fromConfidence: number, toConfidence: number) => {
    this.track('confidence_dropped', { sessionId, fromConfidence, toConfidence });
  };
  
  // User interaction metrics
  previewHovered = (sessionId: string, duration: number) => {
    this.track('preview_hovered', { sessionId, duration });
  };
  
  previewClicked = (sessionId: string, target: string) => {
    this.track('preview_clicked', { sessionId, target });
  };
  
  modeOverride = (sessionId: string, detectedDomain: string, selectedMode: string) => {
    this.track('mode_override', { sessionId, detectedDomain, selectedMode });
  };
  
  // Performance metrics
  typingPattern = (sessionId: string, inputLength: number, typingSpeed: number, pauseDuration: number) => {
    this.track('typing_pattern', { 
      sessionId, 
      inputLength, 
      typingSpeed, 
      pauseDuration,
      isFastTyper: typingSpeed > 60, // chars per minute
      hasLongPauses: pauseDuration > 2000 // milliseconds
    });
  };
  
  responsivenessPerceived = (sessionId: string, debounceDelay: number, userSatisfaction: number) => {
    this.track('responsiveness_perceived', { sessionId, debounceDelay, userSatisfaction });
  };
  
  // Analysis methods
  private calculateCompletionRate(sessionId: string): number {
    // Calculate completion rate based on session events
    const sessionEvents = this.events.filter(e => e.sessionId === sessionId);
    const startedEvents = sessionEvents.filter(e => e.event === 'intake_started').length;
    const completedEvents = sessionEvents.filter(e => e.event === 'intake_completed').length;
    
    return startedEvents > 0 ? completedEvents / startedEvents : 0;
  }
  
  // Real-time analysis
  getRealTimeMetrics(sessionId: string): any {
    const sessionEvents = this.events.filter(e => e.sessionId === sessionId);
    
    return {
      domainStability: this.calculateDomainStability(sessionEvents),
      averageConfidence: this.calculateAverageConfidence(sessionEvents),
      userEngagement: this.calculateUserEngagement(sessionEvents),
      dropOffRisk: this.calculateDropOffRisk(sessionEvents),
    };
  }
  
  private calculateDomainStability(events: AnalyticsEvent[]): number {
    const domainEvents = events.filter(e => e.event === 'domain_detected');
    if (domainEvents.length < 2) return 1.0;
    
    let changes = 0;
    for (let i = 1; i < domainEvents.length; i++) {
      if (domainEvents[i].properties.domain !== domainEvents[i-1].properties.domain) {
        changes++;
      }
    }
    
    return 1 - (changes / (domainEvents.length - 1));
  }
  
  private calculateAverageConfidence(events: AnalyticsEvent[]): number {
    const domainEvents = events.filter(e => e.event === 'domain_detected');
    if (domainEvents.length === 0) return 0;
    
    const totalConfidence = domainEvents.reduce((sum, e) => sum + e.properties.confidence, 0);
    return totalConfidence / domainEvents.length;
  }
  
  private calculateUserEngagement(events: AnalyticsEvent[]): number {
    const interactionEvents = events.filter(e => 
      e.event === 'preview_hovered' || e.event === 'preview_clicked'
    );
    return Math.min(interactionEvents.length / 10, 1.0); // Normalize to 0-1
  }
  
  private calculateDropOffRisk(events: AnalyticsEvent[]): number {
    const recentEvents = events.filter(e => Date.now() - e.timestamp < 30000); // Last 30 seconds
    const typingEvents = recentEvents.filter(e => e.event === 'typing_pattern');
    
    if (typingEvents.length === 0) return 0.5; // Neutral
    
    const longPauses = typingEvents.filter(e => e.properties.hasLongPauses).length;
    return Math.min(longPauses / typingEvents.length, 1.0);
  }
}

// Singleton instance for production
let analyticsInstance: ProductionAnalytics | null = null;

export function getAnalytics(): ProductionAnalytics {
  if (!analyticsInstance) {
    analyticsInstance = new ProductionAnalytics();
  }
  return analyticsInstance;
}

import { PRODUCTION_CONFIG, EXPERIMENT_VARIANTS, SUCCESS_CRITERIA } from '../guidance-session/domain-detection-metrics';

export { PRODUCTION_CONFIG, EXPERIMENT_VARIANTS, SUCCESS_CRITERIA };
