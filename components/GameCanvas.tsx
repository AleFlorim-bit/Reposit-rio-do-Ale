import React, { useRef, useEffect } from 'react';
import { GamePhase, PlayerStats, AIBossProfile, GameEntity, Projectile } from '../types';

interface GameCanvasProps {
  phase: GamePhase;
  onPhaseComplete: (stats: PlayerStats) => void;
  onGameOver: (won: boolean) => void;
  bossProfile: AIBossProfile | null;
}

const GRAVITY = 0.6;
const FRICTION = 0.85; 
const JUMP_FORCE = -13;
const GROUND_Y = 350;
const PROJ_SPEED = 12;

const GameCanvas: React.FC<GameCanvasProps> = ({ phase, onPhaseComplete, onGameOver, bossProfile }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  // Stats tracking refs
  const statsRef = useRef<PlayerStats>({
    jumps: 0,
    meleeAttacks: 0,
    shotsFired: 0,
    distanceKept: 0,
    framesRecorded: 0,
    aggressionTime: 0,
    retreatTime: 0,
    hitsLanded: 0,
    hitsTaken: 0,
    airTime: 0
  });

  const gameStateRef = useRef({
    player: {
      x: 100, y: GROUND_Y - 50, width: 40, height: 60, vx: 0, vy: 0,
      color: '#fbbf24', hp: 150, maxHp: 150, isAttacking: false, attackCooldown: 0,
      facingRight: true, isGrounded: true, isDashing: false, dashCooldown: 0, stalemateTimer: 0
    } as GameEntity,
    enemy: {
      x: 600, y: GROUND_Y - 50, width: 40, height: 60, vx: 0, vy: 0,
      color: '#9333ea', hp: 130, maxHp: 130, isAttacking: false, attackCooldown: 0,
      facingRight: false, isGrounded: true, isDashing: false, dashCooldown: 0, stalemateTimer: 0
    } as GameEntity,
    projectiles: [] as Projectile[],
    keys: {} as Record<string, boolean>,
    timer: 0,
    particles: [] as {x: number, y: number, vx: number, vy: number, life: number, color: string, size: number}[]
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { gameStateRef.current.keys[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { gameStateRef.current.keys[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const resetGame = () => {
    statsRef.current = { jumps: 0, meleeAttacks: 0, shotsFired: 0, distanceKept: 0, framesRecorded: 0, aggressionTime: 0, retreatTime: 0, hitsLanded: 0, hitsTaken: 0, airTime: 0 };
    // Increased Player HP for better survival
    gameStateRef.current.player.hp = 150;
    gameStateRef.current.player.maxHp = 150;
    gameStateRef.current.player.x = 100;
    gameStateRef.current.player.y = GROUND_Y - 60;
    gameStateRef.current.player.stalemateTimer = 0;
    gameStateRef.current.projectiles = [];
    gameStateRef.current.timer = 0;
    gameStateRef.current.particles = [];
    
    const isBoss = phase === GamePhase.BOSS_FIGHT;
    // Set Boss HP to 200 for a solid challenge
    gameStateRef.current.enemy.hp = isBoss ? 200 : 60;
    gameStateRef.current.enemy.maxHp = isBoss ? 200 : 60;
    gameStateRef.current.enemy.x = 600;
    gameStateRef.current.enemy.y = GROUND_Y - 60;
    gameStateRef.current.enemy.stalemateTimer = 0;
    
    if (isBoss && bossProfile) {
       gameStateRef.current.enemy.color = bossProfile.stats.colorHex;
    } else {
       gameStateRef.current.enemy.color = '#4b5563'; // Grey drone
    }
  };

  useEffect(() => {
    resetGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const update = () => {
    const state = gameStateRef.current;
    const { player, enemy, keys, projectiles } = state;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // --- Player Logic ---
    const moveSpeed = 5;
    
    if (!player.isDashing) {
      if (keys['ArrowRight']) {
        player.vx += 1;
        player.facingRight = true;
      }
      if (keys['ArrowLeft']) {
        player.vx -= 1;
        player.facingRight = false;
      }
      if (player.vx > moveSpeed) player.vx = moveSpeed;
      if (player.vx < -moveSpeed) player.vx = -moveSpeed;
    }

    if (keys['Space'] && player.isGrounded) {
      player.vy = JUMP_FORCE;
      player.isGrounded = false;
      statsRef.current.jumps++;
      spawnParticles(player.x + player.width/2, player.y + player.height, '#fbbf24', 5);
    }
    
    // Melee (Z) - Faster cooldown (20 frames instead of 25)
    if (keys['KeyZ'] && player.attackCooldown <= 0) {
      player.isAttacking = true;
      player.attackCooldown = 20; 
      statsRef.current.meleeAttacks++;
      // Sword Swing Effect Particles
      spawnParticles(player.facingRight ? player.x + player.width : player.x, player.y + player.height / 2, '#fbbf24', 5);
    }

    // Shoot (X)
    if (keys['KeyX'] && player.attackCooldown <= 0) {
      player.attackCooldown = 35;
      statsRef.current.shotsFired++;
      projectiles.push({
        x: player.facingRight ? player.x + player.width : player.x - 10,
        y: player.y + player.height / 2 - 5,
        vx: player.facingRight ? PROJ_SPEED : -PROJ_SPEED,
        width: 15, height: 15, // Larger hitbox for magic
        owner: 'player',
        active: true
      });
    }

    // Player Physics
    if (!player.isDashing) player.vx *= FRICTION;
    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;
    
    if (player.y + player.height > GROUND_Y) {
      player.y = GROUND_Y - player.height;
      player.vy = 0;
      player.isGrounded = true;
    } else {
      statsRef.current.airTime++;
    }
    // Wall bounds
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;

    // Cooldowns
    if (player.attackCooldown > 0) player.attackCooldown--;
    if (player.attackCooldown < 10) player.isAttacking = false; // Animation window

    // --- Stats Tracking ---
    if (phase === GamePhase.TRAINING) {
      const dist = Math.abs((player.x + player.width/2) - (enemy.x + enemy.width/2));
      statsRef.current.framesRecorded++;
      statsRef.current.distanceKept += dist;
      const movingTowards = (player.vx > 0 && player.x < enemy.x) || (player.vx < 0 && player.x > enemy.x);
      const movingAway = (player.vx < 0 && player.x < enemy.x) || (player.vx > 0 && player.x > enemy.x);
      if (movingTowards) statsRef.current.aggressionTime++;
      if (movingAway) statsRef.current.retreatTime++;
      if (statsRef.current.framesRecorded > 600 && enemy.hp <= 0) { 
         onPhaseComplete(statsRef.current);
         return; 
      }
    }

    // --- Enemy AI Logic ---
    const distToPlayer = player.x - enemy.x;
    const absDist = Math.abs(distToPlayer);
    
    if (phase === GamePhase.TRAINING) {
      // Basic Drone Logic
      if (absDist > 250) enemy.vx += distToPlayer > 0 ? 0.4 : -0.4;
      else if (absDist < 150) enemy.vx -= distToPlayer > 0 ? 0.4 : -0.4;
      enemy.facingRight = distToPlayer > 0;
      
      // Drone Shoot
      if (enemy.attackCooldown <= 0 && Math.random() < 0.02) {
          enemy.attackCooldown = 70;
          projectiles.push({
            x: enemy.facingRight ? enemy.x + enemy.width : enemy.x - 10,
            y: enemy.y + enemy.height / 2,
            vx: enemy.facingRight ? 7 : -7,
            width: 15, height: 15, owner: 'enemy', active: true
          });
      }

    } else if (phase === GamePhase.BOSS_FIGHT && bossProfile) {
      // --- ADVANCED BOSS AI ---
      const { speedMultiplier, projectileRate, reactionTime } = bossProfile.stats;
      const { preferredDistance, movementStyle, aggressionLevel } = bossProfile.tactics;

      // Update Direction
      if (!enemy.isDashing) {
          enemy.facingRight = distToPlayer > 0;
      }

      // Check for Stalemate
      if (Math.abs(enemy.vx) < 1 && !enemy.isAttacking && !enemy.isDashing) {
          enemy.stalemateTimer = (enemy.stalemateTimer || 0) + 1;
      } else {
          enemy.stalemateTimer = 0;
      }

      const isUnderPressure = player.isAttacking && absDist < 100 && player.attackCooldown > 10;
      
      if (isUnderPressure && (enemy.dashCooldown || 0) <= 0) {
          const roll = Math.random();
          if (roll < 0.3) { // Reduced dodge chance slightly
              performDash(enemy, distToPlayer > 0 ? -15 : 15); // Backdash
          } else if (roll < 0.5) {
              performDash(enemy, distToPlayer > 0 ? 15 : -15); // Cross-up
          } else if (roll < 0.7) {
              enemy.vy = JUMP_FORCE * 1.2;
              enemy.isGrounded = false;
          }
      }

      // Add a bit of randomness to reaction time so it's not perfect
      const effectiveReaction = Math.max(1, reactionTime) + (Math.random() * 5); 
      const shouldAct = state.timer % Math.floor(effectiveReaction) === 0;
      const forceAct = (enemy.stalemateTimer || 0) > 60; 

      if (shouldAct || forceAct) {
        
        // 1. DEFENSIVE REFLEXES
        const incomingProj = projectiles.find(p => 
            p.owner === 'player' && p.active && 
            Math.abs(p.x - enemy.x) < 180 && // Reduced awareness range
            (p.vx > 0 ? p.x < enemy.x : p.x > enemy.x)
        );

        if (incomingProj) {
            if (movementStyle === 'DASH_HEAVY' && (enemy.dashCooldown || 0) <= 0) {
                performDash(enemy, distToPlayer > 0 ? 15 : -15);
            } else if (enemy.isGrounded) {
                enemy.vy = JUMP_FORCE;
                enemy.isGrounded = false;
            }
        }

        // 2. STALEMATE BREAKER
        if (forceAct) {
             const actionRoll = Math.random();
             if (actionRoll < 0.5 && (enemy.dashCooldown || 0) <= 0) {
                 performDash(enemy, Math.random() > 0.5 ? 15 : -15);
             } else if (enemy.isGrounded) {
                 enemy.vy = JUMP_FORCE;
                 enemy.isGrounded = false;
             }
             enemy.stalemateTimer = 0;
        }

        // 3. POSITIONING
        let targetDist = 200;
        if (preferredDistance === 'CLOSE') targetDist = 60;
        if (preferredDistance === 'FAR') targetDist = 450;
        
        const oscillation = Math.sin(state.timer / 20) * 50;
        targetDist += oscillation;

        const speedMod = speedMultiplier * (enemy.isDashing ? 3 : 1);

        if (!enemy.isDashing) {
            let chaseBias = 0;
            if (aggressionLevel === 'RUSH_DOWN') chaseBias = 80;
            if (aggressionLevel === 'DEFENSIVE') chaseBias = -80;

            if (absDist > targetDist - chaseBias) {
                enemy.vx += (distToPlayer > 0 ? 1 : -1) * 0.9 * speedMod;
                if (movementStyle === 'DASH_HEAVY' && absDist > 300 && (enemy.dashCooldown || 0) <= 0) {
                    performDash(enemy, distToPlayer > 0 ? 18 : -18);
                }
            } else if (absDist < targetDist - 50 - chaseBias) {
                enemy.vx -= (distToPlayer > 0 ? 1 : -1) * 0.9 * speedMod;
            }
        }

        // 4. ATTACK LOGIC
        if (enemy.attackCooldown <= 0) {
            if (absDist < 90) {
                 enemy.isAttacking = true;
                 enemy.attackCooldown = aggressionLevel === 'RUSH_DOWN' ? 25 : 45;
            } 
            else {
                const inPosition = Math.abs(absDist - targetDist) < 100;
                if (projectileRate > 0.1 && (inPosition || preferredDistance === 'FAR')) {
                    if (Math.random() < projectileRate * 0.15) {
                        enemy.attackCooldown = aggressionLevel === 'RUSH_DOWN' ? 40 : 70; // Slower shooting
                        projectiles.push({
                            x: enemy.facingRight ? enemy.x + enemy.width : enemy.x - 12,
                            y: enemy.y + enemy.height / 2,
                            vx: enemy.facingRight ? 14 : -14,
                            width: 15, height: 15, owner: 'enemy', active: true
                        });
                    }
                }
            }
        }

        // 5. JUMP TACTICS
        if (enemy.isGrounded) {
             if (movementStyle === 'AERIAL' && Math.random() < 0.08) {
                 enemy.vy = JUMP_FORCE;
                 enemy.isGrounded = false;
             }
             if (player.y < enemy.y - 80 && absDist < 150) {
                 enemy.vy = JUMP_FORCE * 1.3;
                 enemy.isGrounded = false;
             }
        }
      }
    }

    // Enemy Physics
    if (enemy.isDashing) {
        enemy.vx *= 0.92;
        if (Math.abs(enemy.vx) < 5) enemy.isDashing = false;
    } else {
        enemy.vx *= FRICTION;
    }

    enemy.vy += GRAVITY;
    enemy.x += enemy.vx;
    enemy.y += enemy.vy;

    if (enemy.y + enemy.height > GROUND_Y) {
      enemy.y = GROUND_Y - enemy.height;
      enemy.vy = 0;
      enemy.isGrounded = true;
    }
    if (enemy.x < 0) enemy.x = 0;
    if (enemy.x > canvas.width - enemy.width) enemy.x = canvas.width - enemy.width;

    if (enemy.attackCooldown > 0) enemy.attackCooldown--;
    if (enemy.dashCooldown && enemy.dashCooldown > 0) enemy.dashCooldown--;
    if (enemy.attackCooldown < 15) enemy.isAttacking = false;

    // --- Collisions ---
    state.projectiles.forEach(p => {
        if (!p.active) return;
        p.x += p.vx;
        
        // Projectile Trail
        spawnParticles(p.x, p.y + p.height/2, p.owner === 'player' ? '#fbbf24' : (bossProfile?.stats.colorHex || 'red'), 1);

        if (p.x < 0 || p.x > canvas.width) p.active = false;

        const target = p.owner === 'player' ? enemy : player;
        if (checkCollision({ ...p, facingRight: p.vx > 0 } as any, target)) {
            p.active = false;
            let damage = 5;
            if (p.owner === 'player') {
                damage = 8; // Buffed Projectile Dmg
                statsRef.current.hitsLanded++;
                spawnParticles(target.x + target.width/2, target.y + target.height/2, target.color, 8);
                target.vx += p.vx > 0 ? 2 : -2;
            } else {
                damage = bossProfile ? 4 * bossProfile.stats.damageMultiplier : 3; // Nerfed Boss Proj
                statsRef.current.hitsTaken++;
                spawnParticles(target.x + target.width/2, target.y + target.height/2, '#fbbf24', 8);
            }
            target.hp -= damage;
        }
    });
    state.projectiles = state.projectiles.filter(p => p.active);

    // Melee Hit (Player -> Enemy)
    // Increased Hit Window and Range
    if (player.isAttacking && player.attackCooldown > 10) { 
       // Increased hitbox range to 70 (was 45) for better feel
       if (checkCollision(player, enemy, 70)) {
          enemy.vx += player.facingRight ? 12 : -12; 
          enemy.vy = -4; 
          enemy.hp -= 12; // Buffed Melee Dmg (was 8)
          statsRef.current.hitsLanded++;
          spawnParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, bossProfile?.stats.colorHex || '#555', 12);
          player.isAttacking = false; // Consume attack
       }
    }

    // Melee Hit (Enemy -> Player)
    if (enemy.isAttacking && enemy.attackCooldown > 10 && !state.projectiles.some(p => p.owner === 'enemy' && p.active && Math.abs(p.x - enemy.x) < 50)) {
        if (checkCollision(enemy, player, 45)) {
           const dmg = bossProfile ? 6 * bossProfile.stats.damageMultiplier : 4; // Nerfed Boss Melee
           player.hp -= dmg;
           player.vx += enemy.facingRight ? 15 : -15; 
           player.vy = -5;
           statsRef.current.hitsTaken++;
           spawnParticles(player.x + player.width/2, player.y + player.height/2, '#fbbf24', 15);
           enemy.isAttacking = false;
        }
    }

    state.timer++;

    if (player.hp <= 0) onGameOver(false);
    else if (enemy.hp <= 0) {
        if (phase === GamePhase.TRAINING) onPhaseComplete(statsRef.current);
        else onGameOver(true);
    }
  };

  const performDash = (entity: GameEntity, vx: number) => {
      entity.isDashing = true;
      entity.vx = vx;
      entity.dashCooldown = 60; 
      // Visual flair
      for(let i=0; i<8; i++) {
        gameStateRef.current.particles.push({
            x: entity.x + entity.width/2, y: entity.y + entity.height/2,
            vx: -vx/2 + (Math.random()*4 - 2), vy: (Math.random()-0.5)*4,
            life: 15, color: entity.color, size: 3
        });
      }
  };

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    for(let i=0; i<count; i++) {
        gameStateRef.current.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 20 + Math.random() * 15,
            color,
            size: Math.random() * 4 + 1
        });
    }
  };

  const checkCollision = (r1: GameEntity, r2: GameEntity, rangeBuffer = 0) => {
    const r1HitBoxX = r1.facingRight ? r1.x + r1.width : r1.x - rangeBuffer;
    return (
        r1HitBoxX < r2.x + r2.width &&
        r1HitBoxX + rangeBuffer + r1.width > r2.x &&
        r1.y < r2.y + r2.height &&
        r1.y + r1.height > r2.y
    );
  };

  const drawCharacter = (ctx: CanvasRenderingContext2D, entity: GameEntity, isHero: boolean) => {
      const { x, y, width, height, facingRight, color, isDashing, isAttacking } = entity;
      const breathing = Math.sin(gameStateRef.current.timer / 10) * 2;
      
      ctx.save();
      
      // Glitch Effect for Boss
      let offsetX = 0;
      if (!isHero && phase === GamePhase.BOSS_FIGHT && Math.random() < 0.1) {
          offsetX = (Math.random() - 0.5) * 10;
          ctx.globalAlpha = 0.8;
      }
      
      // Dash Trail
      if (isDashing) {
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = color;
          ctx.fillRect(x - (facingRight ? 20 : -20), y, width, height);
          ctx.globalAlpha = 1.0;
      }
      
      // Aura
      ctx.shadowBlur = isHero ? 15 : 20;
      ctx.shadowColor = color;

      // --- Body Construction ---
      const centerX = x + width / 2 + offsetX;
      const centerY = y + height / 2;

      // Cape / Aura Back
      ctx.fillStyle = isHero ? '#fcd34d' : '#4c1d95'; // Gold or Dark Purple
      ctx.beginPath();
      ctx.moveTo(centerX - 10, y + 15);
      ctx.lineTo(centerX + 10, y + 15);
      const capeSway = Math.sin(gameStateRef.current.timer / 5) * 10 * (facingRight ? -1 : 1);
      ctx.lineTo(centerX + (facingRight ? -25 : 25) + capeSway, y + height);
      ctx.lineTo(centerX + (facingRight ? -10 : 10) + capeSway, y + height - 5);
      ctx.fill();

      // Main Body (Armor)
      ctx.fillStyle = color;
      ctx.beginPath();
      // Torso
      ctx.moveTo(centerX - 12, y + 15 + breathing);
      ctx.lineTo(centerX + 12, y + 15 + breathing);
      ctx.lineTo(centerX + 8, y + 45);
      ctx.lineTo(centerX - 8, y + 45);
      ctx.fill();

      // Head
      ctx.fillStyle = isHero ? '#fef3c7' : '#111'; // Skin or Void
      ctx.beginPath();
      ctx.arc(centerX, y + 8 + breathing, 10, 0, Math.PI * 2);
      ctx.fill();
      
      // Eyes
      ctx.fillStyle = isHero ? '#3b82f6' : '#ef4444'; // Blue or Red Eyes
      const eyeDir = facingRight ? 4 : -4;
      ctx.fillRect(centerX + eyeDir - 2, y + 6 + breathing, 4, 4);
      if (!isHero) { // Glowing eyes for boss
         ctx.shadowBlur = 10;
         ctx.shadowColor = '#ef4444';
         ctx.fillRect(centerX + eyeDir - 2, y + 6 + breathing, 4, 4);
         ctx.shadowBlur = 0;
      }

      // Weapon
      if (isAttacking) {
          ctx.save();
          ctx.translate(centerX, centerY);
          
          // Slash Effect (Visual Arc)
          ctx.beginPath();
          const startAngle = facingRight ? -Math.PI / 2 : Math.PI * 1.5;
          const endAngle = facingRight ? 0 : Math.PI;
          ctx.arc(0, 0, 50, startAngle, endAngle);
          ctx.lineWidth = 4;
          ctx.strokeStyle = isHero ? '#fff' : '#ef4444';
          ctx.shadowBlur = 15;
          ctx.shadowColor = isHero ? '#fbbf24' : '#ef4444';
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Sword Handle/Blade
          const attackAngle = facingRight ? Math.PI / 4 : -Math.PI / 4;
          const swing = (entity.attackCooldown / 20) * Math.PI; // Animate swing
          ctx.rotate(facingRight ? swing - 0.5 : -swing + 0.5);
          
          // Sword Blade
          ctx.fillStyle = isHero ? '#fff' : '#ef4444';
          ctx.shadowBlur = 10;
          ctx.shadowColor = isHero ? '#fff' : '#ef4444';
          ctx.fillRect(0, -50, 6, 60);
          
          // Crossguard
          ctx.fillStyle = '#b45309'; // Bronze
          ctx.fillRect(-10, -10, 26, 6);
          
          ctx.restore();
      } else {
          // Idle Weapon
          ctx.fillStyle = '#666';
          const weaponX = facingRight ? centerX - 10 : centerX + 5;
          ctx.fillRect(weaponX, y + 20 + breathing, 4, 30);
      }

      ctx.restore();
  };

  const drawEnvironment = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      // Sky Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#0f0518');
      grad.addColorStop(1, '#2e1065');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Floor (Mirror Surface)
      ctx.fillStyle = '#000';
      ctx.fillRect(0, GROUND_Y, width, height - GROUND_Y);
      
      // Floor Glow Line
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#8b5cf6';
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(width, GROUND_Y);
      ctx.stroke();
      ctx.shadowBlur = 0;
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = gameStateRef.current;

    drawEnvironment(ctx, canvas.width, canvas.height);

    // --- Reflection Pass (Draw everything upside down with low opacity) ---
    ctx.save();
    ctx.translate(0, GROUND_Y * 2);
    ctx.scale(1, -1);
    ctx.globalAlpha = 0.2;
    
    // Draw Reflections
    drawCharacter(ctx, state.player, true);
    drawCharacter(ctx, state.enemy, false);
    
    state.projectiles.forEach(p => {
        ctx.fillStyle = p.owner === 'player' ? '#fbbf24' : (bossProfile?.stats.colorHex || '#ef4444');
        ctx.beginPath();
        ctx.arc(p.x + p.width/2, p.y + p.height/2, p.width/2, 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.restore();
    // --- End Reflection Pass ---

    // Draw Real Entities
    drawCharacter(ctx, state.player, true);
    drawCharacter(ctx, state.enemy, false);

    // Projectiles (Orbs)
    state.projectiles.forEach(p => {
        ctx.fillStyle = p.owner === 'player' ? '#fbbf24' : (bossProfile?.stats.colorHex || '#ef4444');
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(p.x + p.width/2, p.y + p.height/2, p.width/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Particles
    state.particles.forEach((p, i) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 20;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        p.x += p.vx; p.y += p.vy; p.life--;
        if(p.life <= 0) state.particles.splice(i, 1);
        ctx.globalAlpha = 1.0;
    });

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '20px "Cinzel"';
    const phaseText = phase === GamePhase.TRAINING ? 'TREINO DE COMBATE' : phase === GamePhase.BOSS_FIGHT ? 'DUELO FINAL' : phase;
    ctx.fillText(`CAPÍTULO: ${phaseText}`, 20, 30);
    
    // Player HP Bar
    ctx.fillStyle = '#333';
    ctx.fillRect(20, 40, 200, 10);
    ctx.fillStyle = '#fbbf24'; // Gold
    ctx.fillRect(20, 40, 200 * (Math.max(0, state.player.hp)/state.player.maxHp), 10);

    // Enemy HP Bar
    if (state.enemy.hp > 0) {
        ctx.fillStyle = '#333';
        ctx.fillRect(canvas.width - 220, 40, 200, 10);
        ctx.fillStyle = bossProfile?.stats.colorHex || '#ef4444';
        ctx.fillRect(canvas.width - 220, 40, 200 * (Math.max(0, state.enemy.hp)/state.enemy.maxHp), 10);
        
        if (phase === GamePhase.BOSS_FIGHT && bossProfile) {
            ctx.fillStyle = bossProfile.stats.colorHex;
            ctx.textAlign = 'right';
            ctx.fillText(bossProfile.name, canvas.width - 20, 30);
            ctx.textAlign = 'left';
        }
    }
  };

  const loop = () => {
    update();
    draw();
    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, bossProfile]);

  return (
    <div className="relative border-4 border-[#4c1d95] rounded-sm overflow-hidden shadow-[0_0_50px_rgba(139,92,246,0.3)]">
        <canvas ref={canvasRef} width={800} height={450} className="block bg-[#05020a] w-full" />
    </div>
  );
};

export default GameCanvas;