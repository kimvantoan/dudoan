import React from 'react';
import { getUserAvatar } from '@/utils/avatar';
import confetti from 'canvas-confetti';
import Image from 'next/image';
import { TeamFlag } from './ui/TeamFlag';
import { formatMatchTime, formatMatchStage } from '@/utils/format';

interface LeaderboardTabProps {
  token: string | null;
  groups: any[];
  activeGroupId: number | null;
  setActiveGroupId: (id: number) => void;
  leaderboard: any[];
  currentUser: any;
  newGroupName: string;
  setNewGroupName: (name: string) => void;
  joinInviteCode: string;
  setJoinInviteCode: (code: string) => void;
  handleCreateGroup: () => Promise<void>;
  handleJoinGroup: () => Promise<void>;
  handleLeaveGroup: (groupId: number) => Promise<void>;
  showSuccess: (msg: string) => void;
  matches?: any[];
  isOutrightFinalized?: boolean;
  isLoading?: boolean;
  isLeaderboardLoading?: boolean;
}

const LeaderboardSkeleton = () => (
  <div className="divide-y divide-slate-850/60 animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-3">
          {/* Rank skeleton */}
          <div className="w-5 h-5 bg-slate-800/80 rounded-md" />
          {/* Avatar and name skeleton */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-800/80" />
            <div className="flex flex-col gap-1.5">
              <div className="w-24 h-3 bg-slate-800/80 rounded" />
              <div className="w-16 h-2 bg-slate-800/60 rounded" />
            </div>
          </div>
        </div>
        {/* Points skeleton */}
        <div className="w-12 h-3 bg-slate-800/80 rounded" />
      </div>
    ))}
  </div>
);

