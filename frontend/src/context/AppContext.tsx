'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

interface AppContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  currentUser: any;
  setCurrentUser: (user: any) => void;
  matches: any[];
  setMatches: (matches: any[]) => void;
  groups: any[];
  setGroups: (groups: any[]) => void;
  activeGroupId: number | null;
  setActiveGroupId: (id: number | null) => void;
  leaderboard: any[];
  setLeaderboard: (leaderboard: any[]) => void;
  isOutrightFinalized: boolean;
  tournamentPredictions: any[];
  setTournamentPredictions: (preds: any[]) => void;
  predictionsInput: { [matchId: number]: { home: string; away: string } };
  setPredictionsInput: React.Dispatch<React.SetStateAction<{ [matchId: number]: { home: string; away: string } }>>;
  outrightInput: { winner: string; first_out: string; golden_boot: string };
  setOutrightInput: React.Dispatch<React.SetStateAction<{ winner: string; first_out: string; golden_boot: string }>>;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  successMsg: string | null;
  errorMsg: string | null;
  isLoading: boolean;
  isUpdatingScores: boolean;
  isSyncingApi: boolean;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  fetchData: (authToken: string) => Promise<void>;
  handleGoogleLogin: () => void;
  googleLoginUrl: string;
  handleMockLogin: (userId: number) => Promise<void>;
  handleLogout: () => void;
  handleSavePrediction: (matchId: number) => Promise<void>;
  handleCreateGroup: (name: string) => Promise<void>;
  handleJoinGroup: (code: string) => Promise<void>;
  handleLeaveGroup: (groupId: number) => Promise<void>;
  handleSaveOutright: (type: string, value: string) => Promise<void>;
  handleForceUpdateScores: () => Promise<void>;
  handleSyncApiMatches: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isOutrightFinalized, setIsOutrightFinalized] = useState<boolean>(false);
  const [tournamentPredictions, setTournamentPredictions] = useState<any[]>([]);
  const [predictionsInput, setPredictionsInput] = useState<{ [matchId: number]: { home: string; away: string } }>({});
  const [outrightInput, setOutrightInput] = useState({ winner: '', first_out: '', golden_boot: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingScores, setIsUpdatingScores] = useState(false);
  const [isSyncingApi, setIsSyncingApi] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Load token & user from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  // Fetch all initial data
  const fetchData = useCallback(async (authToken: string) => {
    setIsLoading(true);
    try {
      // 1. Fetch matches
      const matchesRes = await fetch(`${API_URL}/matches`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const matchesData = await matchesRes.json();
      if (matchesData.success) {
        setMatches(matchesData.data);
        
        // Populate inputs with existing predictions
        const inputs: any = {};
        matchesData.data.forEach((m: any) => {
          if (m.userPrediction) {
            inputs[m.id] = {
              home: m.userPrediction.predHomeScore.toString(),
              away: m.userPrediction.predAwayScore.toString(),
            };
          }
        });
        setPredictionsInput((prev) => ({ ...prev, ...inputs }));
      }

      // 2. Fetch groups
      const groupsRes = await fetch(`${API_URL}/groups`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const groupsData = await groupsRes.json();
      if (groupsData.success) {
        setGroups(groupsData.data);
        if (groupsData.data.length > 0 && !activeGroupId) {
          setActiveGroupId(groupsData.data[0].id);
        }
      }

      // 3. Fetch tournament predictions
      const tpRes = await fetch(`${API_URL}/tournament-predictions`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const tpData = await tpRes.json();
      if (tpData.success) {
        setTournamentPredictions(tpData.data);
        const inputs = { winner: '', first_out: '', golden_boot: '' };
        tpData.data.forEach((p: any) => {
          if (p.type in inputs) {
            inputs[p.type as keyof typeof inputs] = p.value;
          }
        });
        setOutrightInput(inputs);
      }

    } catch (err: any) {
      showError('Không thể tải dữ liệu từ server: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, activeGroupId]);

  // Load database when token is available
  useEffect(() => {
    if (token) {
      fetchData(token);
    }
  }, [token, fetchData]);

  // Fetch leaderboard when active group changes
  useEffect(() => {
    if (!token) return;

    if (!activeGroupId) {
      setLeaderboard([]);
      setIsOutrightFinalized(false);
      return;
    }

    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(`${API_URL}/predictions/leaderboard?groupId=${activeGroupId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          if (data.data && typeof data.data === 'object' && 'leaderboard' in data.data) {
            setLeaderboard(data.data.leaderboard);
            setIsOutrightFinalized(!!data.data.isOutrightFinalized);
          } else {
            setLeaderboard(data.data || []);
            setIsOutrightFinalized(false);
          }
        }
      } catch (err: any) {
        console.error('Error fetching leaderboard:', err);
      }
    };
    fetchLeaderboard();
  }, [token, activeGroupId, API_URL]);

  const googleLoginUrl = `${API_URL}/auth/google`;

  // Google SSO login handler
  const handleGoogleLogin = () => {
    window.location.href = googleLoginUrl;
  };

  // Mock login for easy local development testing
  const handleMockLogin = async (userId: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/mock-login/${userId}`);
      const result = await res.json();
      if (result.success) {
        const { token: jwtToken, user } = result.data;
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(user));
        setToken(jwtToken);
        setCurrentUser(user);
        showSuccess(`Chào mừng ${user.username} đã đăng nhập!`);
      } else {
        showError(result.message || 'Đăng nhập giả lập thất bại');
      }
    } catch (err: any) {
      showError('Lỗi kết nối: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setCurrentUser(null);
    setMatches([]);
    setGroups([]);
    setActiveGroupId(null);
    setLeaderboard([]);
  };

  // Prediction Submit
  const handleSavePrediction = async (matchId: number) => {
    if (!token) return;
    const input = predictionsInput[matchId];
    if (!input || input.home === '' || input.away === '') {
      showError('Vui lòng nhập đầy đủ tỉ số dự đoán!');
      return;
    }

    const homeScore = parseInt(input.home, 10);
    const awayScore = parseInt(input.away, 10);

    if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
      showError('Tỉ số phải là số tự nhiên >= 0');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchId,
          predHomeScore: homeScore,
          predAwayScore: awayScore,
        }),
      });

      const result = await res.json();
      if (result.success) {
        showSuccess('Lưu dự đoán thành công!');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.8 },
        });
        fetchData(token);
      } else {
        showError(result.message || 'Lưu dự đoán thất bại.');
      }
    } catch (err: any) {
      showError('Lỗi lưu dự đoán: ' + err.message);
    }
  };

  // Create Group
  const handleCreateGroup = async (name: string) => {
    if (!token || !name.trim()) return;

    try {
      const res = await fetch(`${API_URL}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      const result = await res.json();
      if (result.success) {
        showSuccess(`Tạo nhóm "${result.data.name}" thành công!`);
        fetchData(token);
        setActiveGroupId(result.data.id);
      } else {
        showError(result.message || 'Tạo nhóm thất bại');
      }
    } catch (err: any) {
      showError('Lỗi tạo nhóm: ' + err.message);
    }
  };

  // Join Group
  const handleJoinGroup = async (code: string) => {
    if (!token || !code.trim()) return;

    try {
      const res = await fetch(`${API_URL}/groups/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode: code }),
      });
      const result = await res.json();
      if (result.success) {
        showSuccess(`Tham gia nhóm "${result.data.name}" thành công!`);
        fetchData(token);
        setActiveGroupId(result.data.id);
      } else {
        showError(result.message || 'Mã mời không đúng hoặc bạn đã ở trong nhóm');
      }
    } catch (err: any) {
      showError('Lỗi tham gia nhóm: ' + err.message);
    }
  };

  // Leave Group
  const handleLeaveGroup = async (groupId: number) => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/groups/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ groupId }),
      });
      const result = await res.json();
      if (result.success) {
        showSuccess('Rời nhóm thành công!');

        // Determine the next group to focus on
        const remainingGroups = groups.filter((g) => g.id !== groupId);
        const nextGroupId = remainingGroups.length > 0 ? remainingGroups[0].id : null;
        setActiveGroupId(nextGroupId);

        // Refresh groups data
        await fetchData(token);
      } else {
        showError(result.message || 'Rời nhóm thất bại.');
      }
    } catch (err: any) {
      showError('Lỗi rời nhóm: ' + err.message);
    }
  };

  // Outright Predictions save
  const handleSaveOutright = async (type: string, value: string) => {
    if (!token) return;
    if (!value.trim()) {
      showError('Vui lòng điền thông tin dự đoán!');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/tournament-predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, value }),
      });
      const result = await res.json();
      if (result.success) {
        showSuccess('Lưu dự đoán dài hạn thành công!');
        fetchData(token);
      } else {
        showError(result.message || 'Không thể lưu dự đoán.');
      }
    } catch (err: any) {
      showError('Lỗi: ' + err.message);
    }
  };

  // Developer control to force simulation of match score updates
  const handleForceUpdateScores = async () => {
    if (!token) return;
    setIsUpdatingScores(true);
    try {
      const res = await fetch(`${API_URL}/matches/force-update-scores`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        showSuccess(result.message || 'Cập nhật tỉ số thành công!');
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });
        fetchData(token);
      }
    } catch (err: any) {
      showError('Lỗi cập nhật: ' + err.message);
    } finally {
      setIsUpdatingScores(false);
    }
  };

  // Developer control to sync matches from external API
  const handleSyncApiMatches = async () => {
    if (!token) return;
    setIsSyncingApi(true);
    try {
      const res = await fetch(`${API_URL}/matches/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        showSuccess(result.message || 'Đồng bộ dữ liệu giải đấu thành công!');
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });
        fetchData(token);
      } else {
        showError(result.message || 'Đồng bộ thất bại.');
      }
    } catch (err: any) {
      showError('Lỗi đồng bộ: ' + err.message);
    } finally {
      setIsSyncingApi(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        token,
        setToken,
        currentUser,
        setCurrentUser,
        matches,
        setMatches,
        groups,
        setGroups,
        activeGroupId,
        setActiveGroupId,
        leaderboard,
        setLeaderboard,
        isOutrightFinalized,
        tournamentPredictions,
        setTournamentPredictions,
        predictionsInput,
        setPredictionsInput,
        outrightInput,
        setOutrightInput,
        isSidebarOpen,
        setIsSidebarOpen,
        successMsg,
        errorMsg,
        isLoading,
        isUpdatingScores,
        isSyncingApi,
        showSuccess,
        showError,
        fetchData,
        handleGoogleLogin,
        googleLoginUrl,
        handleMockLogin,
        handleLogout,
        handleSavePrediction,
        handleCreateGroup,
        handleJoinGroup,
        handleLeaveGroup,
        handleSaveOutright,
        handleForceUpdateScores,
        handleSyncApiMatches,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
