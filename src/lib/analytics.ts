// Simple analytics integration point
// Replace with your preferred analytics service (e.g., Google Analytics, Mixpanel, etc.)

export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  // Log events in development
  if (import.meta.env.DEV) {
    console.log('[Analytics]', eventName, properties);
  }
  
  // Integration point for analytics services
  // Example: window.gtag?.('event', eventName, properties);
  // Example: window.mixpanel?.track(eventName, properties);
}

export function trackPageView(pagePath: string) {
  trackEvent('page_view', { path: pagePath });
}
