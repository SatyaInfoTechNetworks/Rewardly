import posthog from 'posthog-js';

const POSTHOG_TOKEN = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || 'phc_rvwkbVGsHbDYhS62fJLeGTVKfJG2zYRfuVbyrZyFyDtN';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

export const initPostHog = () => {
  if (typeof window !== 'undefined') {
    posthog.init(POSTHOG_TOKEN, {
      api_host: POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: false, // We'll handle this manually for better control
      capture_pageleave: true,
      session_recording: {
        maskAllInputs: false,
        maskTextSelector: '.mask-analytics',
      },
      autocapture: true,
      persistence: 'localStorage',
    });
  }
  return posthog;
};

export const phClient = typeof window !== 'undefined' ? posthog : null;
