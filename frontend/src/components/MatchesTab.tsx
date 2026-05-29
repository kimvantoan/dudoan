import React from 'react';
import { MatchCard } from './MatchCard';

interface MatchesTabProps {
  matches: any[];
  handleSavePrediction: (matchId: number, homeVal?: number, awayVal?: number) => Promise<void>;
  token: string | null;
  isLoading?: boolean;
}

export function MatchesTab({
  matches,
  handleSavePrediction,
  token,
  isLoading = false,
}: MatchesTabProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pl-1">
        Danh Sách Trận Đấu
      </h3>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-4">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold tracking-wide text-slate-500">Đang tải danh sách trận đấu...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-xs">
          Không có dữ liệu trận đấu nào.
        </div>
      ) : (
        matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            token={token}
            onSavePrediction={handleSavePrediction}
          />
        ))
      )}
    </div>
  );
}
