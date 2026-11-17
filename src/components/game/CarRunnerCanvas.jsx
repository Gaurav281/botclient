import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import { triggerHaptic } from '../../services/telegram';
import { sound } from '../../services/audio';
import { Pause, Play, X, Heart, Shield, Gem } from 'lucide-react';

export default function CarRunnerCanvas() {
  const canvasRef = useRef(null);
  const { handleGameEnd, switchTab, isPlaying, setIsPlaying } = useGame();
  const [isPaused, setIsPaused] = useState(false);
  const [lives, setLives] = useState(3);
  const [diamonds, setDiamonds] = useState(0);
  const [score, setScore] = useState(0);

  // References to keep game loop in sync
  const isPausedRef = useRef(false);
  isPausedRef.current = isPaused;

  const gameStateRef = useRef({
    running: true,
    score: 0,
    diamonds: 0,
    lives: 3,
    invulnerableTime: 0,
    baseSpeed: 280, // Pixels per second
    speedMultiplier: 1.0,
    roadOffset: 0,
    playerLane: 1, // 0: Left, 1: Center, 2: Right
    playerX: 0,
    playerY: 0,
    playerWidth: 42,
    playerHeight: 74,
    lanePositions: [0, 0, 0],
    traffic: [],
    diamondsList: [],
    particles: [],
    floatTexts: [],
    spawnTrafficTimer: 0,
    spawnDiamondTimer: 0,
    lastTime: 0,
    shake: 0,
  });

  // Toggle Pause
  const togglePause = useCallback(() => {
    triggerHaptic('medium');
    setIsPaused((prev) => !prev);
  }, []);

  // Exit Game
  const handleExit = useCallback(() => {
    triggerHaptic('medium');
    setIsPlaying(false);
    switchTab('arena');
  }, [setIsPlaying, switchTab]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    const state = gameStateRef.current;

    // Handle screen resize
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);

      // Setup 3 lanes
      const laneWidth = width / 3;
      state.lanePositions = [
        laneWidth * 0.5,
        laneWidth * 1.5,
        laneWidth * 2.5,
      ];

      state.playerX = state.lanePositions[state.playerLane];
      state.playerY = height - 120;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Controls: Tap on lane to switch
    const handleTap = (clientX) => {
      if (isPausedRef.current || !state.running) return;
      const width = window.innerWidth;
      const laneWidth = width / 3;

      let targetLane = 1;
      if (clientX < laneWidth) {
        targetLane = 0;
      } else if (clientX > laneWidth * 2) {
        targetLane = 2;
      } else {
        targetLane = 1;
      }

      if (targetLane !== state.playerLane) {
        state.playerLane = targetLane;
        triggerHaptic('light');
        sound.playLaser();
      }
    };

    const handlePointerDown = (e) => {
      handleTap(e.clientX);
    };

    // Keyboard controls (A/D or Arrows)
    const handleKeyDown = (e) => {
      if (isPausedRef.current || !state.running) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (state.playerLane > 0) {
          state.playerLane -= 1;
          triggerHaptic('light');
          sound.playLaser();
        }
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (state.playerLane < 2) {
          state.playerLane += 1;
          triggerHaptic('light');
          sound.playLaser();
        }
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    // Touch swipe support
    let touchStartX = 0;
    const handleTouchStart = (e) => {
      if (e.touches && e.touches[0]) {
        touchStartX = e.touches[0].clientX;
      }
    };

    const handleTouchEnd = (e) => {
      if (isPausedRef.current || !state.running) return;
      if (e.changedTouches && e.changedTouches[0]) {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(deltaX) > 40) {
          if (deltaX < 0 && state.playerLane > 0) {
            state.playerLane -= 1;
            triggerHaptic('light');
            sound.playLaser();
          } else if (deltaX > 0 && state.playerLane < 2) {
            state.playerLane += 1;
            triggerHaptic('light');
            sound.playLaser();
          }
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    // Particle effect creator
    const spawnParticles = (x, y, color, count = 10, speed = 120) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = (Math.random() * 0.7 + 0.3) * speed;
        state.particles.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          color,
          radius: Math.random() * 3 + 2,
          life: 0.6,
          maxLife: 0.6,
        });
      }
    };

    state.lastTime = performance.now();

    // ================= MAIN GAME LOOP =================
    const loop = (currentTime) => {
      animationFrameId = requestAnimationFrame(loop);

      const dt = Math.min((currentTime - state.lastTime) / 1000, 0.1);
      state.lastTime = currentTime;

      if (isPausedRef.current || !state.running) return;

      const width = window.innerWidth;
      const height = window.innerHeight;

      // Update Screen Shake
      if (state.shake > 0) {
        state.shake -= dt * 10;
        if (state.shake < 0) state.shake = 0;
      }

      // Update Speed & Score
      state.speedMultiplier = 1.0 + Math.min(state.score / 2000, 1.2);
      const currentRoadSpeed = state.baseSpeed * state.speedMultiplier;
      state.roadOffset = (state.roadOffset + currentRoadSpeed * dt) % 60;
      state.score += dt * 18 * state.speedMultiplier;

      // Invulnerability countdown
      if (state.invulnerableTime > 0) {
        state.invulnerableTime -= dt;
      }

      // Smooth Car X interpolation toward target lane
      const targetX = state.lanePositions[state.playerLane];
      state.playerX += (targetX - state.playerX) * 16 * dt;

      // Spawn Exhaust Flame particles
      if (Math.random() < 0.65) {
        state.particles.push({
          x: state.playerX + (Math.random() * 8 - 4),
          y: state.playerY + state.playerHeight * 0.45,
          vx: (Math.random() - 0.5) * 20,
          vy: currentRoadSpeed * 0.4,
          color: Math.random() < 0.5 ? '#06b6d4' : '#3b82f6',
          radius: Math.random() * 3 + 1.5,
          life: 0.35,
          maxLife: 0.35,
        });
      }

      // ================= SPAWN TRAFFIC CARS =================
      state.spawnTrafficTimer += dt;
      const trafficInterval = Math.max(1.0, 2.0 - state.speedMultiplier * 0.4);

      if (state.spawnTrafficTimer > trafficInterval) {
        state.spawnTrafficTimer = 0;

        // Choose 1 or 2 lanes for traffic (NEVER all 3, so there is always a free path!)
        const availableLanes = [0, 1, 2];
        const numCars = Math.random() < 0.45 ? 2 : 1;
        const shuffled = availableLanes.sort(() => Math.random() - 0.5);
        const chosenLanes = shuffled.slice(0, numCars);

        const carColors = ['#f43f5e', '#eab308', '#8b5cf6', '#10b981', '#f97316'];

        chosenLanes.forEach((lane) => {
          const color = carColors[Math.floor(Math.random() * carColors.length)];
          state.traffic.push({
            lane,
            x: state.lanePositions[lane],
            y: -100 - Math.random() * 40,
            width: 40,
            height: 70,
            color,
            speed: currentRoadSpeed * 0.42, // Moves slower than road
          });
        });
      }

      // ================= SPAWN DIAMONDS =================
      state.spawnDiamondTimer += dt;
      if (state.spawnDiamondTimer > 1.4) {
        state.spawnDiamondTimer = 0;
        const randomLane = Math.floor(Math.random() * 3);
        state.diamondsList.push({
          lane: randomLane,
          x: state.lanePositions[randomLane],
          y: -50,
          radius: 16,
          rotation: 0,
        });
      }

      // ================= UPDATE TRAFFIC =================
      for (let i = state.traffic.length - 1; i >= 0; i--) {
        const car = state.traffic[i];
        car.y += (currentRoadSpeed - car.speed) * dt;

        // Collision with player car
        const dx = Math.abs(state.playerX - car.x);
        const dy = Math.abs(state.playerY - car.y);

        if (dx < (state.playerWidth + car.width) * 0.42 && dy < (state.playerHeight + car.height) * 0.42) {
          if (state.invulnerableTime <= 0) {
            // Crash!
            state.lives -= 1;
            state.invulnerableTime = 1.6;
            state.shake = 12;
            triggerHaptic('heavy');
            sound.playExplosion(false);
            spawnParticles(state.playerX, state.playerY, '#ef4444', 24, 200);

            // Remove crashing traffic car
            state.traffic.splice(i, 1);

            if (state.lives <= 0) {
              // Game Over
              state.running = false;
              handleGameEnd({
                score: Math.round(state.score),
                kills: state.diamonds, // Report collected diamonds as kills
                bossKilled: false,
              });
              return;
            }
            continue;
          }
        }

        // Remove offscreen cars
        if (car.y > height + 100) {
          state.traffic.splice(i, 1);
        }
      }

      // ================= UPDATE DIAMONDS =================
      for (let i = state.diamondsList.length - 1; i >= 0; i--) {
        const dia = state.diamondsList[i];
        dia.y += currentRoadSpeed * dt;
        dia.rotation += dt * 3.5;

        // Collection detection
        const dx = Math.abs(state.playerX - dia.x);
        const dy = Math.abs(state.playerY - dia.y);

        if (dx < (state.playerWidth + dia.radius * 2) * 0.45 && dy < (state.playerHeight + dia.radius * 2) * 0.45) {
          // Collected!
          state.diamonds += 1;
          state.score += 50;
          triggerHaptic('medium');
          sound.playPowerup();

          spawnParticles(dia.x, dia.y, '#38bdf8', 16, 140);
          state.floatTexts.push({
            x: dia.x,
            y: dia.y,
            text: '+50 💎',
            color: '#38bdf8',
            life: 0.8,
          });

          state.diamondsList.splice(i, 1);
          continue;
        }

        if (dia.y > height + 60) {
          state.diamondsList.splice(i, 1);
        }
      }

      // Update Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) state.particles.splice(i, 1);
      }

      // Update Float Texts
      for (let i = state.floatTexts.length - 1; i >= 0; i--) {
        const ft = state.floatTexts[i];
        ft.y -= dt * 45;
        ft.life -= dt;
        if (ft.life <= 0) state.floatTexts.splice(i, 1);
      }

      // Sync React state periodically
      setLives(state.lives);
      setDiamonds(state.diamonds);
      setScore(Math.round(state.score));

      // ================= RENDER =================
      ctx.save();

      // Screen Shake offset
      if (state.shake > 0) {
        const shakeX = (Math.random() - 0.5) * state.shake;
        const shakeY = (Math.random() - 0.5) * state.shake;
        ctx.translate(shakeX, shakeY);
      }

      // 1. Draw Asphalt Road Background
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, width, height);

      // Subtle side shoulders / curbs
      ctx.fillStyle = '#14141d';
      ctx.fillRect(0, 0, 14, height);
      ctx.fillRect(width - 14, 0, 14, height);

      // Curb hazard lines
      const hazardStep = 40;
      for (let y = (state.roadOffset % hazardStep) - hazardStep; y < height; y += hazardStep) {
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(0, y, 12, hazardStep / 2);
        ctx.fillRect(width - 12, y, 12, hazardStep / 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, y + hazardStep / 2, 12, hazardStep / 2);
        ctx.fillRect(width - 12, y + hazardStep / 2, 12, hazardStep / 2);
      }

      // 2. Draw Lane Dividers (Dashed glowing lines)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 3.5;
      ctx.setLineDash([28, 28]);
      ctx.lineDashOffset = -state.roadOffset * 1.5;

      const laneWidth = width / 3;
      // Divider 1
      ctx.beginPath();
      ctx.moveTo(laneWidth, 0);
      ctx.lineTo(laneWidth, height);
      ctx.stroke();

      // Divider 2
      ctx.beginPath();
      ctx.moveTo(laneWidth * 2, 0);
      ctx.lineTo(laneWidth * 2, height);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      // 3. Draw Diamonds 💎
      state.diamondsList.forEach((dia) => {
        ctx.save();
        ctx.translate(dia.x, dia.y);
        ctx.rotate(dia.rotation);

        // Outer glow
        const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 22);
        glow.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
        glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();

        // Diamond Poly Shape
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(13, 0);
        ctx.lineTo(0, 15);
        ctx.lineTo(-13, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner Facet Highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(6, 0);
        ctx.lineTo(0, 7);
        ctx.lineTo(-6, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      });

      // 4. Draw Traffic Cars
      state.traffic.forEach((car) => {
        ctx.save();
        ctx.translate(car.x, car.y);

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.roundRect(-car.width / 2 + 3, -car.height / 2 + 5, car.width, car.height, 8);
        ctx.fill();

        // Car Body
        ctx.fillStyle = car.color;
        ctx.beginPath();
        ctx.roundRect(-car.width / 2, -car.height / 2, car.width, car.height, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Roof & Windshields
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        // Front Windshield (facing down since incoming)
        ctx.roundRect(-car.width * 0.35, car.height * 0.05, car.width * 0.7, car.height * 0.28, 4);
        ctx.fill();
        // Rear Windshield
        ctx.beginPath();
        ctx.roundRect(-car.width * 0.32, -car.height * 0.35, car.width * 0.64, car.height * 0.22, 4);
        ctx.fill();

        // Headlights (Facing downward towards player)
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#fde047';
        ctx.shadowBlur = 8;
        ctx.fillRect(-car.width * 0.42, car.height * 0.42, 8, 4);
        ctx.fillRect(car.width * 0.42 - 8, car.height * 0.42, 8, 4);
        ctx.shadowBlur = 0;

        ctx.restore();
      });

      // 5. Draw Player Car
      ctx.save();
      ctx.translate(state.playerX, state.playerY);

      // Flickering if invulnerable
      if (state.invulnerableTime <= 0 || Math.floor(currentTime / 70) % 2 === 0) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.roundRect(-state.playerWidth / 2 + 3, -state.playerHeight / 2 + 6, state.playerWidth, state.playerHeight, 10);
        ctx.fill();

        // Headlight Beams illuminating the road forward
        const beamGrad = ctx.createLinearGradient(0, 0, 0, -180);
        beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.3)');
        beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(-state.playerWidth * 0.4, -state.playerHeight * 0.45);
        ctx.lineTo(-state.playerWidth * 0.9, -180);
        ctx.lineTo(state.playerWidth * 0.9, -180);
        ctx.lineTo(state.playerWidth * 0.4, -state.playerHeight * 0.45);
        ctx.closePath();
        ctx.fill();

        // Car Body (High-tech Neon Cyan Sports Car)
        const carGrad = ctx.createLinearGradient(-state.playerWidth / 2, 0, state.playerWidth / 2, 0);
        carGrad.addColorStop(0, '#0284c7');
        carGrad.addColorStop(0.5, '#38bdf8');
        carGrad.addColorStop(1, '#0284c7');

        ctx.fillStyle = carGrad;
        ctx.beginPath();
        ctx.roundRect(-state.playerWidth / 2, -state.playerHeight / 2, state.playerWidth, state.playerHeight, 10);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Aerodynamic hood lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-state.playerWidth * 0.25, -state.playerHeight * 0.45);
        ctx.lineTo(-state.playerWidth * 0.15, -state.playerHeight * 0.15);
        ctx.moveTo(state.playerWidth * 0.25, -state.playerHeight * 0.45);
        ctx.lineTo(state.playerWidth * 0.15, -state.playerHeight * 0.15);
        ctx.stroke();

        // Front Windshield
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(-state.playerWidth * 0.35, -state.playerHeight * 0.32, state.playerWidth * 0.7, state.playerHeight * 0.28, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.stroke();

        // Roof
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(-state.playerWidth * 0.28, -state.playerHeight * 0.08, state.playerWidth * 0.56, state.playerHeight * 0.22, 3);
        ctx.fill();

        // Headlights (Cyan Neon Beams forward)
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.fillRect(-state.playerWidth * 0.44, -state.playerHeight * 0.48, 8, 4);
        ctx.fillRect(state.playerWidth * 0.44 - 8, -state.playerHeight * 0.48, 8, 4);

        // Rear Taillights (Red Neon)
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.fillRect(-state.playerWidth * 0.4, state.playerHeight * 0.46, 8, 3.5);
        ctx.fillRect(state.playerWidth * 0.4 - 8, state.playerHeight * 0.46, 8, 3.5);
        ctx.shadowBlur = 0;
      }

      ctx.restore();

      // 6. Draw Particles
      state.particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 7. Draw Float Texts
      state.floatTexts.forEach((ft) => {
        ctx.save();
        ctx.globalAlpha = ft.life;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      ctx.restore();
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleGameEnd]);

  return (
    <div className="fixed inset-0 select-none overflow-hidden bg-black touch-none">
      {/* Game Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-5 flex items-center justify-between pointer-events-none z-10">
        {/* Score & Diamonds */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono font-bold text-neutral-400">Score</span>
            <span className="text-base font-black text-white font-mono">{score}</span>
          </div>

          <div className="px-3 py-1.5 rounded-2xl bg-black/60 backdrop-blur-md border border-cyan-500/30 flex items-center gap-1.5">
            <Gem className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
            <span className="text-sm font-black text-cyan-400 font-mono">{diamonds}</span>
          </div>
        </div>

        {/* Lives & Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Hearts */}
          <div className="px-2.5 py-1.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1">
            {[1, 2, 3].map((h) => (
              <Heart
                key={h}
                className={`w-4 h-4 transition-colors ${
                  h <= lives ? 'text-rose-500 fill-rose-500' : 'text-neutral-600'
                }`}
              />
            ))}
          </div>

          {/* Pause */}
          <button
            onClick={togglePause}
            className="h-9 w-9 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* Exit */}
          <button
            onClick={handleExit}
            className="h-9 w-9 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white active:scale-90 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subtle Bottom Controls Hint */}
      <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none opacity-40 text-[11px] font-mono text-neutral-400">
        Tap Left, Center, or Right lane to steer
      </div>

      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="text-center p-6 glass-card rounded-3xl max-w-xs w-full mx-4 border border-white/10">
            <h3 className="text-2xl font-black text-white mb-2">Game Paused</h3>
            <p className="text-xs text-neutral-400 mb-6 font-medium">Take a breath and hit resume!</p>
            <div className="space-y-3">
              <button
                onClick={togglePause}
                className="w-full btn-primary-white py-3 rounded-2xl text-xs font-black shadow-lg"
              >
                Resume Run
              </button>
              <button
                onClick={handleExit}
                className="w-full btn-secondary-dark py-3 rounded-2xl text-xs font-bold"
              >
                Exit to Arena
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}