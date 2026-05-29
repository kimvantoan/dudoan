'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setToken, setCurrentUser } = useApp();

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');
    const avatarUrl = searchParams.get('avatarUrl');

    if (token && userId && username) {
      // Lưu thông tin đăng nhập vào localStorage
      localStorage.setItem('token', token);
      const user = {
        userId: parseInt(userId, 10),
        username: decodeURIComponent(username),
        avatarUrl: decodeURIComponent(avatarUrl || ''),
      };
      localStorage.setItem('user', JSON.stringify(user));
      
      // Cập nhật AppContext state ngay lập tức để đồng bộ UI
      setToken(token);
      setCurrentUser(user);
      
      // Redirect về trang chủ
      router.push('/');
    } else {
      // Nếu thiếu thông tin, redirect về trang chủ và báo lỗi
      console.error('Đăng nhập Google SSO lỗi hoặc thiếu tham số callback');
      router.push('/');
    }
  }, [router, searchParams, setToken, setCurrentUser]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 font-sans">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-sm font-bold text-slate-400">Đang đồng bộ đăng nhập...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 font-sans">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-bold text-slate-400">Đang đồng bộ đăng nhập...</p>
      </div>
    }>
      <AuthCallbackHandler />
    </Suspense>
  );
}
