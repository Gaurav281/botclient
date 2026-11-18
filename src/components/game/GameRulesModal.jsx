import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { api } from '../../services/api';
import { X, ChevronLeft, ChevronRight, Hand } from 'lucide-react';
import { triggerHaptic } from '../../services/telegram';

export default function GameRulesModal() {
  const {
    showRulesModal,
    setShowRulesModal,
    confirmStartGame,
    user,
    setUser,
    rulesGameType,
  } = useGame();

  const [slide, setSlide] = useState(0);
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);

  if (!showRulesModal) return null;

  const isMiniRacing = rulesGameType === 'car_runner' || rulesGameType === 'mini_racing';
  const gameTitle = isMiniRacing ? 'Mini Racing' : 'Asteroid Blaster';

  const handleNext = () => {
    triggerHaptic('selection');
    if (slide < 2) {
      setSlide(slide + 1);
    } else {
      handleDone();
    }
  };

  const handleBack = () => {
    triggerHaptic('selection');
    if (slide > 0) {
      setSlide(slide - 1);
    }
  };

  const handleDone = async () => {
    triggerHaptic('medium');
    setShowRulesModal(false);
    setSlide(0);

    if (doNotShowAgain && !isMiniRacing) {
      try {
        await api.updatePreferences({ doNotShowRules: true });
        if (user) {
          setUser({ ...user, doNotShowRules: true });
        }
      } catch (e) {
        console.warn('Failed saving preference:', e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-[32px] bg-white dark:bg-[#121216] border border-neutral-200 dark:border-white/10 p-5 sm:p-6 text-neutral-900 dark:text-white shadow-2xl relative">
        {/* Header (Matching Reference Images 1, 2, 3) */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-neutral-100 dark:bg-white/10 px-2.5 py-0.5 text-xs text-neutral-600 dark:text-neutral-300 font-medium">
              How to play
            </span>
            <span className="text-sm font-bold text-neutral-900 dark:text-white">
              {gameTitle}
            </span>
          </div>
          <button
            onClick={() => {
              setShowRulesModal(false);
              setSlide(0);
            }}
            className="p-1 rounded-full text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= MINI RACING RULES SLIDES ================= */}
        {isMiniRacing ? (
          <>
            {/* Slide 1: Highway Graphic & Swipe/Tap Gesture (Matching Reference Image 1) */}
            {slide === 0 && (
              <div className="py-4 text-center animate-fade-in">
                <div className="relative mx-auto mb-3.5 h-44 w-full rounded-2xl bg-neutral-950 border border-white/5 flex flex-col items-center justify-center overflow-hidden">
                  {/* Subtle dots inside */}
                  <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

                  {/* 3 Highway Lanes */}
                  <div className="relative w-44 h-full flex justify-between items-center px-4">
                    {/* Lane divider 1 */}
                    <div className="h-full w-px border-r border-dashed border-white/20" />
                    {/* Lane divider 2 */}
                    <div className="h-full w-px border-r border-dashed border-white/20" />

                    {/* Opponent car left */}
                    <div className="absolute top-8 left-5 w-8 h-14 rounded-lg bg-neutral-800 border border-neutral-700" />
                    {/* Opponent car right */}
                    <div className="absolute top-6 right-5 w-8 h-14 rounded-lg bg-neutral-800 border border-neutral-700" />

                    {/* Player White Car in center */}
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center">
                      {/* Finger Tap Icon with "Swipe or tap a side" pill */}
                      <div className="relative mb-2">
                        <div className="absolute -left-6 -top-3 text-white">
                          <Hand className="w-6 h-6 fill-white text-black drop-shadow-md" />
                        </div>
                        <span className="px-3 py-1 rounded-full bg-black/80 border border-white/20 text-[10px] font-bold text-white shadow-lg whitespace-nowrap">
                          Swipe or tap a side
                        </span>
                      </div>
                      <div className="w-9 h-16 rounded-xl bg-white shadow-2xl" />
                    </div>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Dodge traffic, hit the checkpoints
                </h4>
              </div>
            )}

            {/* Slide 2: 3 Step Rules (Matching Reference Image 2) */}
            {slide === 1 && (
              <div className="py-4 space-y-2.5 animate-fade-in text-left">
                <div className="flex items-start gap-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900/80 p-3.5 border border-neutral-200 dark:border-white/5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold font-mono">
                    1
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">
                      Swipe or tap a side to change lanes
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900/80 p-3.5 border border-neutral-200 dark:border-white/5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold font-mono">
                    2
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">
                      Drive through checkpoints: +15 each
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900/80 p-3.5 border border-neutral-200 dark:border-white/5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold font-mono">
                    3
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">
                      A crash costs a life; the race runs 90 seconds
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Slide 3: Pro Tips & Difficulty Perks (Matching Reference Image 3) */}
            {slide === 2 && (
              <div className="py-3 animate-fade-in text-left space-y-3">
                <div className="space-y-1.5 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed px-1">
                  <p>• Watch two cars ahead, not just the next one</p>
                  <p>• Checkpoints sit in the open lane: aim for them</p>
                  <p>• The road speeds up over the race</p>
                </div>

                <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-900/80 p-3.5 border border-neutral-200 dark:border-white/5 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900 dark:text-white">Easy</span>
                    <span className="text-neutral-600 dark:text-neutral-400">3 lanes, 3 lives</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900 dark:text-white">Normal</span>
                    <span className="text-neutral-600 dark:text-neutral-400">4 lanes, 2 lives</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900 dark:text-white">Hard</span>
                    <span className="text-neutral-600 dark:text-neutral-400">Fast traffic, 1 life</span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ================= ASTEROID BLASTER RULES SLIDES ================= */
          <>
            {/* Slide 1: Controls & Boundary */}
            {slide === 0 && (
              <div className="py-4 text-center animate-fade-in">
                <div className="relative mx-auto mb-4 h-44 w-full rounded-2xl bg-neutral-950 border border-white/5 flex flex-col items-center justify-end pb-5 overflow-hidden">
                  <div className="absolute top-5 left-8 h-9 w-9 rounded-full border border-neutral-700 bg-neutral-800/40" />
                  <div className="absolute top-10 right-10 h-6 w-6 rounded-full border border-neutral-700 bg-neutral-800/40" />
                  <div className="h-16 w-0.5 border-r border-dashed border-white/40 mb-2" />
                  <div className="absolute bottom-14 left-4 right-4 border-b border-dashed border-white/20" />

                  <div className="relative z-10 flex flex-col items-center">
                    <svg className="w-8 h-8 text-white drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L3 22l9-3 9 3L12 2z" />
                    </svg>
                    <span className="mt-2 text-xs font-semibold text-neutral-300">Drag left and right</span>
                  </div>
                </div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Blast enemy squadrons and the boss</h4>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Drag left and right to steer. Flight is focused within the combat zone.
                </p>
              </div>
            )}

            {/* Slide 2: 3 Simple Rules */}
            {slide === 1 && (
              <div className="py-4 space-y-2.5 animate-fade-in text-left">
                <div className="flex items-start gap-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900/80 p-3 border border-neutral-200 dark:border-white/5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold font-mono">
                    1
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-neutral-200">Drag to fly; your guns fire on their own</p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Focus on dodging incoming enemy fire.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900/80 p-3 border border-neutral-200 dark:border-white/5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold font-mono">
                    2
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-neutral-200">Shoot down squadrons and catch upgrades</p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">All enemies fire! Catch weapon and shield boosts.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900/80 p-3 border border-neutral-200 dark:border-white/5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold font-mono">
                    3
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-neutral-200">Destroy the mothership at the end for +200 bonus</p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Watch sponsor ad to claim your 200 Boss Coins.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Slide 3: Upgrades Breakdown */}
            {slide === 2 && (
              <div className="py-3 animate-fade-in text-left">
                <div className="grid grid-cols-2 gap-2 text-xs mb-2.5">
                  <div className="flex items-center gap-2 rounded-xl bg-neutral-100 dark:bg-neutral-900/90 p-2 border border-neutral-200 dark:border-cyan-500/20">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-cyan-500/20 text-cyan-500 font-bold text-[10px]">2x</span>
                    <span className="text-neutral-800 dark:text-neutral-300 font-semibold text-[11px]">Double guns</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-neutral-100 dark:bg-neutral-900/90 p-2 border border-neutral-200 dark:border-green-500/20">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-green-500/20 text-green-500 font-bold text-[10px]">3x</span>
                    <span className="text-neutral-800 dark:text-neutral-300 font-semibold text-[11px]">Triple guns</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-neutral-100 dark:bg-neutral-900/90 p-2 border border-neutral-200 dark:border-purple-500/20">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-500/20 text-purple-500 font-bold text-[10px]">S</span>
                    <span className="text-neutral-800 dark:text-neutral-300 font-semibold text-[11px]">Spread fan of 5</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-neutral-100 dark:bg-neutral-900/90 p-2 border border-neutral-200 dark:border-blue-500/20">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-500/20 text-blue-500 font-bold text-[10px]">D</span>
                    <span className="text-neutral-800 dark:text-neutral-300 font-semibold text-[11px]">Support drones</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-neutral-100 dark:bg-neutral-900/90 p-2 border border-neutral-200 dark:border-cyan-400/20">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-cyan-400/20 text-cyan-500 font-bold text-[10px]">🛡️</span>
                    <span className="text-neutral-800 dark:text-neutral-300 font-semibold text-[11px]">Blocks one hit</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-neutral-100 dark:bg-neutral-900/90 p-2 border border-neutral-200 dark:border-pink-500/20">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-pink-500/20 text-pink-500 font-bold text-[10px]">♥</span>
                    <span className="text-neutral-800 dark:text-neutral-300 font-semibold text-[11px]">An extra life</span>
                  </div>
                </div>

                <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900/60 p-2.5 text-[10px] text-neutral-600 dark:text-neutral-400 space-y-0.5 mb-2">
                  <p>• Scouts 10 · fighters 30 · bombers 70 · mothership 600</p>
                  <p>• Losing a life costs your gun upgrade</p>
                  <p>• The mothership gets angrier as its health drops</p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-neutral-700 dark:text-neutral-300">
                  <input
                    type="checkbox"
                    checked={doNotShowAgain}
                    onChange={(e) => setDoNotShowAgain(e.target.checked)}
                    className="rounded border-neutral-300 dark:border-neutral-700 text-black dark:text-white focus:ring-0"
                  />
                  <span>Do not show rules again</span>
                </label>
              </div>
            )}
          </>
        )}

        {/* Carousel Dots */}
        <div className="flex justify-center gap-1.5 py-2">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                slide === idx
                  ? 'w-5 bg-black dark:bg-white'
                  : 'w-1.5 bg-neutral-300 dark:bg-neutral-700'
              }`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2 pt-1">
          {slide > 0 ? (
            <button
              onClick={handleBack}
              className="flex-1 btn-secondary-dark py-3 rounded-2xl text-xs flex items-center justify-center gap-1 font-bold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setShowRulesModal(false);
                setSlide(0);
              }}
              className="flex-1 btn-secondary-dark py-3 rounded-2xl text-xs font-semibold"
            >
              Close
            </button>
          )}

          <button
            onClick={handleNext}
            className="flex-1 btn-primary-white py-3 rounded-2xl text-xs flex items-center justify-center gap-1 font-bold shadow-lg"
          >
            <span>{slide === 2 ? 'Got it' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
