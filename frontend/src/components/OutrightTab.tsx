import React, { useState, useEffect } from 'react';
import { TeamFlag } from './TeamFlag';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface OutrightTabProps {
  tournamentPredictions: any[];
  outrightInput: { winner: string; first_out: string; golden_boot: string };
  setOutrightInput: React.Dispatch<
    React.SetStateAction<{ winner: string; first_out: string; golden_boot: string }>
  >;
  handleSaveOutright: (type: string, val: string) => Promise<void>;
  token: string | null;
  matches: any[];
}

export function OutrightTab({
  tournamentPredictions,
  outrightInput,
  setOutrightInput,
  handleSaveOutright,
  token,
  matches,
}: OutrightTabProps) {
  const [subTab, setSubTab] = useState<'winner' | 'first_out' | 'golden_boot' | 'group_stage'>('winner');
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [apiTeams, setApiTeams] = useState<any[]>([]);
  const [apiLoading, setApiLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveOutrightWithLoading = async (type: string, val: string) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await handleSaveOutright(type, val);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Fetch teams and squads from 3rd party API endpoint exposed by NestJS backend
  useEffect(() => {
    if (!token) return;
    let active = true;

    setApiLoading(true);
    fetch(`${API_URL}/teams`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success) {
          setApiTeams(data.data);
          setApiLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching teams and squads:', err);
        if (active) setApiLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, API_URL]);

  const [groupPredictions, setGroupPredictions] = useState<{ [groupName: string]: string[] }>({});

  // Load saved group stage predictions
  useEffect(() => {
    const savedGroupStage = tournamentPredictions.find((x) => x.type === 'group_stage')?.value;
    if (savedGroupStage) {
      try {
        const parsed = JSON.parse(savedGroupStage);
        setGroupPredictions(parsed);
      } catch (e) {
        console.error('Failed to parse group stage predictions:', e);
      }
    }
  }, [tournamentPredictions]);

  // Build default group standings from apiTeams if not already set by DB
  useEffect(() => {
    if (apiTeams.length === 0) return;

    // Check if we have loaded anything from DB
    const savedGroupStage = tournamentPredictions.find((x) => x.type === 'group_stage')?.value;
    if (savedGroupStage) return;

    const initialGroups: { [groupName: string]: string[] } = {};
    apiTeams.forEach((t) => {
      const g = t.group || 'Chưa chia bảng';
      if (g === 'Chưa chia bảng') return;

      const name = t.shortName || t.name;
      if (!initialGroups[g]) {
        initialGroups[g] = [];
      }
      if (!initialGroups[g].includes(name)) {
        initialGroups[g].push(name);
      }
    });

    // Sort alphabetically by default
    Object.keys(initialGroups).forEach((g) => {
      initialGroups[g].sort((a, b) => a.localeCompare(b, 'vi'));
    });

    setGroupPredictions(initialGroups);
  }, [apiTeams, tournamentPredictions]);

  // Dynamically compute the participating teams exclusively from the API
  const teams = apiTeams.map((t) => t.shortName || t.name).sort((a, b) => a.localeCompare(b, 'vi'));

  // Map of team name to crestUrl from API
  const crestMap: { [team: string]: string | null } = {};
  apiTeams.forEach((t) => {
    const name = t.shortName || t.name;
    crestMap[name] = t.crest;
  });

  // Calculate lock state (15 minutes before the first match kicks off)
  const isOutrightLocked =
    matches.length > 0 &&
    new Date().getTime() >= new Date(matches[0].startTime).getTime() - 15 * 60 * 1000;

  const firstMatchTime = matches.length > 0 ? new Date(matches[0].startTime) : null;
  const lockTimeStr = firstMatchTime
    ? new Date(firstMatchTime.getTime() - 15 * 60 * 1000).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    : null;

  const getContinent = (teamName: string): string => {
    const normalized = teamName.toLowerCase().trim();
    const foundTeam = apiTeams.find(
      (t) =>
        t.name.toLowerCase().trim() === normalized ||
        t.shortName.toLowerCase().trim() === normalized
    );
    return foundTeam?.continent || 'Khác / Chưa Phân Nhóm';
  };

  // Group teams by continent
  const continentGroups: { [continent: string]: string[] } = {};
  teams.forEach((t) => {
    const c = getContinent(t);
    if (!continentGroups[c]) {
      continentGroups[c] = [];
    }
    continentGroups[c].push(t);
  });

  const getPlayersForTeam = (teamName: string): string[] => {
    const normalized = teamName.toLowerCase().trim();
    // Look up in the dynamically loaded apiTeams from NestJS/football-data
    const foundTeam = apiTeams.find(
      (t) =>
        t.name.toLowerCase().trim() === normalized ||
        t.shortName.toLowerCase().trim() === normalized
    );

    if (foundTeam && foundTeam.squad && foundTeam.squad.length > 0) {
      return foundTeam.squad.map((p: any) => p.name);
    }
    return [];
  };

  const handleSelectTeam = (field: 'winner' | 'first_out', team: string) => {
    if (isOutrightLocked) return;
    setOutrightInput((prev) => ({
      ...prev,
      [field]: team,
    }));
  };

  const handleInputChange = (field: 'winner' | 'first_out' | 'golden_boot', value: string) => {
    setOutrightInput((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveGroupStage = async () => {
    if (isSaving) return;
    const val = JSON.stringify(groupPredictions);
    setIsSaving(true);
    try {
      await handleSaveOutright('group_stage', val);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = (result: any) => {
    const { source, destination } = result;
    if (!destination) return;

    const groupName = source.droppableId;
    if (source.droppableId !== destination.droppableId) return;

    const currentOrder = [...(groupPredictions[groupName] || [])];
    const [removed] = currentOrder.splice(source.index, 1);
    currentOrder.splice(destination.index, 0, removed);

    setGroupPredictions((prev) => ({
      ...prev,
      [groupName]: currentOrder,
    }));
  };

  const getSavedValue = (type: string) => {
    const p = tournamentPredictions.find((x) => x.type === type);
    return p ? p.value : null;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 pl-1">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
          Tiên Tri Giải Đấu
        </h3>
        {lockTimeStr && (
          <p className={`text-[10px] font-bold ${isOutrightLocked ? 'text-rose-400' : 'text-amber-400 animate-pulse'}`}>
            {isOutrightLocked
              ? `🔒 Dự đoán đã khóa lúc: ${lockTimeStr}`
              : `⏱️ Hạn khóa dự đoán: ${lockTimeStr}`}
          </p>
        )}
      </div>

      {/* Sub-tab Navigation */}
      <div className="grid grid-cols-4 bg-slate-900 p-1 rounded-xl border border-slate-800/80 gap-0.5 sm:gap-1">
        <button
          onClick={() => setSubTab('winner')}
          className={`py-2 text-center text-[10px] sm:text-xs font-black rounded-lg transition-all cursor-pointer truncate ${subTab === 'winner' ? 'bg-indigo-650 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
        >
          👑 Vô Địch
        </button>
        <button
          onClick={() => setSubTab('first_out')}
          className={`py-2 text-center text-[10px] sm:text-xs font-black rounded-lg transition-all cursor-pointer truncate ${subTab === 'first_out' ? 'bg-indigo-650 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
        >
          ❌ Rời Giải
        </button>
        <button
          onClick={() => setSubTab('golden_boot')}
          className={`py-2 text-center text-[10px] sm:text-xs font-black rounded-lg transition-all cursor-pointer truncate ${subTab === 'golden_boot' ? 'bg-indigo-650 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
        >
          👟 Phá Lưới
        </button>
        <button
          onClick={() => setSubTab('group_stage')}
          className={`py-2 text-center text-[10px] sm:text-xs font-black rounded-lg transition-all cursor-pointer truncate ${subTab === 'group_stage' ? 'bg-indigo-650 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
        >
          📊 Vòng Bảng
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-5">
        {apiLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 font-bold">Đang tải danh sách đội & cầu thủ từ API...</p>
          </div>
        ) : (
          <>
            {/* Winner and First Out continent grids */}
            {(subTab === 'winner' || subTab === 'first_out') && (
              <div className="space-y-6">
                <div className="bg-indigo-950/20 border border-indigo-900/40 p-3.5 rounded-xl flex items-center justify-between text-xs animate-fade-in gap-3">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-slate-400 font-medium">
                      {subTab === 'winner'
                        ? 'Vô Địch (+20đ):'
                        : 'Rời Giải Sớm (+10đ):'}
                    </span>
                    <div className="flex items-center gap-2 min-w-0 mt-0.5">
                      {outrightInput[subTab] ? (
                        <>
                          <TeamFlag teamName={outrightInput[subTab]} crestUrl={crestMap[outrightInput[subTab]]} />
                          <span className="text-indigo-400 font-black text-sm truncate">
                            {outrightInput[subTab]}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-500 font-bold text-sm">Chưa chọn</span>
                      )}
                    </div>
                  </div>
                  {token && !isOutrightLocked && (
                    <button
                      disabled={isSaving || !outrightInput[subTab]}
                      onClick={() => handleSaveOutrightWithLoading(subTab, outrightInput[subTab])}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-550 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-[11px] px-4 py-2 rounded-xl transition-all cursor-pointer shadow shrink-0"
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

                {Object.keys(continentGroups).map((continent) => (
                  <div key={continent} className="space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                      {continent}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {continentGroups[continent].map((team) => {
                        const isSelected = outrightInput[subTab] === team;
                        const isSaved = getSavedValue(subTab) === team;

                        return (
                          <button
                            key={team}
                            disabled={isOutrightLocked}
                            onClick={() => handleSelectTeam(subTab, team)}
                            className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${isSelected
                              ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950/50 scale-[1.02]'
                              : 'bg-slate-950/60 border-slate-850 hover:border-slate-800 hover:bg-slate-950'
                              } cursor-pointer`}
                          >
                            <TeamFlag teamName={team} crestUrl={crestMap[team]} />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold truncate text-slate-200">
                                {team}
                              </span>
                              {isSaved && (
                                <span className="text-[8px] font-bold text-indigo-400 uppercase">
                                  ✓ Đã lưu
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Golden Boot players list grouped by team */}
            {subTab === 'golden_boot' && (
              <div className="space-y-5">
                <div className="bg-indigo-950/20 border border-indigo-900/40 p-3.5 rounded-xl flex items-center justify-between text-xs animate-fade-in gap-3">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-slate-400 font-medium">
                      Vua Phá Lưới (+15đ):
                    </span>
                    <span className="text-indigo-400 font-black text-sm truncate">
                      {outrightInput.golden_boot || 'Chưa chọn'}
                    </span>
                  </div>
                  {token && !isOutrightLocked && (
                    <button
                      disabled={isSaving || !outrightInput.golden_boot}
                      onClick={() => handleSaveOutrightWithLoading('golden_boot', outrightInput.golden_boot)}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-550 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-[11px] px-4 py-2 rounded-xl transition-all cursor-pointer shadow shrink-0"
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

                {/* Search filter for player lists */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="🔍 Tìm kiếm nhanh cầu thủ..."
                    value={playerSearchQuery}
                    onChange={(e) => setPlayerSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* List teams with players */}
                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                  {teams.map((team) => {
                    const players = getPlayersForTeam(team);
                    const filteredPlayers = players.filter((p) =>
                      p.toLowerCase().includes(playerSearchQuery.toLowerCase())
                    );

                    if (playerSearchQuery && filteredPlayers.length === 0) {
                      return null;
                    }

                    if (players.length === 0) {
                      return null;
                    }

                    return (
                      <div key={team} className="space-y-2 p-3.5 bg-slate-950/30 rounded-xl border border-slate-850/85">
                        <div className="flex items-center gap-2 border-b border-slate-850/60 pb-2 mb-2.5">
                          <TeamFlag teamName={team} crestUrl={crestMap[team]} />
                          <span className="text-xs font-black text-slate-300">{team}</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {(playerSearchQuery ? filteredPlayers : players).map((player) => {
                            const isSelected = outrightInput.golden_boot === player;
                            const isSaved = getSavedValue('golden_boot') === player;

                            return (
                              <button
                                key={player}
                                disabled={isOutrightLocked}
                                onClick={() => handleInputChange('golden_boot', player)}
                                className={`px-3 py-2 rounded-lg text-[11px] text-left border transition-all truncate ${isSelected
                                  ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300 font-bold shadow shadow-indigo-950/50'
                                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white'
                                  } cursor-pointer`}
                                title={player}
                              >
                                👤 {player} {isSaved && '✓'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {subTab === 'group_stage' && !mounted && (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400 font-bold">Đang tải bảng đấu...</p>
              </div>
            )}

            {subTab === 'group_stage' && mounted && (
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-indigo-950/20 border border-indigo-900/40 p-3.5 rounded-xl flex items-center justify-between text-xs gap-3">
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-slate-400 font-medium">
                        BXH Vòng Bảng (+10đ nếu đúng cả Nhất & Nhì bảng)
                      </span>
                      <span className="text-indigo-400 font-black text-sm truncate">
                        Kéo thả để xếp thứ tự
                      </span>
                    </div>
                    {token && !isOutrightLocked && (
                      <button
                        disabled={isSaving}
                        onClick={handleSaveGroupStage}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-550 text-white font-extrabold text-[11px] px-4 py-2 rounded-xl transition-all cursor-pointer shadow shrink-0"
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

                  <p className="text-[11px] text-amber-400/90 leading-relaxed pl-1.5 bg-amber-950/25 border border-amber-900/30 p-3 rounded-xl flex items-start gap-2">
                    <span>💡</span>
                    <span>
                      <strong>Hướng dẫn:</strong> Giữ chuột hoặc chạm cảm ứng vào bất kỳ vị trí nào trên thẻ đội và kéo lên/xuống để đổi thứ tự trong bảng. 2 đội đứng đầu sẽ được dự đoán giành vé đi tiếp!
                    </span>
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {Object.keys(groupPredictions).sort().map((groupName) => {
                      const teamOrder = groupPredictions[groupName] || [];
                      return (
                        <div key={groupName} className="bg-slate-950/40 border border-slate-850/80 rounded-2xl p-4.5 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-850/65 pb-2">
                            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">
                              {groupName.replace('Group', 'Bảng')}
                            </h4>
                          </div>

                          <Droppable droppableId={groupName} type="group_teams">
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="space-y-2"
                              >
                                {teamOrder.map((team, index) => {
                                  const isFirstOrSecond = index < 2;
                                  const isSaved = getSavedValue('group_stage') && (() => {
                                    try {
                                      const parsed = JSON.parse(getSavedValue('group_stage') || '{}');
                                      const savedOrder = parsed[groupName] || [];
                                      return savedOrder[index] === team;
                                    } catch (e) {
                                      return false;
                                    }
                                  })();

                                  return (
                                    <Draggable
                                      key={`${groupName}-${team}`}
                                      draggableId={`${groupName}-${team}`}
                                      index={index}
                                      isDragDisabled={isOutrightLocked}
                                    >
                                      {(providedDraggable, snapshot) => (
                                        <div
                                          ref={providedDraggable.innerRef}
                                          {...providedDraggable.draggableProps}
                                          {...providedDraggable.dragHandleProps}
                                          className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${snapshot.isDragging
                                            ? 'bg-indigo-950/40 border-indigo-500 shadow-xl shadow-indigo-950/50 scale-[1.02]'
                                            : isFirstOrSecond
                                              ? 'bg-indigo-950/15 border-indigo-900/40 hover:border-indigo-800/60'
                                              : 'bg-slate-900/75 border-slate-850 hover:border-slate-800'
                                            } ${!isOutrightLocked ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                        >
                                          <div className="flex items-center gap-3 min-w-0">
                                            <span
                                              className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${index === 0
                                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                : index === 1
                                                  ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30'
                                                  : 'bg-slate-800/40 text-slate-400'
                                                }`}
                                            >
                                              {index + 1}
                                            </span>
                                            <TeamFlag teamName={team} crestUrl={crestMap[team]} />
                                            <span className="font-bold text-slate-200 truncate">{team}</span>
                                            {isFirstOrSecond && (
                                              <span className="text-[8px] bg-emerald-950/60 text-emerald-400 font-bold border border-emerald-900/60 px-1.5 py-0.5 rounded uppercase tracking-wider scale-90">
                                                Đi tiếp
                                              </span>
                                            )}
                                          </div>

                                          <div className="flex items-center gap-2 shrink-0">
                                            {isSaved && <span className="text-[10px] text-indigo-400 font-bold">✓</span>}
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  );
                                })}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </DragDropContext>
            )}
          </>
        )}
      </div>
    </div>
  );
}
