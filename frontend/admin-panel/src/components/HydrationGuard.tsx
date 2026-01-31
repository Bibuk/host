'use client';

import { useEffect, useState } from 'react';
import { useAuthHydration } from '@/stores/auth';

interface HydrationGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Prevents hydration mismatch by waiting for Zustand store rehydration.
 * Use this wrapper for components that depend on persisted auth state.
 */
export function HydrationGuard({ children, fallback = null }: HydrationGuardProps) {
  const hasHydrated = useAuthHydration();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Wait for both client-side render and store hydration
  if (!isClient || !hasHydrated) {
    return fallback;
  }

  return <>{children}</>;
}

/**
 * Hook to safely access auth state without hydration mismatch.
 * Returns null on server and during hydration.
 */
export function useHydratedAuth() {
  const hasHydrated = useAuthHydration();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient && hasHydrated;
}
