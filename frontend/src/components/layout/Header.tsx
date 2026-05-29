import React from 'react';
import { getUserAvatar } from '@/utils/avatar';
import Image from 'next/image';

interface HeaderProps {
  setIsSidebarOpen: (open: boolean) => void;
  currentUser: any;
}

export function Header({ setIsSidebarOpen, currentUser }: HeaderProps) {
  return (
    <header className="flex md:hidden items-center justify-between bg-slate-900 px-4 py-3 border-b border-slate-800/80 shrink-0">
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="text-xl p-2 bg-slate-850 hover:bg-slate-800 rounded-xl text-slate-200 cursor-pointer transition-colors"
      >
        ☰
      </button>
      <div className="flex items-center gap-2">
        <Image src="/world_cup_trophy.png" alt="World Cup Trophy" width={24} height={24} className="w-6 h-6 object-contain" />
        <span className="font-extrabold text-sm tracking-widest bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">
          WC PREDICTOR
        </span>
      </div>
      {currentUser ? (
        <Image
          src={getUserAvatar(currentUser.username)}
          alt={currentUser.username}
          width={28}
          height={28}
          className="w-7 h-7 rounded-full border border-slate-700 bg-slate-855 cursor-pointer"
          onClick={() => setIsSidebarOpen(true)}
        />
      ) : (
        <div className="w-7 h-7" />
      )}
    </header>
  );
}
