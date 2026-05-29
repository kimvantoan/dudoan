'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { matchService } from '@/services/matchService';

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
  isLeaderboardLoading: boolean;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  fetchData: (authToken?: string | null) => Promise<void>;
  handleGoogleLogin: () => void;
  googleLoginUrl: string;
  handleMockLogin: (userId: number) => Promise<void>;
  handleLogout: () => void;
  handleSavePrediction: (matchId: number, homeVal?: number, awayVal?: number) => Promise<void>;
  handleCreateGroup: (name: string) => Promise<void>;
  handleJoinGroup: (code: string) => Promise<void>;
  handleLeaveGroup: (groupId: number) => Promise<void>;
  handleSaveOutright: (type: string, value: string) => Promise<void>;
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
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);

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

  // Sync token state to document.cookie for SSR
  useEffect(() => {
    if (token) {
      document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;
    } else {
      document.cookie = `token=; path=/; max-age=0; SameSite=Lax`;
    }
  }, [token]);

  // Fetch all initial data
  const fetchData = useCallback(async (authToken?: string | null) => {
    setIsLoading(true);
    try {
      // 1. Fetch matches
      const matchesData = await matchService.getMatches();
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

      // 2. Fetch groups & tournament predictions if logged in
      if (authToken) {
        const groupsData = await matchService.getGroups();
        setGroups(groupsData.data);
        if (groupsData.data.length > 0 && !activeGroupId) {
          setActiveGroupId(groupsData.data[0].id);
        }

        const tpData = await matchService.getTournamentPredictions();
        setTournamentPredictions(tpData.data);
        const inputsOutright = { winner: '', first_out: '', golden_boot: '' };
        tpData.data.forEach((p: any) => {
          if (p.type in inputsOutright) {
            inputsOutright[p.type as keyof typeof inputsOutright] = p.value;
          }
        });
        setOutrightInput(inputsOutright);
      } else {
        setGroups([]);
        setTournamentPredictions([]);
        setOutrightInput({ winner: '', first_out: '', golden_boot: '' });
      }

    } catch (err: any) {
      showError('Không thể tải dữ liệu từ server: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [activeGroupId]);

  // Load database whenever token changes (including null for guests)
  useEffect(() => {
    fetchData(token);
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
      setIsLeaderboardLoading(true);
      try {
        const result = await matchService.getLeaderboard(activeGroupId);
        if (result.data && typeof result.data === 'object' && 'leaderboard' in result.data) {
          setLeaderboard(result.data.leaderboard);
          setIsOutrightFinalized(!!result.data.isOutrightFinalized);
        } else {
          setLeaderboard(result.data || []);
          setIsOutrightFinalized(false);
        }
      } catch (err: any) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setIsLeaderboardLoading(false);
      }
    };
    fetchLeaderboard();
  }, [token, activeGroupId]);

  const googleLoginUrl = `${API_URL}/auth/google`;

  // Google SSO login handler
  const handleGoogleLogin = () => {
    window.location.href = googleLoginUrl;
  };

  // Mock login for easy local development testing
  const handleMockLogin = async (userId: number) => {
    setIsLoading(true);
    try {
      const result = await matchService.mockLogin(userId);
      const { token: jwtToken, user } = result.data;
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(jwtToken);
      setCurrentUser(user);
      showSuccess(`Chào mừng ${user.username} đã đăng nhập!`);
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
  const handleSavePrediction = async (matchId: number, homeVal?: number, awayVal?: number) => {
    if (!token) return;
    
    let homeScore: number;
    let awayScore: number;

    if (homeVal !== undefined && awayVal !== undefined) {
      homeScore = homeVal;
      awayScore = awayVal;
    } else {
      const input = predictionsInput[matchId];
      if (!input || input.home === '' || input.away === '') {
        showError('Vui lòng nhập đầy đủ tỉ số dự đoán!');
        return;
      }
      homeScore = parseInt(input.home, 10);
      awayScore = parseInt(input.away, 10);
    }

    if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
      showError('Tỉ số phải là số tự nhiên >= 0');
      return;
    }

    try {
      await matchService.savePrediction(matchId, homeScore, awayScore);
      showSuccess('Lưu dự đoán thành công!');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.8 },
      });
      fetchData(token);
    } catch (err: any) {
      showError('Lỗi lưu dự đoán: ' + err.message);
    }
  };

  // Create Group
  const handleCreateGroup = async (name: string) => {
    if (!token || !name.trim()) return;

    try {
      const result = await matchService.createGroup(name);
      showSuccess(`Tạo nhóm "${result.data.name}" thành công!`);
      fetchData(token);
      setActiveGroupId(result.data.id);
    } catch (err: any) {
      showError('Lỗi tạo nhóm: ' + err.message);
    }
  };

  // Join Group
  const handleJoinGroup = async (code: string) => {
    if (!token || !code.trim()) return;

    try {
      const result = await matchService.joinGroup(code);
      showSuccess(`Tham gia nhóm "${result.data.name}" thành công!`);
      fetchData(token);
      setActiveGroupId(result.data.id);
    } catch (err: any) {
      showError('Mã mời không đúng hoặc bạn đã ở trong nhóm');
    }
  };

  // Leave Group
  const handleLeaveGroup = async (groupId: number) => {
    if (!token) return;

    try {
      await matchService.leaveGroup(groupId);
      showSuccess('Rời nhóm thành công!');

      // Determine the next group to focus on
      const remainingGroups = groups.filter((g) => g.id !== groupId);
      const nextGroupId = remainingGroups.length > 0 ? remainingGroups[0].id : null;
      setActiveGroupId(nextGroupId);

      // Refresh groups data
      await fetchData(token);
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
      await matchService.saveTournamentPrediction(type, value);
      showSuccess('Lưu dự đoán dài hạn thành công!');
      fetchData(token);
    } catch (err: any) {
      showError('Lỗi: ' + err.message);
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
        isLeaderboardLoading,
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
