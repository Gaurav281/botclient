import React, { useState, useEffect } from 'react';
import { CheckCircle2, CircleDot, Circle } from 'lucide-react';

export default function AppLoadingScreen() {
  const [progress, setProgress] = useState(18);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) {
          clearInterval(timer);
          return 98;
        }
        const jump = Math.floor(Math.random() * 12) + 6;
        return Math.min(98, prev + jump);
      });
    }, 180);

    return () => clearInterval(timer);
  }, []);

  const steps = [
    { label: 'Connecting', threshold: 25 },
    { label: 'Signing you in', threshold: 50 },
    { label: 'Loading your balance', threshold: 75 },
    { label: 'Setting up the arena', threshold: 92 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-8 app-dotted-bg text-neutral-900 dark:text-white select-none transition-colors">
      {/* Top spacer */}
      <div className="h-6" />

      {/* Center Logo & Branding matching reference */}
      <div className="flex flex-col items-center justify-center text-center my-auto">
        {/* Orbital Ring Logo */}
        <div className="relative w-36 h-36 flex items-center justify-center mb-6">
          {/* Outer Rotating Ring */}
          <div className="absolute inset-0 rounded-full border border-black/80 dark:border-white/80 animate-spin-slow" />

          {/* Orbiting Star Nodes */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white dark:bg-black border border-black dark:border-white flex items-center justify-center text-[8px]">
            ✦
          </div>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white dark:bg-black border border-black dark:border-white flex items-center justify-center text-[8px]">
            ✦
          </div>
          <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white dark:bg-black border border-black dark:border-white flex items-center justify-center text-[7px]">
            ✦
          </div>

          {/* Inner Circle Badge */}
          <div className="w-24 h-24 rounded-full bg-neutral-100 dark:bg-[#141418] border border-neutral-300 dark:border-white/20 flex flex-col items-center justify-center shadow-lg">
            <span className="font-mono text-xl font-bold tracking-tighter text-neutral-900 dark:text-white">
              (• ‿ •)
            </span>
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
          Firefly Play
        </h1>
        <span className="text-[11px] font-mono font-bold tracking-[0.25em] text-neutral-400 dark:text-neutral-500 uppercase mt-1">
          EARN
        </span>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 font-medium">
          Play games. Finish tasks. Get paid.
        </p>
      </div>

      {/* Bottom Status Checklist & Percentage Number */}
      <div className="w-full max-w-sm mx-auto flex items-end justify-between pt-6 border-t border-neutral-200/60 dark:border-white/5">
        {/* Checklist */}
        <div className="space-y-1.5">
          {steps.map((step, idx) => {
            const isDone = progress >= step.threshold;
            const isCurrent = !isDone && (idx === 0 || progress >= steps[idx - 1].threshold);

            return (
              <div
                key={step.label}
                className={`flex items-center gap-2 text-xs font-semibold transition-colors ${
                  isDone
                    ? 'text-neutral-900 dark:text-white'
                    : isCurrent
                    ? 'text-black dark:text-white font-bold'
                    : 'text-neutral-400 dark:text-neutral-600'
                }`}
              >
                {isDone ? (
                  <div className="w-4 h-4 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px] font-black">
                    ✓
                  </div>
                ) : isCurrent ? (
                  <CircleDot className="w-4 h-4 text-black dark:text-white animate-spin" />
                ) : (
                  <Circle className="w-4 h-4 text-neutral-300 dark:text-neutral-700" />
                )}
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* Big Bold Percentage Number */}
        <div className="text-right">
          <span className="text-4xl sm:text-5xl font-black font-mono tracking-tighter text-neutral-900 dark:text-white">
            {progress}%
          </span>
        </div>
      </div>
    </div>
  );
}
