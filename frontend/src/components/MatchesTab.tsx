import React from 'react';
import { TeamFlag } from './TeamFlag';
import { MatchCountdown } from './MatchCountdown';
import { formatMatchTime, formatMatchStage } from '@/utils/format';

interface MatchesTabProps {
  matches: any[];
  predictionsInput: { [matchId: number]: { home: string; away: string } };
  setPredictionsInput: React.Dispatch<
    React.SetStateAction<{ [matchId: number]: { home: string; away: string } }>
  >;
  handleSavePrediction: (matchId: number) => Promise<void>;
  token: string | null;
}

export function MatchesTab({
  matches,
  predictionsInput,
  setPredictionsInput,
  handleSavePrediction,
  token,
}: MatchesTabProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pl-1">
        Danh Sách Trận Đấu
      </h3>
      {matches.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-xs">
          Không có dữ liệu trận đấu nào.
        </div>
      ) : (
        matches.map((match) => {
          const isFinished = match.status === 'finished';
          // Lock checking: 15 mins before match starts
          const isLocked = new Date().getTime() >= new Date(match.startTime).getTime() - 15 * 60 * 1000;

          return (
            <div
              key={match.id}
              className={`bg-slate-950 rounded-2xl border p-4 transition-all ${
                isFinished ? 'border-slate-800 opacity-80' : 'border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Match Header */}
              <div className="flex justify-between items-center mb-3 border-b border-slate-900 pb-2">
                <div className="text-[10px] font-bold text-slate-450 flex flex-col gap-0.5 items-start">
                  <span className="flex items-center gap-1 text-slate-400">
                    📅 {formatMatchTime(match.startTime)}
                  </span>
                  <span className="text-[9px] text-indigo-400 uppercase tracking-wider font-extrabold">
                    {formatMatchStage(match.groupName, match.stage)}
                  </span>
                </div>
                {!isFinished ? (
                  <MatchCountdown
                    startTime={match.startTime}
                    onLock={() => {
                      // Status will automatically lock input based on time
                    }}
                  />
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
                        type="number"
                        min="0"
                        max="99"
                        disabled={isLocked}
                        placeholder="?"
                        value={predictionsInput[match.id]?.home || ''}
                        onChange={(e) =>
                          setPredictionsInput((prev) => ({
                            ...prev,
                            [match.id]: {
                              ...(prev[match.id] || { home: '', away: '' }),
                              home: e.target.value,
                            },
                          }))
                        }
                        className="w-10 h-10 bg-slate-900 disabled:bg-slate-950 disabled:text-slate-600 rounded-xl text-center font-extrabold text-sm border border-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                      <span className="text-slate-600 font-bold">:</span>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        disabled={isLocked}
                        placeholder="?"
                        value={predictionsInput[match.id]?.away || ''}
                        onChange={(e) =>
                          setPredictionsInput((prev) => ({
                            ...prev,
                            [match.id]: {
                              ...(prev[match.id] || { home: '', away: '' }),
                              away: e.target.value,
                            },
                          }))
                        }
                        className="w-10 h-10 bg-slate-900 disabled:bg-slate-950 disabled:text-slate-600 rounded-xl text-center font-extrabold text-sm border border-slate-800 focus:border-indigo-500 focus:outline-none"
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
                    {isLocked ? '🔒 Hết hạn dự đoán' : '🎲 Chưa dự đoán'}
                  </div>
                )}

                {isFinished && match.userPrediction && (
                  <div className="text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-900/60">
                    +{match.userPrediction.pointsEarned} điểm
                  </div>
                )}

                {!isFinished && !isLocked && token && (
                  <button
                    onClick={() => handleSavePrediction(match.id)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-md"
                  >
                    Lưu dự đoán
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
