import React, { useState } from 'react';

interface TeamFlagProps {
  teamName: string;
  crestUrl: string | null;
}

export function TeamFlag({ teamName, crestUrl }: TeamFlagProps) {
  const [hasError, setHasError] = useState(false);

  if (crestUrl && !hasError) {
    return (
      <img
        src={crestUrl}
        alt={teamName}
        onError={() => setHasError(true)}
        className="w-8 h-8 rounded-full object-cover border border-slate-700 bg-slate-800"
      />
    );
  }

  // Fallback to team name initials
  const initials = teamName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  return (
    <span className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-300">
      {initials || '?'}
    </span>
  );
}