export function LeaderboardTab({
  token,
  groups,
  activeGroupId,
  setActiveGroupId,
  leaderboard,
  currentUser,
  newGroupName,
  setNewGroupName,
  joinInviteCode,
  setJoinInviteCode,
  handleCreateGroup,
  handleJoinGroup,
  handleLeaveGroup,
  showSuccess,
  matches = [],
  isOutrightFinalized = false,
  isLoading = false,
  isLeaderboardLoading = false,
}: LeaderboardTabProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<any | null>(null);
  const [userHistory, setUserHistory] = React.useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!selectedUser || !token) {
      setUserHistory([]);
      return;
    }

    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${API_URL}/predictions/user/${selectedUser.userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (result.success) {
          setUserHistory(result.data || []);
        }
      } catch (err) {
        console.error('Error fetching user prediction history:', err);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [selectedUser, token]);

  React.useEffect(() => {
    const isFinished = matches.length > 0 && matches.every((m: any) => m.status === 'finished') && isOutrightFinalized;
    if (isFinished && leaderboard.length > 0) {
      const duration = 5 * 1000; // 5 seconds of fireworks
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 28, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 40 * (timeLeft / duration);
        // left side firework
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        // right side firework
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [leaderboard, matches]);

  const handleModalCreate = async () => {
    if (!newGroupName.trim()) return;
    await handleCreateGroup();
    setIsModalOpen(false);
  };

  const handleModalJoin = async () => {
    if (!joinInviteCode.trim()) return;
    await handleJoinGroup();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Group Controls Panel */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3 shadow-xl">
        {/* Dropdown Selector */}
        <div>
          <select
            value={activeGroupId || ''}
            onChange={(e) => setActiveGroupId(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-850 text-slate-200 rounded-xl px-3 py-2.5 font-bold text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="" disabled>-- Chọn nhóm để xem BXH --</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                👥 {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons Row */}
        <div className="grid grid-cols-3 gap-1.5 w-full">
          <button
            onClick={() => setIsModalOpen(true)}
            className={`${
              activeGroupId ? 'col-span-1' : 'col-span-3'
            } bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 font-extrabold text-[10px] sm:text-xs py-2 px-1 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 min-w-0`}
          >
            <span>➕</span>
            <span className="truncate">Tạo/Vào</span>
          </button>

          {activeGroupId && (
            <>
              <button
                onClick={() => {
                  const code = groups.find((g) => g.id === activeGroupId)?.inviteCode;
                  if (code) {
                    navigator.clipboard.writeText(code);
                    showSuccess('Đã sao chép mã mời nhóm vào Clipboard!');
                  }
                }}
                title="Sao chép mã mời"
                className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-400 font-extrabold text-[10px] sm:text-xs py-2 px-1 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 min-w-0"
              >
                <span>📋</span>
                <span className="truncate">Copy mã</span>
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Bạn có chắc chắn muốn rời nhóm này?')) {
                    handleLeaveGroup(activeGroupId);
                  }
                }}
                title="Rời khỏi nhóm"
                className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 font-extrabold text-[10px] sm:text-xs py-2 px-1 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 min-w-0"
              >
                <span>🚪</span>
                <span className="truncate">Rời nhóm</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Create / Join Group Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-6 shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-sm font-black uppercase text-slate-200 tracking-wider">
                Quản lý nhóm tranh tài
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-5">
              {/* Create Group */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Tạo nhóm mới
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập tên nhóm..."
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleModalCreate}
                    className="bg-indigo-600 hover:bg-indigo-550 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow"
                  >
                    Tạo
                  </button>
                </div>
              </div>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-850"></span>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-slate-900 px-3 text-slate-500 font-bold tracking-wider">Hoặc</span>
                </div>
              </div>

              {/* Join Group */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Tham gia nhóm bằng mã mời
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Dán mã mời vào đây..."
                    value={joinInviteCode}
                    onChange={(e) => setJoinInviteCode(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    onClick={handleModalJoin}
                    className="bg-teal-600 hover:bg-teal-555 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow"
                  >
                    Vào
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
        {(() => {
          const isTournamentFinished = matches.length > 0 && matches.every((m: any) => m.status === 'finished') && isOutrightFinalized;

          return (
            <>
              <div className="bg-slate-900/60 px-4 py-3 border-b border-slate-800/80 flex justify-between items-center">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  {isTournamentFinished ? '🏆 Bảng Vàng Chung Cuộc' : 'Bảng Xếp Hạng'}
                </span>
                {isTournamentFinished && (
                  <span className="text-[10px] font-black text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-800 animate-pulse">
                    🎉 GIẢI ĐẤU ĐÃ KẾT THÚC
                  </span>
                )}
              </div>

              {isLoading || isLeaderboardLoading ? (
                <LeaderboardSkeleton />
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Chưa có dữ liệu bảng xếp hạng nhóm này.
                </div>
              ) : (
                <div>
                  {/* Render Podium for Top 3 if Tournament is Finished */}
                  {isTournamentFinished && (
                    <div className="bg-slate-900/30 border-b border-slate-850 py-8 px-4 flex flex-col items-center">
                      <div className="text-center mb-6">
                        <h3 className="text-sm font-black bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 bg-clip-text text-transparent uppercase tracking-widest">
                          Vinh Danh Nhà Vô Địch
                        </h3>
                        <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider font-bold">
                          Top 3 dự đoán xuất sắc nhất của nhóm
                        </p>
                      </div>

                      {/* Podium Grid */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end w-full max-w-sm mx-auto pt-6 px-2">
                        {/* 2nd Place (Silver) */}
                        <div className="flex flex-col items-center">
                          {leaderboard[1] ? (
                            <>
                              {/* User Info Above Podium */}
                              <div
                                onClick={() => setSelectedUser(leaderboard[1])}
                                className="flex flex-col items-center mb-3.5 text-center cursor-pointer hover:opacity-85 transition-opacity"
                              >
                                <div className="relative">
                                  <Image
                                    src={getUserAvatar(leaderboard[1].username)}
                                    alt={leaderboard[1].username}
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 rounded-full border-2 border-slate-400 bg-slate-800 shadow-md object-cover"
                                  />
                                  <span className="absolute -top-1.5 -right-1.5 text-base">🥈</span>
                                </div>
                                <span className="text-[10px] font-black text-slate-200 truncate max-w-[75px] mt-1.5 block leading-tight">
                                  {leaderboard[1].username}
                                </span>
                                <span className="text-[9px] font-extrabold text-indigo-400 mt-0.5 block">
                                  {leaderboard[1].totalPoints} pts
                                </span>
                              </div>
                              {/* Podium Base */}
                              <div className="w-full h-20 bg-gradient-to-b from-slate-400 to-slate-600 rounded-t-xl flex items-center justify-center shadow-lg border-t border-slate-300/30">
                                <span className="text-4xl font-extrabold text-white/95 drop-shadow select-none">2</span>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-20" />
                          )}
                        </div>

                        {/* 1st Place (Gold) */}
                        <div className="flex flex-col items-center">
                          {leaderboard[0] ? (
                            <>
                              {/* User Info Above Podium */}
                              <div
                                onClick={() => setSelectedUser(leaderboard[0])}
                                className="flex flex-col items-center mb-3.5 text-center scale-105 origin-bottom transition-all duration-350 hover:scale-115 cursor-pointer hover:opacity-90"
                              >
                                <div className="relative">
                                  <Image
                                    src={getUserAvatar(leaderboard[0].username)}
                                    alt={leaderboard[0].username}
                                    width={56}
                                    height={56}
                                    className="w-14 h-14 rounded-full border-2 border-amber-400 bg-slate-800 shadow-lg ring-3 ring-amber-400/20 object-cover"
                                  />
                                  <span className="absolute -top-2.5 -right-2 text-lg animate-bounce">👑</span>
                                </div>
                                <span className="text-[11px] font-black text-amber-300 truncate max-w-[90px] mt-1.5 block leading-tight">
                                  {leaderboard[0].username}
                                </span>
                                <span className="text-[9px] font-black text-amber-450 mt-0.5 block">
                                  {leaderboard[0].totalPoints} pts
                                </span>
                              </div>
                              {/* Podium Base */}
                              <div className="w-full h-28 bg-gradient-to-b from-yellow-450 via-amber-500 to-amber-600 rounded-t-2xl flex items-center justify-center shadow-[0_-4px_25px_rgba(245,158,11,0.25)] border-t border-yellow-300/40">
                                <span className="text-5xl font-extrabold text-white/95 drop-shadow select-none">1</span>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-28" />
                          )}
                        </div>

                        {/* 3rd Place (Bronze) */}
                        <div className="flex flex-col items-center">
                          {leaderboard[2] ? (
                            <>
                              {/* User Info Above Podium */}
                              <div
                                onClick={() => setSelectedUser(leaderboard[2])}
                                className="flex flex-col items-center mb-3.5 text-center cursor-pointer hover:opacity-85 transition-opacity"
                              >
                                <div className="relative">
                                  <Image
                                    src={getUserAvatar(leaderboard[2].username)}
                                    alt={leaderboard[2].username}
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 rounded-full border-2 border-amber-800 bg-slate-800 shadow-md object-cover"
                                  />
                                  <span className="absolute -top-1.5 -right-1.5 text-base">🥉</span>
                                </div>
                                <span className="text-[10px] font-black text-amber-700 truncate max-w-[70px] mt-1.5 block leading-tight">
                                  {leaderboard[2].username}
                                </span>
                                <span className="text-[9px] font-extrabold text-amber-600 mt-0.5 block">
                                  {leaderboard[2].totalPoints} pts
                                </span>
                              </div>
                              {/* Podium Base */}
                              <div className="w-full h-14 bg-gradient-to-b from-amber-700 to-amber-900 rounded-t-lg flex items-center justify-center shadow-md border-t border-amber-600/30">
                                <span className="text-3xl font-extrabold text-white/95 drop-shadow select-none">3</span>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-14" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Users list */}
                  <div className="divide-y divide-slate-850">
                    {(isTournamentFinished ? leaderboard.slice(3) : leaderboard).map((row, index) => {
                      const isCurrentUser = currentUser && row.userId === currentUser.userId;
                      const rank = isTournamentFinished ? index + 4 : index + 1;

                      return (
                        <div
                          key={row.userId}
                          onClick={() => setSelectedUser(row)}
                          className={`flex items-center justify-between px-4 py-3 transition-all cursor-pointer ${isCurrentUser ? 'bg-indigo-950/20' : 'hover:bg-slate-900/20'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Rank badge */}
                            <div className="w-6 flex justify-center text-xs font-extrabold">
                              {rank === 1 ? (
                                <span className="text-base">🥇</span>
                              ) : rank === 2 ? (
                                <span className="text-base">🥈</span>
                              ) : rank === 3 ? (
                                <span className="text-base">🥉</span>
                              ) : (
                                <span className="text-slate-500">{rank}</span>
                              )}
                            </div>

                            {/* Avatar and Name */}
                            <div className="flex items-center gap-2">
                              <Image
                                src={getUserAvatar(row.username)}
                                alt={row.username}
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full border border-slate-700 bg-slate-800 object-cover"
                              />
                              <div className="flex flex-col">
                                <span className={`text-xs font-bold ${isCurrentUser ? 'text-indigo-400' : 'text-slate-200'}`}>
                                  {row.username}
                                </span>
                                <span className="text-[9px] text-slate-500 leading-none">
                                  {row.predictionsCount || 0} trận dự đoán
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Points */}
                          <div className="text-right">
                            <span className={`text-xs font-black ${isCurrentUser ? 'text-indigo-400' : 'text-slate-100'}`}>
                              {row.totalPoints} pts
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>
      
      {/* User Prediction History Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-850 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <Image
                  src={getUserAvatar(selectedUser.username)}
                  alt={selectedUser.username}
                  width={44}
                  height={44}
                  className="w-11 h-11 rounded-full border border-slate-700 bg-slate-800 object-cover"
                />
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-200 tracking-wider">
                    Lịch sử dự đoán: {selectedUser.username}
                  </h3>
                  <p className="text-[10px] text-indigo-400 font-bold mt-0.5">
                    Tổng điểm: {selectedUser.totalPoints} pts • {selectedUser.predictionsCount || 0} trận dự đoán
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body (Scrollable prediction list) */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
              {historyLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-400 font-bold">Đang tải lịch sử dự đoán...</p>
                </div>
              ) : userHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Thành viên này chưa có dự đoán nào cho các trận đã kết thúc.
                </div>
              ) : (
                <div className="space-y-3">
                  {userHistory.map((h: any) => {
                    const hasPrediction = h.prediction !== null;
                    const pts = hasPrediction ? h.prediction.pointsEarned : 0;
                    
                    return (
                      <div
                        key={h.matchId}
                        className="bg-slate-950/40 border border-slate-850/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        {/* Match Info & Teams */}
                        <div className="flex-1 space-y-2">
                          <div className="text-[9px] text-indigo-400 uppercase tracking-wider font-extrabold">
                            {formatMatchStage(h.groupName, h.stage)} • 📅 {formatMatchTime(h.startTime)}
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {/* Home Team */}
                            <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                              <span className="text-xs font-bold truncate text-slate-200">{h.homeTeam}</span>
                              <TeamFlag teamName={h.homeTeam} crestUrl={h.homeCrest} />
                            </div>

                            {/* Actual Score */}
                            <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 text-xs font-black text-amber-400 shrink-0 select-none">
                              {h.homeScore} - {h.awayScore}
                            </div>

                            {/* Away Team */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <TeamFlag teamName={h.awayTeam} crestUrl={h.awayCrest} />
                              <span className="text-xs font-bold truncate text-slate-200">{h.awayTeam}</span>
                            </div>
                          </div>
                        </div>

                        {/* User's Prediction */}
                        <div className="sm:border-l sm:border-slate-850/80 sm:pl-4 flex sm:flex-col items-center justify-between sm:justify-center gap-2 shrink-0">
                          <div className="text-right sm:text-center">
                            <span className="text-[10px] text-slate-500 block">Dự đoán</span>
                            <span className={`text-xs font-extrabold ${hasPrediction ? 'text-indigo-400' : 'text-slate-500'}`}>
                              {hasPrediction ? `🔮 ${h.prediction.predHomeScore} - ${h.prediction.predAwayScore}` : '❌ Không đoán'}
                            </span>
                          </div>

                          <div className="text-right sm:text-center">
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                              pts === 3 
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                                : pts === 1
                                  ? 'bg-slate-400/10 text-slate-300 border border-slate-400/25'
                                  : 'bg-rose-500/5 text-rose-500/50 border border-rose-500/10'
                            }`}>
                              +{pts} điểm
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
