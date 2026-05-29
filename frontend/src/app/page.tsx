import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { MatchesPageClient } from './MatchesPageClient';

export const metadata: Metadata = {
  title: "World Cup Predictor - Dự đoán Tỷ số Bóng đá & Tranh tài Nhóm",
  description: "Trực quan hóa dự đoán tỷ số các trận cầu đỉnh cao World Cup, tạo nhóm chơi cùng đồng nghiệp, tích lũy điểm số và thăng hạng trên BXH.",
};

async function getInitialMatches(token?: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const headers: any = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_URL}/matches`, {
      headers,
      cache: 'no-store', // Always fetch fresh matches data during SSR
    });

    if (!res.ok) {
      console.error('Failed to fetch matches during SSR:', res.status);
      return [];
    }

    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching matches during SSR:', error);
    return [];
  }
}

export default async function MatchesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const initialMatches = await getInitialMatches(token);

  return <MatchesPageClient initialMatches={initialMatches} />;
}
