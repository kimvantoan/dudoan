import React, { useState, useEffect } from 'react';
import { TeamFlag } from './ui/TeamFlag';
import { MatchCountdown } from './ui/MatchCountdown';
import { formatMatchTime, formatMatchStage } from '@/utils/format';

interface MatchCardProps {
  match: any;
  token: string | null;
  onSavePrediction: (matchId: number, homeScore: number, awayScore: number) => Promise<void>;
}

export function MatchCard({ match, token, onSavePrediction }: MatchCardProps) {
  const [homePred, setHomePred] = useState(
    match.userPrediction ? match.userPrediction.predHomeScore.toString() : ''
  );
  const [awayPred, setAwayPred] = useState(
    match.userPrediction ? match.userPrediction.predAwayScore.toString() : ''
  );
  const [isSaving, setIsSaving] = useState(false);

  const isFinished = match.status === 'finished';
  // Lock checking: 15 mins before match starts
  const isLocked = new Date().getTime() >= new Date(match.startTime).getTime() - 15 * 60 * 1000;

  // Sync state if match predictions update in the parent
  useEffect(() => {
    if (match.userPrediction) {
      setHomePred(match.userPrediction.predHomeScore.toString());
      setAwayPred(match.userPrediction.predAwayScore.toString());
    } else {
      setHomePred('');
      setAwayPred('');
    }
  }, [match.userPrediction]);

  const handleSave = async () => {
    if (!token || isSaving || isLocked || isFinished) return;

    if (homePred === '' || awayPred === '') {
      return; // Handled by AppContext validation if needed, but local check protects it
    }

    const homeVal = parseInt(homePred, 10);
    const awayVal = parseInt(awayPred, 10);

    if (isNaN(homeVal) || isNaN(awayVal) || homeVal < 0 || awayVal < 0) return;

    setIsSaving(true);
    try {
      await onSavePrediction(match.id, homeVal, awayVal);
    } catch (err) {
      console.error('Failed to save prediction:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`bg-slate-950 rounded-2xl border p-4 transition-all ${
        isFinished ? 'border-slate-800 opacity-80' : 'border-slate-850/80 hover:border-slate-750'
      }`}
    >
      {/* Match Header */}
      <div className="flex justify-between items-center mb-3 border-b border-slate-900 pb-2">
        <div className="text-[10px] font-bold text-slate-400 flex flex-col gap-0.5 items-start">
          <span className="flex items-center gap-1 text-slate-400">
            📅 {formatMatchTime(match.startTime)}
          </span>
          <span className="text-[9px] text-indigo-400 uppercase tracking-wider font-extrabold">
            {formatMatchStage(match.groupName, match.stage)}
          </span>
        </div>
        {!isFinished ? (
          <MatchCountdown startTime={match.startTime} onLock={() => {}} />
        ) : (
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
            ✓ Hoàn thành
          </span>
        )}
      </div>

      {/* Match Main Body */}
      <div className="grid grid-cols-7 items-center justify-center text-center my-2">
        {/* Home Team */}
        <div className="col-span-2 flex flex-col items-center gap-1">
          <TeamFlag teamName={match.homeTeam} crestUrl={match.homeCrest} />
          <span className="text-xs font-bold truncate max-w-full">
            {match.homeTeam}
          </span>
        </div>

        {/* Score Display (Input or Finalized) */}
        <div className="col-span-3 flex items-center justify-center gap-2">
          {isFinished ? (
            <div className="flex items-center justify-center gap-3 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-lg font-black text-amber-400">{match.homeScore}</span>
              <span className="text-slate-600 font-extrabold">-</span>
              <span className="text-lg font-black text-amber-400">{match.awayScore}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                disabled={isLocked || !token}
                placeholder="?"
                value={homePred}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                  setHomePred(val);
                }}
                className="w-10 h-10 bg-slate-900 disabled:bg-slate-950 disabled:text-slate-650 rounded-xl text-center font-extrabold text-sm border border-slate-800 focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-slate-600 font-bold">:</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                disabled={isLocked || !token}
                placeholder="?"
                value={awayPred}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                  setAwayPred(val);
                }}
                className="w-10 h-10 bg-slate-900 disabled:bg-slate-950 disabled:text-slate-650 rounded-xl text-center font-extrabold text-sm border border-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="col-span-2 flex flex-col items-center gap-1">
          <TeamFlag teamName={match.awayTeam} crestUrl={match.awayCrest} />
          <span className="text-xs font-bold truncate max-w-full">
            {match.awayTeam}
          </span>
        </div>
      </div>

      {/* Prediction Save Footer / Results points */}
      <div className="mt-3 pt-3 border-t border-slate-900 flex justify-between items-center text-xs">
        {match.userPrediction ? (
          <div className="text-[11px] text-indigo-400">
            🔮 Đã đoán: {match.userPrediction.predHomeScore} - {match.userPrediction.predAwayScore}
          </div>
        ) : (
          <div className="text-[11px] text-slate-500">
            {isLocked ? '🔒 Hết hạn dự đoán' : !token ? '🔑 Đăng nhập để dự đoán' : '🎲 Chưa dự đoán'}
          </div>
        )}

        {isFinished && match.userPrediction && (
          <div className="text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-900/60">
            +{match.userPrediction.pointsEarned} điểm
          </div>
        )}

        {!isFinished && !isLocked && token && (
          <button
            onClick={handleSave}
            disabled={isSaving || homePred === '' || awayPred === ''}
            className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-550 disabled:bg-slate-850 disabled:text-slate-500 disabled:border-slate-800 border border-indigo-500/30 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-md"
          >
            {isSaving && (
              <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>{isSaving ? 'Đang lưu...' : 'Lưu dự đoán'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
