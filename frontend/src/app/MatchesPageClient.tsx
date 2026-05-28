'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { MatchesTab } from '@/components/MatchesTab';

export function MatchesPageClient() {
  const {
    matches,
    predictionsInput,
    setPredictionsInput,
    handleSavePrediction,
    token,
    currentUser,
    handleSyncApiMatches,
    handleForceUpdateScores,
    isSyncingApi,
    isUpdatingScores,
    isLoading,
  } = useApp();

  return (
    <div className="space-y-4">
      {/* Developer Controls for Admin */}
      {currentUser?.username === '👤 Admin Minh' && (
        <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 flex flex-wrap gap-2 justify-between items-center mb-1 animate-fade-in">
          <span className="text-[10px] font-black text-amber-500 tracking-wider">
            ⚡ BẢNG ĐIỀU KHIỂN PHÁT TRIỂN
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleSyncApiMatches}
              disabled={isSyncingApi}
              className="bg-indigo-950 hover:bg-indigo-900 disabled:opacity-50 border border-indigo-850 text-indigo-300 font-extrabold text-[10px] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              {isSyncingApi ? 'Đang đồng bộ...' : '🔄 Đồng bộ Matches'}
            </button>
            <button
              onClick={handleForceUpdateScores}
              disabled={isUpdatingScores}
              className="bg-amber-950 hover:bg-amber-900 disabled:opacity-50 border border-amber-850 text-amber-300 font-extrabold text-[10px] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              {isUpdatingScores ? 'Đang cập nhật...' : '⚽ Giả lập Tỉ Số'}
            </button>
          </div>
        </div>
      )}

      <MatchesTab
        matches={matches}
        predictionsInput={predictionsInput}
        setPredictionsInput={setPredictionsInput}
        handleSavePrediction={handleSavePrediction}
        token={token}
        isLoading={isLoading}
      />
    </div>
  );
}
