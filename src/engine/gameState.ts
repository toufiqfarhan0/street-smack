import { FIGHTERS } from './fighters';
import { EMOTES } from './emotes';
import { soundEngine } from './audio';

export interface PlayerStats {
  address: string;
  isMe: boolean;
  team: 'A' | 'B';
  damage: number;
  emotes: Record<string, number>;
}

export interface FightMatch {
  id: number;
  charA: string;
  charB: string;
  stakeSol: number;
  potSol: number;
  status: 'upcoming' | 'live' | 'finished';
  auraA: number; // 0 to 100
  auraB: number; // 0 to 100
  damageA: number;
  damageB: number;
  txCount: number;
  winner: 'A' | 'B' | null;
  timeLeftSeconds: number;
  players: PlayerStats[];
}

export interface FloatingPop {
  id: number;
  text: string;
  x: number; // percentage
  y: number; // percentage
  colorType: 'gold' | 'violet' | 'ember';
  size: 'normal' | 'huge' | 'small';
}

class GameStateManager {
  private listeners: Set<() => void> = new Set();

  public match: FightMatch = {
    id: 108,
    charA: 'tung',
    charB: 'tralalero',
    stakeSol: 0.05,
    potSol: 0.85,
    status: 'live',
    auraA: 78,
    auraB: 64,
    damageA: 360,
    damageB: 540,
    txCount: 42,
    winner: null,
    timeLeftSeconds: 65,
    players: [
      {
        address: '7xKXtg...9Ab2',
        isMe: true,
        team: 'A',
        damage: 180,
        emotes: { six7: 4, dab: 2, griddy: 1, quoicoubeh: 0 }
      },
      {
        address: '4mVPqr...1Dc9',
        isMe: false,
        team: 'A',
        damage: 180,
        emotes: { six7: 3, dab: 1, griddy: 0, quoicoubeh: 1 }
      },
      {
        address: '9zQWpl...3Fe8',
        isMe: false,
        team: 'B',
        damage: 260,
        emotes: { six7: 5, dab: 3, griddy: 1, quoicoubeh: 0 }
      },
      {
        address: '2bKLop...7Rt1',
        isMe: false,
        team: 'B',
        damage: 280,
        emotes: { six7: 6, dab: 2, griddy: 1, quoicoubeh: 0 }
      }
    ]
  };

