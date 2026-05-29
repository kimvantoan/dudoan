import React, { useState, useEffect } from 'react';

interface MatchCountdownProps {
  startTime: string;
  onLock: () => void;
}

export function MatchCountdown({ startTime, onLock }: MatchCountdownProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const matchTime = new Date(startTime).getTime();
      const lockTime = matchTime - 15 * 60 * 1000; // Khóa trước 15 phút
      const now = new Date().getTime();
      const difference = lockTime - now;

      if (difference <= 0) {
        setTimeLeft('ĐÃ KHÓA KÈO');
        setIsLocked(true);
        onLock();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      let timeString = '';
      if (days > 0) timeString += `${days}n `;
      timeString += `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      setTimeLeft(timeString);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [startTime, onLock]);

  return (
    <div className={`text-xs font-semibold px-2 py-1 rounded-full ${isLocked ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'}`}>
      {timeLeft === 'ĐÃ KHÓA KÈO' ? '🔒 Đã khóa' : `⏳ Khóa sau: ${timeLeft}`}
    </div>
  );
}
