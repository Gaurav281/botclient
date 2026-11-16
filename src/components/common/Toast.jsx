import React from 'react';
import { useGame } from '../../context/GameContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function Toast() {
  const { toast } = useGame();
  if (!toast) return null;

  const { message, type } = toast;

  let Icon = Info;
  let bg = 'bg-[#1b1b22] border-white/20 text-white';

  if (type === 'success') {
    Icon = CheckCircle2;
    bg = 'bg-[#121c15] border-green-500/30 text-green-300';
  } else if (type === 'error') {
    Icon = AlertCircle;
    bg = 'bg-[#221316] border-red-500/30 text-red-300';
  } else if (type === 'warning') {
    Icon = AlertTriangle;
    bg = 'bg-[#221c13] border-yellow-500/30 text-yellow-300';
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm pointer-events-none animate-fade-in">
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl ${bg}`}>
        <Icon className="w-4 h-4 shrink-0" />
        <span className="text-xs font-semibold leading-snug">{message}</span>
      </div>
    </div>
  );
}
