import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { sound } from '../../services/audio';
import { triggerHaptic } from '../../services/telegram';
import { api } from '../../services/api';
import { ChevronLeft, X, Volume2, VolumeX, Pause, Play, Maximize2, Minimize2 } from 'lucide-react';

export default function AsteroidBlasterCanvas() {
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const navigate = useNavigate();
  const {
    difficulty,
    handleGameEnd,
    setIsPlaying,
    theme,
    activeTournament,
    setActiveTournament,
    showToast,
  } = useGame();

  const [countdownNum, setCountdownNum] = useState(3);
  const [isCountingDown, setIsCountingDown] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [soundOn, setSoundOn] = useState(sound.enabled);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [hudState, setHudState] = useState({
    score: 0,
    lives: 3,
    gun: 'Blaster',
    bossTimer: 60,
    bossActive: false,
    bossHpPercent: 100,
    bossPhase: 1,
    activeBoosts: [],
  });

  const gameStateRef = useRef(null);

  // Exit Game: If tournament match, count attempt, submit score and return to tournaments category
  const handleExit = useCallback(async () => {
    triggerHaptic('medium');
    const state = gameStateRef.current;
    if (state) state.gameOver = true;

    if (activeTournament) {
      const finalScore = state ? Math.round(state.score) : 0;
      const finalKills = state ? state.enemiesKilled : 0;

      try {
        await api.submitTournamentScore(activeTournament._id, finalScore);
        showToast(`Attempt counted & Score: ${finalScore} submitted!`, 'success');
      } catch (err) {
        console.warn('Error submitting tournament score on quit:', err);
      }

      try {
        await api.finishGame({
          score: finalScore,
          enemiesKilled: finalKills,
          bossKilled: false,
          difficulty,
          isTournament: true,
          gameType: 'asteroid_blaster',
        });
      } catch (fErr) {
        console.warn('Error recording tournament finish on quit:', fErr);
      }

      setIsPlaying(false);
      setActiveTournament(null);
      sessionStorage.setItem('preferred_task_cat', 'tournaments');
      navigate('/tasks');
    } else {
      setIsPlaying(false);
      navigate('/arena/asteroid-blaster');
    }
  }, [activeTournament, difficulty, setIsPlaying, setActiveTournament, showToast, navigate]);

  // Toggle Sound
  const toggleSound = () => {
    triggerHaptic('light');
    const newVal = !soundOn;
    setSoundOn(newVal);
    sound.setEnabled(newVal);
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    triggerHaptic('light');
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // 3, 2, 1, GO Countdown
  useEffect(() => {
    sound.playCountdownBeep(false);
    triggerHaptic('medium');

    const timer = setInterval(() => {
      setCountdownNum((prev) => {
        if (prev === 1) {
          sound.playCountdownBeep(true);
          triggerHaptic('heavy');
          return 'GO';
        } else if (prev === 'GO') {
          clearInterval(timer);
          setIsCountingDown(false);
          return null;
        } else {
          sound.playCountdownBeep(false);
          triggerHaptic('medium');
          return prev - 1;
        }
      });
    }, 900);

    return () => clearInterval(timer);
  }, []);

  // Initialize Game Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let initialLives = 3;
    let bossHpMax = 180;
    if (difficulty === 'easy') {
      initialLives = 4;
      bossHpMax = 130;
    } else if (difficulty === 'hard') {
      initialLives = 2;
      bossHpMax = 250;
    }

    const state = {
      width: canvas.width,
      height: canvas.height,
      score: 0,
      lives: initialLives,
      maxLives: initialLives,
      kills: 0,
      gameOver: false,
      bossKilled: false,
      bossActive: false,
      bossTimer: 60, // 60s as in reference image
      boss: null,

      // Player Craft (strictly anchored at bottom 55px, drag left and right)
      player: {
        x: (canvas.width || 360) / 2,
        y: (canvas.height || 640) - 55,
        radius: 16,
        targetX: (canvas.width || 360) / 2,
        targetY: (canvas.height || 640) - 55,
        invulnerableTimer: 0,
      },

      weaponBoost: null,
      utilityBoost: null,

      bullets: [],
      enemyBullets: [],
      enemies: [],
      powerups: [],
      particles: [],
      floatTexts: [],
      stars: [],

      lastPlayerShot: 0,
      playerFireRate: 180,
      spawnEnemyTimer: 0,
      lastPowerupTime: 0,
    };

    // Stars
    for (let i = 0; i < 70; i++) {
      state.stars.push({
        x: Math.random() * (canvas.width || 360),
        y: Math.random() * (canvas.height || 600),
        size: Math.random() * 1.8 + 0.6,
        speed: Math.random() * 0.7 + 0.3,
        alpha: Math.random() * 0.7 + 0.3,
      });
    }

    gameStateRef.current = state;

    // Responsive Canvas Resize
    const handleResize = () => {
      if (!canvasContainerRef.current || !canvasRef.current) return;
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      state.width = rect.width;
      state.height = rect.height;

      const bottomY = rect.height - 55;
      state.player.x = rect.width / 2;
      state.player.targetX = rect.width / 2;
      state.player.y = bottomY;
      state.player.targetY = bottomY;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [difficulty]);

  // Touch and Mouse Controls: strictly horizontal movement (Drag Left & Right)
  const handlePointerMove = useCallback((e) => {
    const state = gameStateRef.current;
    if (!state || state.gameOver) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;

    state.player.targetX = Math.max(22, Math.min(x, state.width - 22));
    state.player.targetY = state.height - 55;
  }, []);

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    let animationId;
    let lastTime = performance.now();

    const loop = (currentTime) => {
      animationId = requestAnimationFrame(loop);

      const state = gameStateRef.current;
      const canvas = canvasRef.current;
      if (!state || !canvas || isPaused) return;

      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const ctx = canvas.getContext('2d');
      const { width, height } = state;

      // Update Stars
      for (const s of state.stars) {
        s.y += s.speed;
        if (s.y > height) {
          s.y = 0;
          s.x = Math.random() * width;
        }
      }

      // If in countdown, only render cosmic background, player, and stars
      if (isCountingDown) {
        ctx.clearRect(0, 0, width, height);
        renderCosmicBackground(ctx, state, width, height, currentTime);
        drawPlayerCraft(ctx, state);
        return;
      }

      // --- 1. UPDATE PHYSICS & LOGIC ---

      // Update Boss Countdown Timer
      if (!state.bossActive && !state.bossKilled) {
        state.bossTimer -= dt;
        if (state.bossTimer <= 0) {
          state.bossTimer = 0;
          state.bossActive = true;
          // Clear all existing normal enemies when boss arrives!
          state.enemies = [];
          sound.playBossSiren();
          triggerHaptic('heavy');

          const hp = difficulty === 'hard' ? 250 : difficulty === 'easy' ? 130 : 180;
          state.boss = {
            x: width / 2,
            y: -70,
            targetY: 85,
            hp,
            maxHp: hp,
            phase: 1,
            speedX: 65,
            dirX: 1,
            shootTimer: 0,
            deployTimer: 0,
          };
        }
      }

      if (state.player.invulnerableTimer > 0) {
        state.player.invulnerableTimer -= dt;
      }

      // Smooth Lerp Player Position
      state.player.x += (state.player.targetX - state.player.x) * 0.35;
      state.player.y += (state.player.targetY - state.player.y) * 0.35;

      // Boost Timers
      if (state.weaponBoost) {
        state.weaponBoost.duration -= dt;
        if (state.weaponBoost.duration <= 0) {
          state.weaponBoost = null;
        }
      }
      if (state.utilityBoost && state.utilityBoost.duration !== undefined) {
        state.utilityBoost.duration -= dt;
        if (state.utilityBoost.duration <= 0) {
          state.utilityBoost = null;
        }
      }

      // Auto Fire Player Weapon
      if (currentTime - state.lastPlayerShot > state.playerFireRate) {
        state.lastPlayerShot = currentTime;
        const px = state.player.x;
        const py = state.player.y - 16;
        const weapon = state.weaponBoost ? state.weaponBoost.type : '1x';

        if (weapon === '1x') {
          state.bullets.push({ x: px, y: py, vx: 0, vy: -13, color: '#ffffff', width: 3, height: 12 });
          sound.playLaser(false);
        } else if (weapon === '2x') {
          state.bullets.push({ x: px - 8, y: py, vx: 0, vy: -14, color: '#06b6d4', width: 3, height: 14 });
          state.bullets.push({ x: px + 8, y: py, vx: 0, vy: -14, color: '#06b6d4', width: 3, height: 14 });
          sound.playLaser(true);
        } else if (weapon === '3x') {
          state.bullets.push({ x: px - 10, y: py, vx: -1.2, vy: -14, color: '#22c55e', width: 3.5, height: 15 });
          state.bullets.push({ x: px, y: py - 4, vx: 0, vy: -15, color: '#22c55e', width: 3.5, height: 15 });
          state.bullets.push({ x: px + 10, y: py, vx: 1.2, vy: -14, color: '#22c55e', width: 3.5, height: 15 });
          sound.playLaser(true);
        } else if (weapon === 'S') {
          [-4, -2, 0, 2, 4].forEach((angle) => {
            state.bullets.push({
              x: px,
              y: py,
              vx: angle,
              vy: -13,
              color: '#c084fc',
              width: 3.5,
              height: 12,
            });
          });
          sound.playLaser(true);
        }

        if (state.utilityBoost && state.utilityBoost.type === 'D') {
          state.bullets.push({ x: px - 24, y: py + 4, vx: 0, vy: -12, color: '#38bdf8', width: 2.5, height: 10 });
          state.bullets.push({ x: px + 24, y: py + 4, vx: 0, vy: -12, color: '#38bdf8', width: 2.5, height: 10 });
        }
      }

      // Update Player Bullets
      for (let i = state.bullets.length - 1; i >= 0; i--) {
        const b = state.bullets[i];
        b.x += b.vx || 0;
        b.y += b.vy;
        if (b.y < -20 || b.x < -20 || b.x > width + 20) {
          state.bullets.splice(i, 1);
        }
      }

      // Update Enemy Bullets
      for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
        const eb = state.enemyBullets[i];
        eb.x += eb.vx;
        eb.y += eb.vy;

        const distToPlayer = Math.hypot(eb.x - state.player.x, eb.y - state.player.y);
        if (distToPlayer < state.player.radius + 3 && state.player.invulnerableTimer <= 0) {
          state.enemyBullets.splice(i, 1);

          if (state.utilityBoost && state.utilityBoost.type === 'Shield') {
            state.utilityBoost = null;
            sound.playPowerup();
            createExplosion(state, eb.x, eb.y, '#06b6d4', 12);
            state.floatTexts.push({ x: state.player.x, y: state.player.y - 25, text: 'SHIELD BLOCKED!', color: '#06b6d4', life: 1 });
            triggerHaptic('medium');
          } else {
            losePlayerLife(state);
          }
          continue;
        }

        if (eb.y > height + 20 || eb.x < -20 || eb.x > width + 20) {
          state.enemyBullets.splice(i, 1);
        }
      }

      // Continuous upgrades: keep drops coming even during boss fight
      state.powerupDropTimer = (state.powerupDropTimer || 0) + dt;
      if (state.powerupDropTimer > 12) {
        state.powerupDropTimer = 0;
        if (state.powerups.length < 3) {
          spawnDrop(state, Math.random() * (width - 80) + 40, -15);
        }
      }

      // Spawn Smaller Enemies in Groups of 3 (ONLY ACTIVE WHEN BOSS IS NOT ACTIVE)
      if (!state.bossActive) {
        state.spawnEnemyTimer += dt;

        // Structured enemy pacing: spawn smaller enemies in groups of 3!
        const needSpawn = state.enemies.length === 0 || (state.enemies.length < 5 && state.spawnEnemyTimer > 2.0);
        if (needSpawn) {
          state.spawnEnemyTimer = 0;

          const types = [
            { type: 'scout', hp: 1, speed: 85, scoreValue: 10, color: '#f43f5e' },
            { type: 'interceptor', hp: 2, speed: 70, scoreValue: 20, color: '#fb7185' },
            { type: 'heavy', hp: 3, speed: 55, scoreValue: 30, color: '#e11d48' },
          ];
          const chosen = types[Math.floor(Math.random() * types.length)];
          const centerX = Math.random() * (width - 120) + 60;

          // Group of 3 formation (V-shape triplet)
          const triplet = [
            { x: centerX, y: -25, hp: chosen.hp, offset: 0 },
            { x: Math.max(25, centerX - 36), y: -45, hp: 1, offset: Math.PI * 0.5 },
            { x: Math.min(width - 25, centerX + 36), y: -45, hp: 1, offset: Math.PI },
          ];

          triplet.forEach((m) => {
            state.enemies.push({
              x: m.x,
              y: m.y,
              type: m.hp > 1 ? chosen.type : 'scout',
              hp: m.hp,
              maxHp: m.hp,
              speed: chosen.speed,
              scoreValue: m.hp > 1 ? chosen.scoreValue : 10,
              color: m.hp > 1 ? chosen.color : '#f43f5e',
              shootCooldown: Math.random() * 1.5 + 0.9,
              wobbleOffset: m.offset,
            });
          });
        }
      }

      // Update Enemies
      for (let i = state.enemies.length - 1; i >= 0; i--) {
        const e = state.enemies[i];
        e.y += e.speed * dt;
        e.x += Math.sin(currentTime * 0.003 + e.wobbleOffset) * 0.9;

        // Enemy firing - ALL enemies AIM at user space craft!
        // If 30% distance is remaining to reach bottom (y >= height * 0.70), do NOT fire because it's too difficult to dodge
        e.shootCooldown -= dt;
        const canShoot = e.y < height * 0.70;
        if (e.shootCooldown <= 0) {
          e.shootCooldown = Math.random() * 1.8 + 1.2;
          if (canShoot) {
            const angleToPlayer = Math.atan2(state.player.y - e.y, state.player.x - e.x);
            const bulletSpeed = 5.2;

            if (e.type === 'scout') {
              // Type 1 (+10 PTS): 1 aimed bullet
              state.enemyBullets.push({
                x: e.x,
                y: e.y + 12,
                vx: Math.cos(angleToPlayer) * bulletSpeed,
                vy: Math.sin(angleToPlayer) * bulletSpeed,
                color: '#f43f5e',
              });
              sound.playEnemyLaser();
            } else if (e.type === 'interceptor') {
              // Type 2 (+20 PTS): 1 fast aimed bullet
              state.enemyBullets.push({
                x: e.x,
                y: e.y + 12,
                vx: Math.cos(angleToPlayer) * (bulletSpeed + 0.6),
                vy: Math.sin(angleToPlayer) * (bulletSpeed + 0.6),
                color: '#fb7185',
              });
              sound.playEnemyLaser();
            } else if (e.type === 'heavy') {
              // Type 3 (+30 PTS): 2 aimed bullets from left & right wings
              state.enemyBullets.push({
                x: e.x - 8,
                y: e.y + 12,
                vx: Math.cos(angleToPlayer - 0.08) * bulletSpeed,
                vy: Math.sin(angleToPlayer - 0.08) * bulletSpeed,
                color: '#e11d48',
              });
              state.enemyBullets.push({
                x: e.x + 8,
                y: e.y + 12,
                vx: Math.cos(angleToPlayer + 0.08) * bulletSpeed,
                vy: Math.sin(angleToPlayer + 0.08) * bulletSpeed,
                color: '#e11d48',
              });
              sound.playEnemyLaser();
            }
          }
        }

        // Bullet collisions with Enemy
        for (let j = state.bullets.length - 1; j >= 0; j--) {
          const b = state.bullets[j];
          if (Math.hypot(b.x - e.x, b.y - e.y) < 20) {
            state.bullets.splice(j, 1);
            e.hp -= 1;
            createExplosion(state, b.x, b.y, '#ffffff', 3);

            if (e.hp <= 0) {
              createExplosion(state, e.x, e.y, e.color, 14);
              sound.playExplosion(false);
              state.score += e.scoreValue;
              state.kills += 1;
              state.floatTexts.push({
                x: e.x,
                y: e.y,
                text: `+${e.scoreValue}`,
                color: '#ffffff',
                life: 0.8,
              });

              // Balanced upgrade pacing: not too many, not too few
              const now = performance.now();
              const timeSinceLastDrop = now - (state.lastPowerupTime || 0);
              const shouldDrop =
                state.powerups.length < 2 &&
                (timeSinceLastDrop > 11000 || state.kills % 6 === 0 || (state.lives < state.maxLives && Math.random() < 0.35));

              if (shouldDrop) {
                state.lastPowerupTime = now;
                spawnDrop(state, e.x, e.y);
              }

              state.enemies.splice(i, 1);
              break;
            }
          }
        }

        // Collision with player
        if (state.enemies[i] && Math.hypot(e.x - state.player.x, e.y - state.player.y) < state.player.radius + 14) {
          createExplosion(state, e.x, e.y, e.color, 16);
          state.enemies.splice(i, 1);
          if (state.utilityBoost && state.utilityBoost.type === 'Shield') {
            state.utilityBoost = null;
            sound.playPowerup();
            triggerHaptic('medium');
          } else {
            losePlayerLife(state);
          }
        } else if (state.enemies[i] && e.y > height + 30) {
          state.enemies.splice(i, 1);
        }
      }

      // Update Boss (Mothership - 3-Phase Fight matching media_1794850012766_9d2c548f.jpg)
      if (state.bossActive && state.boss) {
        const boss = state.boss;
        if (boss.y < boss.targetY) {
          boss.y += 35 * dt;
        } else {
          boss.x += boss.speedX * boss.dirX * dt;
          if (boss.x > width - 55) {
            boss.x = width - 55;
            boss.dirX = -1;
          } else if (boss.x < 55) {
            boss.x = 55;
            boss.dirX = 1;
          }

          // Calculate Phase based on boss health percentage:
          // Phase 1: HP > 66% (100% to 66%)
          // Phase 2: HP between 33% and 66%
          // Phase 3: HP <= 33%
          const hpRatio = boss.hp / boss.maxHp;
          let phase = 1;
          if (hpRatio <= 0.33) {
            phase = 3;
          } else if (hpRatio <= 0.66) {
            phase = 2;
          } else {
            phase = 1;
          }
          boss.phase = phase;

          const fireInterval = phase === 3 ? 0.95 : phase === 2 ? 1.15 : 1.35;
          boss.shootTimer += dt;

          if (boss.shootTimer > fireInterval) {
            boss.shootTimer = 0;
            const angleToPlayer = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);
            const aimedSpeed = 5.8;

            if (phase === 1) {
              // PHASE 1: Fires 3 bullets directly aiming at the user space craft with spread
              [-0.14, 0, 0.14].forEach((offsetAngle) => {
                state.enemyBullets.push({
                  x: boss.x,
                  y: boss.y + 24,
                  vx: Math.cos(angleToPlayer + offsetAngle) * aimedSpeed,
                  vy: Math.sin(angleToPlayer + offsetAngle) * aimedSpeed,
                  color: '#ef4444',
                });
              });
              sound.playEnemyLaser();
            } else if (phase === 2) {
              // PHASE 2: Phase 1 bullets fire in 1 single straight position (no spread!), PLUS radial fan
              state.enemyBullets.push({
                x: boss.x,
                y: boss.y + 24,
                vx: Math.cos(angleToPlayer) * aimedSpeed,
                vy: Math.sin(angleToPlayer) * aimedSpeed,
                color: '#ef4444',
              });

              // 5 radial fan bullets
              const spreadSpeed = 4.6;
              const spreadOffsets = [-0.75, -0.38, 0, 0.38, 0.75];
              spreadOffsets.forEach((offset) => {
                const spreadAngle = Math.PI / 2 + offset;
                state.enemyBullets.push({
                  x: boss.x,
                  y: boss.y + 20,
                  vx: Math.cos(spreadAngle) * spreadSpeed,
                  vy: Math.sin(spreadAngle) * spreadSpeed,
                  color: '#f97316',
                });
              });
              sound.playEnemyLaser();
            } else if (phase === 3) {
              // PHASE 3: Phase 1 bullets completely removed! Only radial spread bullets and escort deployment
              const spreadSpeed = 5.0;
              const spreadOffsets = [-0.85, -0.5, -0.2, 0.2, 0.5, 0.85];
              spreadOffsets.forEach((offset) => {
                const spreadAngle = Math.PI / 2 + offset;
                state.enemyBullets.push({
                  x: boss.x,
                  y: boss.y + 20,
                  vx: Math.cos(spreadAngle) * spreadSpeed,
                  vy: Math.sin(spreadAngle) * spreadSpeed,
                  color: '#f97316',
                });
              });
              sound.playEnemyLaser();
            }
          }

          // PHASE 3 SPECIAL: Deploys 2 enemies in both directions (left and right)!
          if (phase === 3) {
            boss.deployTimer = (boss.deployTimer || 0) + dt;
            if (boss.deployTimer > 3.8) {
              boss.deployTimer = 0;
              // Deploy left escort
              state.enemies.push({
                x: Math.max(25, boss.x - 55),
                y: boss.y + 15,
                type: 'scout',
                hp: 1,
                maxHp: 1,
                speed: 75,
                scoreValue: 10,
                color: '#f43f5e',
                shootCooldown: 0.8,
                wobbleOffset: Math.random() * 5,
              });
              // Deploy right escort
              state.enemies.push({
                x: Math.min(width - 25, boss.x + 55),
                y: boss.y + 15,
                type: 'scout',
                hp: 1,
                maxHp: 1,
                speed: 75,
                scoreValue: 10,
                color: '#f43f5e',
                shootCooldown: 0.8,
                wobbleOffset: Math.random() * 5,
              });
              sound.playPowerup();
              state.floatTexts.push({
                x: boss.x,
                y: boss.y - 20,
                text: 'ESCORTS DEPLOYED!',
                color: '#ef4444',
                life: 1.0,
              });
            }
          }
        }

        // Bullet Collisions with Boss
        for (let j = state.bullets.length - 1; j >= 0; j--) {
          const b = state.bullets[j];
          if (Math.hypot(b.x - boss.x, b.y - boss.y) < 38) {
            state.bullets.splice(j, 1);
            boss.hp -= 1;
            createExplosion(state, b.x, b.y, '#f59e0b', 3);

            if (boss.hp <= 0) {
              state.score += 600;
              createExplosion(state, boss.x, boss.y, '#ffffff', 35);
              sound.playExplosion(true);
              triggerHaptic('heavy');
              spawnDrop(state, boss.x - 20, boss.y);
              spawnDrop(state, boss.x + 20, boss.y);

              if (activeTournament) {
                // ENDLESS TOURNAMENT MODE: Match does NOT end when boss is killed!
                // Continue fighting endless waves and next bosses until player runs out of lives!
                state.bossActive = false;
                state.boss = null;
                state.bossTimer = 45; // Next boss wave in 45s

                state.floatTexts.push({
                  x: width / 2,
                  y: height / 2 - 15,
                  text: 'MOTHERSHIP DESTROYED! +600',
                  color: '#22c55e',
                  life: 2.5,
                });
                state.floatTexts.push({
                  x: width / 2,
                  y: height / 2 + 15,
                  text: 'NEXT WAVE INCOMING!',
                  color: '#38bdf8',
                  life: 2.5,
                });
              } else {
                // Standard Arena game: Ends with victory modal
                state.bossKilled = true;
                state.bossActive = false;
                state.boss = null;

                state.floatTexts.push({
                  x: width / 2,
                  y: height / 2,
                  text: 'MOTHERSHIP DESTROYED! +600',
                  color: '#22c55e',
                  life: 3,
                });

                setTimeout(() => {
                  state.gameOver = true;
                  handleGameEnd({
                    score: state.score,
                    kills: state.kills,
                    bossKilled: true,
                  });
                }, 1200);
              }
              break;
            }
          }
        }
      }

      // Update Powerups
      for (let i = state.powerups.length - 1; i >= 0; i--) {
        const p = state.powerups[i];
        p.y += 65 * dt;

        if (Math.hypot(p.x - state.player.x, p.y - state.player.y) < state.player.radius + 15) {
          applyPowerup(state, p.type);
          sound.playPowerup();
          triggerHaptic('medium');
          state.powerups.splice(i, 1);
          continue;
        }

        if (p.y > height + 20) {
          state.powerups.splice(i, 1);
        }
      }

      // Update Floating Texts
      for (let i = state.floatTexts.length - 1; i >= 0; i--) {
        const ft = state.floatTexts[i];
        ft.y -= 25 * dt;
        ft.life -= dt;
        if (ft.life <= 0) state.floatTexts.splice(i, 1);
      }

      // Update Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const part = state.particles[i];
        part.x += part.vx * dt;
        part.y += part.vy * dt;
        part.alpha -= part.decay * dt;
        if (part.alpha <= 0) state.particles.splice(i, 1);
      }

      // --- 2. RENDER GRAPHICS ---
      ctx.clearRect(0, 0, width, height);

      // Deep space starry background & cosmic nebula
      renderCosmicBackground(ctx, state, width, height, currentTime);

      // Dashed boundary line (10% upwards limit)
      const limitY = state.height * 0.90;
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(12, limitY);
      ctx.lineTo(width - 12, limitY);
      ctx.stroke();
      ctx.restore();

      // Render Enemies
      for (const e of state.enemies) {
        drawEnemyShip(ctx, e.x, e.y, e.color, e.type);
      }

      // Render Boss
      if (state.bossActive && state.boss) {
        drawBossShip(ctx, state.boss.x, state.boss.y, state.boss.hp / state.boss.maxHp, state.boss.phase || 1);
      }

      // Render Enemy Bullets
      for (const eb of state.enemyBullets) {
        ctx.fillStyle = eb.color;
        ctx.shadowColor = eb.color;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(eb.x, eb.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Render Player Bullets
      for (const b of state.bullets) {
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(b.x - b.width / 2, b.y, b.width, b.height);
        ctx.shadowBlur = 0;
      }

      // Render Powerup Orbs
      for (const p of state.powerups) {
        drawPowerup(ctx, p.x, p.y, p.type);
      }

      // Render Player Craft
      drawPlayerCraft(ctx, state);

      // Render Particles
      for (const part of state.particles) {
        ctx.fillStyle = part.color;
        ctx.globalAlpha = Math.max(0, part.alpha);
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Render Floating Texts
      ctx.font = 'bold 13px "Inter", sans-serif';
      ctx.textAlign = 'center';
      for (const ft of state.floatTexts) {
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = Math.min(1, ft.life);
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;
      }

      // Update HUD state
      const currentBoosts = [];
      if (state.weaponBoost) {
        currentBoosts.push({
          label: state.weaponBoost.type,
          duration: Math.ceil(state.weaponBoost.duration),
          color: 'bg-cyan-500',
        });
      }
      if (state.utilityBoost) {
        currentBoosts.push({
          label: state.utilityBoost.type,
          duration: state.utilityBoost.duration !== undefined ? Math.ceil(state.utilityBoost.duration) : 'Active',
          color: state.utilityBoost.type === 'Shield' ? 'bg-cyan-400' : 'bg-blue-500',
        });
      }

      let gunName = 'Blaster';
      if (state.weaponBoost) {
        gunName = state.weaponBoost.type === '2x' ? 'Double' : state.weaponBoost.type === '3x' ? 'Triple' : 'Spread';
      }

      setHudState({
        score: state.score,
        lives: state.lives,
        gun: gunName,
        bossTimer: Math.ceil(state.bossTimer),
        bossActive: state.bossActive,
        bossHpPercent: state.boss ? Math.round((state.boss.hp / state.boss.maxHp) * 100) : 0,
        bossPhase: state.boss ? (state.boss.phase || 1) : 1,
        activeBoosts: currentBoosts,
      });

      // Check Game Over
      if (state.lives <= 0 && !state.gameOver) {
        state.gameOver = true;
        sound.playPlayerHit();
        triggerHaptic('error');
        setTimeout(() => {
          handleGameEnd({
            score: state.score,
            kills: state.kills,
            bossKilled: false,
          });
        }, 800);
      }
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [isCountingDown, isPaused, difficulty, handleGameEnd]);

  function applyPowerup(state, type) {
    if (type === '♥') {
      if (state.lives < state.maxLives) {
        state.lives += 1;
        state.floatTexts.push({ x: state.player.x, y: state.player.y - 25, text: '+1 LIFE!', color: '#ec4899', life: 1 });
      }
      return;
    }

    if (['2x', '3x', 'S'].includes(type)) {
      state.weaponBoost = { type, duration: 14 };
      state.floatTexts.push({ x: state.player.x, y: state.player.y - 25, text: `${type} GUNS!`, color: '#22c55e', life: 1 });
      return;
    }

    if (['D', 'Shield'].includes(type)) {
      if (type === 'Shield') {
        state.utilityBoost = { type: 'Shield' };
        state.floatTexts.push({ x: state.player.x, y: state.player.y - 25, text: 'SHIELD ONLINE!', color: '#06b6d4', life: 1 });
      } else if (type === 'D') {
        state.utilityBoost = { type: 'D', duration: 14 };
        state.floatTexts.push({ x: state.player.x, y: state.player.y - 25, text: 'DRONES ACTIVE!', color: '#38bdf8', life: 1 });
      }
    }
  }

  function losePlayerLife(state) {
    state.lives -= 1;
    state.player.invulnerableTimer = 2.0;
    state.weaponBoost = null;
    sound.playPlayerHit();
    triggerHaptic('heavy');
    createExplosion(state, state.player.x, state.player.y, '#ffffff', 20);
    state.floatTexts.push({ x: state.player.x, y: state.player.y - 25, text: 'Guns lost!', color: '#ef4444', life: 1.2 });
  }

  function renderCosmicBackground(ctx, state, width, height, currentTime) {
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, width, height);

    // Stars
    for (const s of state.stars) {
      ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function spawnDrop(state, x, y) {
    let chosen = '2x';
    // If player has lost a life, 35% chance to drop a Heart to recover!
    if (state.lives < state.maxLives && Math.random() < 0.35) {
      chosen = '♥';
    } else {
      const drops = ['2x', '3x', 'S', 'Shield', 'D'];
      const weights = [0.30, 0.25, 0.15, 0.15, 0.15];
      let r = Math.random();
      let cumulative = 0;
      for (let i = 0; i < drops.length; i++) {
        cumulative += weights[i];
        if (r <= cumulative) {
          chosen = drops[i];
          break;
        }
      }
    }
    state.powerups.push({ x, y, type: chosen });
  }

  function drawPlayerCraft(ctx, state) {
    const { x, y, invulnerableTimer } = state.player;

    if (invulnerableTimer > 0 && Math.floor(invulnerableTimer * 10) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(x, y);

    if (state.utilityBoost && state.utilityBoost.type === 'Shield') {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    if (state.utilityBoost && state.utilityBoost.type === 'D') {
      [-24, 24].forEach((offset) => {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(offset, 2);
        ctx.lineTo(offset - 5, 10);
        ctx.lineTo(offset + 5, 10);
        ctx.closePath();
        ctx.fill();
      });
    }

    // Classic arrowhead white fighter
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(15, 12);
    ctx.lineTo(5, 8);
    ctx.lineTo(0, 14);
    ctx.lineTo(-5, 8);
    ctx.lineTo(-15, 12);
    ctx.closePath();
    ctx.fill();

    // Notch
    ctx.fillStyle = '#050508';
    ctx.beginPath();
    ctx.ellipse(0, -2, 2.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Blue thruster
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(-3, 14);
    ctx.lineTo(3, 14);
    ctx.lineTo(0, 21 + Math.random() * 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawEnemyShip(ctx, x, y, color, type) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;

    if (type === 'scout') {
      // Type 1 (+10 PTS): Sleek Arrowhead Scout
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.lineTo(10, -8);
      ctx.lineTo(0, -3);
      ctx.lineTo(-10, -8);
      ctx.closePath();
      ctx.fill();
    } else if (type === 'interceptor') {
      // Type 2 (+20 PTS): Winged Interceptor with Dual Cannons
      ctx.beginPath();
      ctx.moveTo(0, 14);
      ctx.lineTo(14, -5);
      ctx.lineTo(5, -12);
      ctx.lineTo(0, -7);
      ctx.lineTo(-5, -12);
      ctx.lineTo(-14, -5);
      ctx.closePath();
      ctx.fill();
    } else {
      // Type 3 (+30 PTS): Heavy Armored Destroyer
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.lineTo(18, 0);
      ctx.lineTo(12, -12);
      ctx.lineTo(-12, -12);
      ctx.lineTo(-18, 0);
      ctx.closePath();
      ctx.fill();

      // Dual wing cannons
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-10, 4, 2.5, 6);
      ctx.fillRect(7.5, 4, 2.5, 6);
    }

    ctx.restore();
  }

  function drawBossShip(ctx, x, y, hpRatio, phase = 1) {
    ctx.save();
    ctx.translate(x, y);

    // Faceted gunmetal stealth hull matching media_1794850012766_9d2c548f.jpg
    const grad = ctx.createLinearGradient(0, -25, 0, 25);
    grad.addColorStop(0, '#64748b');
    grad.addColorStop(0.5, '#475569');
    grad.addColorStop(1, '#334155');

    ctx.fillStyle = grad;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;

    // Outer hull path
    ctx.beginPath();
    ctx.moveTo(-18, -22);
    ctx.lineTo(18, -22);
    ctx.lineTo(46, -6);
    ctx.lineTo(48, 12);
    ctx.lineTo(26, 14);
    ctx.lineTo(0, 24);
    ctx.lineTo(-26, 14);
    ctx.lineTo(-48, 12);
    ctx.lineTo(-46, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Panel lines etched on wings
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-46, 0);
    ctx.lineTo(-12, 0);
    ctx.lineTo(0, 10);
    ctx.lineTo(12, 0);
    ctx.lineTo(46, 0);
    ctx.stroke();

    // 4 Top Engine Marker Lights (Red glow matching reference image)
    const markerXs = [-30, -10, 10, 30];
    for (const mx of markerXs) {
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(mx, -20, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 4 Bottom Thruster Nozzles
    ctx.fillStyle = '#1e293b';
    const nozzleXs = [-28, -10, 10, 28];
    for (const nx of nozzleXs) {
      ctx.fillRect(nx - 3, 10, 6, 8);
    }

    // Central Pulsating Reactor Core (Orange glowing orb matching media_1794850012766_9d2c548f.jpg)
    const coreGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 14);
    coreGrad.addColorStop(0, '#fef08a');
    coreGrad.addColorStop(0.3, '#f59e0b');
    coreGrad.addColorStop(0.8, '#ea580c');
    coreGrad.addColorStop(1, 'rgba(194, 65, 12, 0)');

    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = phase === 3 ? 18 : 12;
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  function drawPowerup(ctx, x, y, type) {
    ctx.save();
    ctx.translate(x, y);

    let color = '#22c55e';
    if (type === '2x') color = '#06b6d4';
    if (type === 'S') color = '#a855f7';
    if (type === 'D') color = '#38bdf8';
    if (type === 'Shield') color = '#06b6d4';
    if (type === '♥') color = '#ec4899';

    ctx.fillStyle = '#050508';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = 'bold 11px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type, 0, 1);

    ctx.restore();
  }

  function createExplosion(state, x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 110 + 25;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1,
        color,
        alpha: 1,
        decay: Math.random() * 2 + 1.5,
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-white dark:bg-[#070709] text-neutral-900 dark:text-white select-none overflow-hidden touch-none h-[100dvh] w-screen p-2 sm:p-3">
      {/* 1. TOP HEADER (Matching Reference Images 1-5) */}
      <div className="w-full max-w-sm flex items-center justify-between py-1 px-1">
        <button
          onClick={handleExit}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-white hover:bg-neutral-200 dark:hover:bg-white/20 transition-all active:scale-95 shadow-sm"
          aria-label="Exit Game"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        <h2 className="text-base font-black tracking-tight text-neutral-900 dark:text-white">
          Asteroid Blaster
        </h2>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleSound}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-white"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-neutral-400" />}
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-white"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. 4-PILL HUD ROW (Matching Reference Images 1-5) */}
      <div className="w-full max-w-sm grid grid-cols-4 gap-1.5 py-1">
        <div className="rounded-2xl bg-neutral-100 dark:bg-[#121216] border border-neutral-200 dark:border-white/10 p-2 text-center shadow-sm">
          <span className="text-[10px] uppercase font-mono text-neutral-400 block -mb-0.5">Score</span>
          <span className="text-sm font-black text-neutral-900 dark:text-white font-mono block">
            {hudState.score}
          </span>
        </div>

        <div className="rounded-2xl bg-neutral-100 dark:bg-[#121216] border border-neutral-200 dark:border-white/10 p-2 text-center shadow-sm">
          <span className="text-[10px] uppercase font-mono text-neutral-400 block -mb-0.5">Lives</span>
          <span className="text-sm font-bold text-pink-500 font-mono block">
            {Array.from({ length: Math.max(0, hudState.lives) }).map(() => '♥').join('') || '—'}
          </span>
        </div>

        <div className="rounded-2xl bg-neutral-100 dark:bg-[#121216] border border-neutral-200 dark:border-white/10 p-2 text-center shadow-sm">
          <span className="text-[10px] uppercase font-mono text-neutral-400 block -mb-0.5">Gun</span>
          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-200 truncate block">
            {hudState.gun}
          </span>
        </div>

        <div className="rounded-2xl bg-neutral-100 dark:bg-[#121216] border border-neutral-200 dark:border-white/10 p-2 text-center shadow-sm">
          <span className="text-[10px] uppercase font-mono text-neutral-400 block -mb-0.5">
            {hudState.bossActive ? 'Boss HP' : 'Boss In'}
          </span>
          <span className={`text-xs font-bold font-mono block truncate ${hudState.bossActive ? 'text-red-500' : 'text-neutral-900 dark:text-white'}`}>
            {hudState.bossActive ? `${hudState.bossHpPercent}%` : `${hudState.bossTimer}s`}
          </span>
        </div>
      </div>

      {/* 3. CENTERED ROUNDED GAME CARD (Matching Reference Images 1-5) */}
      <div
        ref={canvasContainerRef}
        className="relative w-full max-w-sm flex-1 my-1 rounded-3xl overflow-hidden border border-neutral-300 dark:border-white/15 shadow-2xl bg-[#050508] cursor-crosshair flex flex-col"
        onMouseMove={handlePointerMove}
        onTouchMove={handlePointerMove}
        onTouchStart={handlePointerMove}
      >
        {/* In-Game Countdown (3, 2, 1, GO) inside the game card directly */}
        {isCountingDown && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
            <span className="font-mono text-7xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.7)] animate-bounce">
              {countdownNum}
            </span>
          </div>
        )}

        {/* Boss Phase Bar (Matching media_1794850012766_9d2c548f.jpg) */}
        {hudState.bossActive && (
          <div className="absolute top-3.5 left-5 right-5 z-20 flex flex-col items-center pointer-events-none animate-fade-in">
            <div className="w-full bg-neutral-900/90 border border-white/10 rounded-full h-2.5 overflow-hidden p-[1px] shadow-lg">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-orange-500 rounded-full transition-all duration-150 shadow-[0_0_12px_rgba(239,68,68,0.8)]"
                style={{ width: `${Math.max(0, Math.min(100, hudState.bossHpPercent))}%` }}
              />
            </div>
            <span className="text-[10px] font-black uppercase font-mono tracking-widest text-neutral-300 mt-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              MOTHERSHIP · PHASE {hudState.bossPhase}
            </span>
          </div>
        )}

        {/* The HTML5 Canvas */}
        <canvas ref={canvasRef} className="w-full h-full block flex-1" />

        {/* Active Powerup Pill (Bottom-Left inside game screen, e.g. Shield 2s matching media_1794850012766_9d2c548f.jpg) */}
        <div className="absolute bottom-3.5 left-3.5 z-20 flex flex-col gap-1.5 pointer-events-none">
          {hudState.activeBoosts.map((boost, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 px-3 py-1 text-xs font-mono font-bold text-cyan-300 shadow-lg backdrop-blur-md animate-fade-in"
            >
              <span>{boost.label === 'Shield' ? '🛡️' : boost.label}</span>
              <span>{typeof boost.duration === 'number' ? `${boost.duration}s` : boost.duration}</span>
            </div>
          ))}
        </div>

        {/* Pause Overlay */}
        {isPaused && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <h3 className="text-xl font-black text-white mb-2">Paused</h3>
            <button
              onClick={() => setIsPaused(false)}
              className="btn-primary-white py-2.5 px-6 rounded-2xl text-xs font-bold shadow-lg"
            >
              Resume
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
