import React from 'react';
import { Metadata } from 'next';
import { LeaderboardPageClient } from './LeaderboardPageClient';

export const metadata: Metadata = {
  title: "Bảng xếp hạng Nhóm & Tranh tài - World Cup Predictor",
  description: "Tạo nhóm riêng cùng bạn bè, so tài điểm số dự đoán tỉ số World Cup và thăng hạng trên Leaderboard.",
};

export default function LeaderboardPage() {
  return <LeaderboardPageClient />;
}
