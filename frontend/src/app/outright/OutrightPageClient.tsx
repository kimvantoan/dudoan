'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { OutrightTab } from '@/components/OutrightTab';

export function OutrightPageClient() {
  const {
    tournamentPredictions,
    outrightInput,
    setOutrightInput,
    handleSaveOutright,
    token,
    matches,
  } = useApp();

  return (
    <OutrightTab
      tournamentPredictions={tournamentPredictions}
      outrightInput={outrightInput}
      setOutrightInput={setOutrightInput}
      handleSaveOutright={handleSaveOutright}
      token={token}
      matches={matches}
    />
  );
}
