import React, { useState, useEffect, useRef } from 'react';

/**
 * Lightweight, 0-dependency smooth counter using requestAnimationFrame.
 * Compatible with React 19 and mobile WebViews without Rollup CJS collision issues.
 */
export default function AnimatedCountUp({
  end = 0,
  duration = 1,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = '',
  preserveValue = false,
  className = '',
}) {
  const [displayValue, setDisplayValue] = useState(() => (preserveValue ? 0 : Number(end) || 0));
  const prevEndRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const target = Number(end) || 0;
    const start = preserveValue ? prevEndRef.current : 0;
    prevEndRef.current = target;

    if (start === target) {
      setDisplayValue(target);
      return;
    }

    const startTime = performance.now();
    const durationMs = Math.max(200, (duration || 1) * 1000);

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // easeOutCubic curve for smooth decelerating finish
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(target);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [end, duration, preserveValue]);

  // Format value with decimals and separator
  const formattedNumber = (() => {
    const fixed = displayValue.toFixed(decimals);
    if (!separator) return fixed;

    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return parts.join('.');
  })();

  return (
    <span className={className}>
      {prefix}
      {formattedNumber}
      {suffix}
    </span>
  );
}
