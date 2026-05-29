import React from 'react';
import { getUserAvatar } from '@/utils/avatar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  currentUser: any;
  handleLogout: () => void;
}

export function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  currentUser,
  handleLogout,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between p-5 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
    >
      <div className="space-y-6">
        {/* Logo / Header */}
        <div className="flex items-center justify-between py-1">
          <Link
            href="/"
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center gap-3"
          >
            <Image src="/world_cup_trophy.png" alt="World Cup Trophy" width={32} height={32} className="w-8 h-8 object-contain" />
            <span className="font-extrabold text-base tracking-widest bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">
              WC PREDICTOR
            </span>
          </Link>
          {/* Mobile Close Button */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white text-lg p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Sidebar Tabs / Pages */}
        <nav className="flex flex-col gap-1.5 w-full">
          <Link
            href="/"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3.5 text-xs font-black rounded-xl transition-all cursor-pointer ${pathname === '/'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-650/10'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <span className="text-base">📅</span>
            <span>Trận Đấu</span>
          </Link>
          <Link
            href="/outright"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3.5 text-xs font-black rounded-xl transition-all cursor-pointer ${pathname === '/outright'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-650/10'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <span className="text-base">🔮</span>
            <span>Tiên Tri</span>
          </Link>
          <Link
            href="/leaderboard"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3.5 text-xs font-black rounded-xl transition-all cursor-pointer ${pathname === '/leaderboard'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-650/10'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <span className="text-base">📊</span>
            <span>Nhóm</span>
          </Link>
          <Link
            href="/guide"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3.5 text-xs font-black rounded-xl transition-all cursor-pointer ${pathname === '/guide'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-650/10'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <span className="text-base">📖</span>
            <span>Luật Tính Điểm</span>
          </Link>
        </nav>
      </div>

      {/* User Profile & Logout at bottom */}
      {currentUser && (
        <div className="border-t border-slate-800/80 pt-4 mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <Image
              src={getUserAvatar(currentUser.username)}
              alt={currentUser.username}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full border border-slate-750 bg-slate-800 shrink-0"
            />
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs text-slate-200 font-bold truncate">
                {currentUser.username}
              </span>
              <span className="text-[10px] text-slate-500 truncate">
                Người dự đoán
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              handleLogout();
              setIsSidebarOpen(false);
            }}
            className="text-xs bg-slate-800 hover:bg-slate-700/80 p-2 rounded-xl text-rose-500 hover:text-rose-400 font-bold transition-all shrink-0 cursor-pointer"
            title="Đăng xuất"
          >
            🚪
          </button>
        </div>
      )}
    </aside>
  );
}
