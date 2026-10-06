// Sound Engine for Street Smack
class SoundEngine {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private audioCtx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const audioFiles: Record<string, string> = {
        '67': '/audio/67.mp3',
        'dab': '/audio/dab.mp3',
        'griddy': '/audio/griddy.mp3',
        'quoicoubeh': '/audio/quoicoubeh.mp3',
      };

      for (const [key, path] of Object.entries(audioFiles)) {
        const audio = new Audio(path);
        audio.preload = 'auto';
        this.sounds.set(key, audio);
      }
    }
  }

  public play(id: string, volume: number = 0.8) {
    if (!this.enabled) return;
    try {
      const sound = this.sounds.get(id);
      if (sound) {
        sound.currentTime = 0;
        sound.volume = Math.max(0, Math.min(1, volume));
        sound.play().catch(() => {
          // Autoplay policy fallback: synthesize a fun retro beep
          this.playSynthesizedBeep(id);
        });
      } else {
        this.playSynthesizedBeep(id);
      }
    } catch {
      // Ignored
    }
  }

  public playHit() {
    this.playTone(180, 0.08, 'sawtooth');
  }

  public playCritical() {
    this.playTone(320, 0.15, 'square');
    setTimeout(() => this.playTone(480, 0.2, 'square'), 50);
  }

  public playKO() {
    this.playTone(120, 0.4, 'triangle');
    setTimeout(() => this.playTone(80, 0.6, 'sawtooth'), 200);
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine') {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {
      // AudioContext not allowed yet
    }
  }

  private playSynthesizedBeep(id: string) {
    switch (id) {
      case '67':
        this.playTone(440, 0.12, 'square');
        break;
      case 'dab':
        this.playTone(260, 0.18, 'sawtooth');
        break;
      case 'griddy':
        this.playTone(550, 0.15, 'triangle');
        break;
      case 'quoicoubeh':
        this.playTone(330, 0.25, 'sawtooth');
        break;
    }
  }

  public toggle(enabled?: boolean) {
    this.enabled = enabled !== undefined ? enabled : !this.enabled;
    return this.enabled;
  }
}

export const soundEngine = new SoundEngine();