  public points: number = 240;
  public earnedTotal: number = 520;
  public myTeam: 'A' | 'B' = 'A';
  public myPoseA: 'idle' | 'dab' | 'griddy' | 'quoicoubeh' | 'victory' | 'hit' = 'idle';
  public myPoseB: 'idle' | 'dab' | 'griddy' | 'quoicoubeh' | 'victory' | 'hit' = 'idle';
  public floatingPops: FloatingPop[] = [];
  public screenShake: boolean = false;
  public activeMiniGameIndex: number = 0;
  private popCounter: number = 0;
  private timerInterval: NodeJS.Timeout | null = null;
  private botInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startLoop();
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  private startLoop() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.botInterval) clearInterval(this.botInterval);

    this.timerInterval = setInterval(() => {
      if (this.match.status === 'live') {
        if (this.match.timeLeftSeconds > 0) {
          this.match.timeLeftSeconds -= 1;

          // Rotate 10-second mini-game
          if (this.match.timeLeftSeconds % 10 === 0) {
            this.activeMiniGameIndex = (this.activeMiniGameIndex + 1) % 5;
          }
        } else {
          this.finishMatch();
        }
        this.notify();
      }
    }, 1000);

    // Simulate crowd battle on the Ephemeral Rollup (sub-50ms high activity)
    this.botInterval = setInterval(() => {
      if (this.match.status === 'live') {
        const botTeam = Math.random() > 0.5 ? 'A' : 'B';
        const randomEmote = EMOTES[Math.floor(Math.random() * EMOTES.length)];
        this.applyEmote(botTeam, randomEmote.id, false);
      }
    }, 2800);
  }

  public earnPoints(pts: number) {
    this.points = Math.max(0, this.points + pts);
    if (pts > 0) this.earnedTotal += pts;
    this.notify();
  }

  public triggerEmote(emoteId: string): boolean {
    const emote = EMOTES.find(e => e.id === emoteId);
    if (!emote) return false;
    if (this.points < emote.cost) return false;

    this.points -= emote.cost;
    this.applyEmote(this.myTeam, emoteId, true);
    return true;
  }

  private applyEmote(team: 'A' | 'B', emoteId: string, isMe: boolean) {
    const emote = EMOTES.find(e => e.id === emoteId);
    if (!emote) return;

    soundEngine.play(emote.sfx);

    // Update poses
    if (team === 'A') {
      this.myPoseA = emoteId as any;
      this.myPoseB = 'hit';
      setTimeout(() => {
        if (this.match.status === 'live') {
          this.myPoseA = 'idle';
          this.myPoseB = 'idle';
          this.notify();
        }
      }, 700);
    } else {
      this.myPoseB = emoteId as any;
      this.myPoseA = 'hit';
      setTimeout(() => {
        if (this.match.status === 'live') {
          this.myPoseA = 'idle';
          this.myPoseB = 'idle';
          this.notify();
        }
      }, 700);
    }

    // Damage drain on enemy team
    const drain = emote.raw * 0.9;
    if (team === 'A') {
      this.match.auraB = Math.max(0, Math.round(this.match.auraB - drain));
      this.match.damageB += emote.raw * 10;
      if (this.match.auraB <= 0) {
        this.match.winner = 'A';
        this.finishMatch();
      }
    } else {
      this.match.auraA = Math.max(0, Math.round(this.match.auraA - drain));
      this.match.damageA += emote.raw * 10;
      if (this.match.auraA <= 0) {
        this.match.winner = 'B';
        this.finishMatch();
      }
    }

    this.match.txCount += 1;

    // Trigger Screen Shake & Popups
    if (emote.raw >= 14) {
      this.triggerShake();
    }

    // Spawn floating pop
    const popX = team === 'A' ? 35 + Math.random() * 15 : 55 + Math.random() * 15;
    const popY = 40 + Math.random() * 20;
    this.spawnPop(emote.name.toUpperCase(), popX, popY, emote.raw >= 20 ? 'huge' : 'normal');

    // Update player record
    if (isMe) {
      const me = this.match.players.find(p => p.isMe);
      if (me) {
        me.damage += emote.raw * 10;
        me.emotes[emoteId] = (me.emotes[emoteId] || 0) + 1;
      }
    }

    this.notify();
  }

  public spawnPop(text: string, x: number, y: number, size: 'normal' | 'huge' | 'small' = 'normal') {
    const id = ++this.popCounter;
    const colorType = size === 'huge' ? 'gold' : Math.random() > 0.5 ? 'violet' : 'ember';
    this.floatingPops.push({ id, text, x, y, colorType, size });

    setTimeout(() => {
      this.floatingPops = this.floatingPops.filter(p => p.id !== id);
      this.notify();
    }, 700);
  }

  public triggerShake() {
    this.screenShake = true;
    setTimeout(() => {
      this.screenShake = false;
      this.notify();
    }, 350);
  }

  public finishMatch() {
    this.match.status = 'finished';
    if (!this.match.winner) {
      this.match.winner = this.match.auraA >= this.match.auraB ? 'A' : 'B';
    }

    soundEngine.playKO();

    if (this.match.winner === 'A') {
      this.myPoseA = 'victory';
      this.myPoseB = 'hit';
    } else {
      this.myPoseB = 'victory';
      this.myPoseA = 'hit';
    }

    this.spawnPop('K.O. !', 50, 45, 'huge');
    this.notify();
  }

  public restartMatch(charA: string = 'tung', charB: string = 'tralalero', stake: number = 0.05) {
    this.match = {
      id: Math.floor(100 + Math.random() * 900),
      charA,
      charB,
      stakeSol: stake,
      potSol: stake * 8,
      status: 'live',
      auraA: 100,
      auraB: 100,
      damageA: 0,
      damageB: 0,
      txCount: 1,
      winner: null,
      timeLeftSeconds: 90,
      players: [
        {
          address: '7xKXtg...9Ab2',
          isMe: true,
          team: this.myTeam,
          damage: 0,
          emotes: { six7: 0, dab: 0, griddy: 0, quoicoubeh: 0 }
        },
        {
          address: '4mVPqr...1Dc9',
          isMe: false,
          team: 'A',
          damage: 0,
          emotes: { six7: 0, dab: 0, griddy: 0, quoicoubeh: 0 }
        },
        {
          address: '9zQWpl...3Fe8',
          isMe: false,
          team: 'B',
          damage: 0,
          emotes: { six7: 0, dab: 0, griddy: 0, quoicoubeh: 0 }
        }
      ]
    };

    this.points = 180;
    this.myPoseA = 'idle';
    this.myPoseB = 'idle';
    this.startLoop();
    this.notify();
  }
}

export const gameState = new GameStateManager();
