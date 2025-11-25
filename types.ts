export enum GamePhase {
  INTRO = 'INTRO',
  TRAINING = 'TRAINING',
  ANALYSIS = 'ANALYSIS',
  BOSS_FIGHT = 'BOSS_FIGHT',
  GAME_OVER = 'GAME_OVER'
}

export interface PlayerStats {
  jumps: number;
  meleeAttacks: number;
  shotsFired: number;
  distanceKept: number; // Sum of distance per frame to calculate average
  framesRecorded: number;
  aggressionTime: number; // Frames moving towards enemy
  retreatTime: number; // Frames moving away
  hitsLanded: number;
  hitsTaken: number;
  airTime: number;
}

export interface AIBossProfile {
  name: string;
  title: string;
  archetype: 'Shadow' | 'Tank' | 'Sniper' | 'Berserker' | 'Counter';
  description: string;
  dialogue_intro: string;
  dialogue_win: string;
  dialogue_lose: string;
  strategy_analysis: string;
  tactics: {
    preferredDistance: 'CLOSE' | 'MID' | 'FAR';
    movementStyle: 'GROUNDED' | 'AERIAL' | 'DASH_HEAVY';
    aggressionLevel: 'DEFENSIVE' | 'BALANCED' | 'RUSH_DOWN';
  };
  stats: {
    speedMultiplier: number; // 0.8 to 1.5
    jumpFrequency: number; // 0.0 to 1.0 (probability)
    reactionTime: number; // frames delay
    damageMultiplier: number;
    projectileRate: number; // 0.0 to 1.0 preference for shooting
    colorHex: string;
  };
}

export interface GameEntity {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  color: string;
  hp: number;
  maxHp: number;
  isAttacking: boolean;
  attackCooldown: number;
  facingRight: boolean;
  isGrounded: boolean;
  // New state
  isDashing?: boolean;
  dashCooldown?: number;
  stalemateTimer?: number;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  width: number;
  height: number;
  owner: 'player' | 'enemy';
  active: boolean;
}