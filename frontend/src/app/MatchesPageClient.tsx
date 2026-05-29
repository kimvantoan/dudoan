'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { MatchesTab } from '@/components/MatchesTab';

interface MatchesPageClientProps {
  initialMatches?: any[];
}

export function MatchesPageClient({ initialMatches = [] }: MatchesPageClientProps) {
  const {
    matches,
    handleSavePrediction,
    token,
    isLoading,
  } = useApp();

  // Use server-side pre-fetched matches during initial render and client-side matches once loaded
  const displayMatches = matches.length > 0 ? matches : initialMatches;

  return (
    <div className="space-y-4">
      <MatchesTab
        matches={displayMatches}
        handleSavePrediction={handleSavePrediction}
        token={token}
        isLoading={isLoading && matches.length === 0}
      />
    </div>
  );
}
