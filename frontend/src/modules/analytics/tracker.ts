import posthog from 'posthog-js';
import { ANALYTICS_EVENTS } from './events';

export const analytics = {
  /**
   * Identifies the user in PostHog
   */
  identify: (userId: string, properties: Record<string, any> = {}) => {
    if (typeof window === 'undefined') return;
    posthog.identify(userId, {
      ...properties,
      platform: 'telegram_mini_app',
      $set: properties // Ensure these are set on the person profile
    });
  },

  /**
   * Tracks a custom event
   */
  track: (eventName: string, properties: Record<string, any> = {}) => {
    if (typeof window === 'undefined') return;
    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Tracks a screen view
   */
  screen: (screenName: string, properties: Record<string, any> = {}) => {
    if (typeof window === 'undefined') return;
    posthog.capture('$pageview', {
      $current_url: screenName,
      ...properties,
    });
  },

  /**
   * Resets the user (on logout)
   */
  reset: () => {
    if (typeof window === 'undefined') return;
    posthog.reset();
  },

  /**
   * Access to raw events constants
   */
  events: ANALYTICS_EVENTS,
};
