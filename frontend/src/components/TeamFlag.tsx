import React, { useState } from 'react';
import Image from 'next/image';

interface TeamFlagProps {
  teamName: string;
  crestUrl: string | null;
}

export function TeamFlag({ teamName, crestUrl }: TeamFlagProps) {
  const [hasError, setHasError] = useState(false);

  if (crestUrl && !hasError) {
    return (
      <Image
        src={crestUrl}
        alt={teamName}
        width={32}
        height={32}
        onError={() => setHasError(true)}
        className="w-8 h-8 rounded-full object-cover border border-slate-700 bg-slate-800"
        unoptimized
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
