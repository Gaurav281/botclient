import React, { useState, useEffect } from 'react';
import { sound } from '../../services/audio';
import { triggerHaptic } from '../../services/telegram';

export default function CountdownOverlay({ onComplete }) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    sound.playCountdownBeep(false);
    triggerHaptic('medium');

    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev === 1) {
          sound.playCountdownBeep(true);
          triggerHaptic('heavy');
          return 'GO!';
        } else if (prev === 'GO!') {
          clearInterval(interval);
          if (onComplete) onComplete();
          return null;
        } else {
          sound.playCountdownBeep(false);
          triggerHaptic('medium');
          return prev - 1;
        }
      });
    }, 900);

    return () => clearInterval(interval);
  }, [onComplete]);

  if (!count) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none select-none">
      <div className="text-center animate-bounce">
        <span className="font-mono text-8xl font-black tracking-tight text-white drop-shadow-[0_0_35px_rgba(255,255,255,0.7)]">
          {count}
        </span>
      </div>
    </div>
  );
}
