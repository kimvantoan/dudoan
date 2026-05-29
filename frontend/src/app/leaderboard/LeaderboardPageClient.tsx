'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { LeaderboardTab } from '@/components/LeaderboardTab';

export function LeaderboardPageClient() {
  const {
    token,
    groups,
    activeGroupId,
    setActiveGroupId,
    leaderboard,
    currentUser,
    matches,
    handleCreateGroup,
    handleJoinGroup,
    handleLeaveGroup,
    showSuccess,
    isOutrightFinalized,
    isLoading,
    isLeaderboardLoading,
  } = useApp();

  const [newGroupName, setNewGroupName] = useState('');
  const [joinInviteCode, setJoinInviteCode] = useState('');

  // Fallback: If groups are loaded but no active group is selected, select the first one
  React.useEffect(() => {
    if (groups.length > 0 && !activeGroupId) {
      setActiveGroupId(groups[0].id);
    }
  }, [groups, activeGroupId, setActiveGroupId]);

  const onCreate = async () => {
    await handleCreateGroup(newGroupName);
    setNewGroupName('');
  };

  const onJoin = async () => {
    await handleJoinGroup(joinInviteCode);
    setJoinInviteCode('');
  };

  return (
    <LeaderboardTab
      token={token}
      groups={groups}
      activeGroupId={activeGroupId}
      setActiveGroupId={setActiveGroupId}
      leaderboard={leaderboard}
      currentUser={currentUser}
      newGroupName={newGroupName}
      setNewGroupName={setNewGroupName}
      joinInviteCode={joinInviteCode}
      setJoinInviteCode={setJoinInviteCode}
      handleCreateGroup={onCreate}
      handleJoinGroup={onJoin}
      handleLeaveGroup={handleLeaveGroup}
      showSuccess={showSuccess}
      matches={matches}
      isOutrightFinalized={isOutrightFinalized}
      isLoading={isLoading}
      isLeaderboardLoading={isLeaderboardLoading}
    />
  );
}
