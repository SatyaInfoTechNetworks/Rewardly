"use client";

import { useEffect } from 'react';
import { initPostHog } from '@/modules/analytics/posthog';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return <>{children}</>;
}
