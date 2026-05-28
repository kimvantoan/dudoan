import React from 'react';
import { Metadata } from 'next';
import { MatchesPageClient } from './MatchesPageClient';

export const metadata: Metadata = {
  title: "World Cup Predictor - Dự đoán Tỷ số Bóng đá & Tranh tài Nhóm",
  description: "Trực quan hóa dự đoán tỷ số các trận cầu đỉnh cao World Cup, tạo nhóm chơi cùng đồng nghiệp, tích lũy điểm số và thăng hạng trên BXH.",
};

export default function MatchesPage() {
  return <MatchesPageClient />;
}
