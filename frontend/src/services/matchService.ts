import { request } from './apiClient';

export const matchService = {
  // Matches
  getMatches: () => request('/matches'),

  // Teams
  getTeams: () => request('/teams'),

  // Save prediction
  savePrediction: (matchId: number, predHomeScore: number, predAwayScore: number) => {
    return request('/predictions', {
      method: 'POST',
      body: JSON.stringify({ matchId, predHomeScore, predAwayScore }),
    });
  },



  // Predictions history for a user
  getUserPredictions: (userId: number) => {
    return request(`/predictions/user/${userId}`);
  },

  // Groups
  getGroups: () => request('/groups'),

  createGroup: (name: string) => {
    return request('/groups', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  joinGroup: (inviteCode: string) => {
    return request('/groups/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    });
  },

  leaveGroup: (groupId: number) => {
    return request('/groups/leave', {
      method: 'POST',
      body: JSON.stringify({ groupId }),
    });
  },

  // Leaderboard
  getLeaderboard: (groupId: number) => {
    return request(`/predictions/leaderboard?groupId=${groupId}`);
  },

  // Tournament Predictions (Outright)
  getTournamentPredictions: () => request('/tournament-predictions'),

  saveTournamentPrediction: (type: string, value: string) => {
    return request('/tournament-predictions', {
      method: 'POST',
      body: JSON.stringify({ type, value }),
    });
  },

  // Mock Login
  mockLogin: (userId: number) => {
    return request(`/auth/mock-login/${userId}`);
  },
};
