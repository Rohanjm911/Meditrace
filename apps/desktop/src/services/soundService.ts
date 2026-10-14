/**
 * MediTrace Acoustic UI Sound Service
 * Synthesizes ultra-clean, tactile, low-latency micro-interaction sound effects
 * using the browser & Electron native Web Audio API (zero external assets or downloads).
 */

class SoundService {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.12; // Gentle, non-intrusive default volume

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('meditrace_sound_enabled');
      this.isEnabled = stored !== null ? stored === 'true' : true;
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getSoundEnabled(): boolean {
    return this.isEnabled;
  }

  public toggleSound(): boolean {
    this.isEnabled = !this.isEnabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('meditrace_sound_enabled', String(this.isEnabled));
    }
    if (this.isEnabled) {
      this.playToggle();
    }
    return this.isEnabled;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('meditrace_sound_enabled', String(enabled));
    }
  }

  /**
   * Subtle tactile UI click (buttons, tabs, navigation)
   */
  public playClick(): void {
    if (!this.isEnabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(380, ctx.currentTime + 0.025);

      gain.gain.setValueAtTime(this.volume * 0.7, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.026);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Action initiated / compilation started tone
   */
  public playActionStart(): void {
    if (!this.isEnabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(this.volume * 0.6, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }

  /**
   * Pleasant ascending major-chord chime on successful export / download / operation
   */
  public playSuccess(): void {
    if (!this.isEnabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      // Arpeggiated C-Major bell chord: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + i * 0.045;
        const dur = 0.28;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(this.volume * 0.85, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + dur + 0.01);
      });
    } catch {}
  }

  /**
   * Airy pop / whoosh when opening a preview modal or drawer
   */
  public playModalOpen(): void {
    if (!this.isEnabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(580, ctx.currentTime + 0.045);

      gain.gain.setValueAtTime(this.volume * 0.7, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.055);
    } catch {}
  }

  /**
   * Soft dampened pop when closing modal
   */
  public playModalClose(): void {
    if (!this.isEnabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(this.volume * 0.6, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.045);
    } catch {}
  }

  /**
   * Soft warning / error tone
   */
  public playError(): void {
    if (!this.isEnabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const notes = [380, 290];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + i * 0.06;
        const dur = 0.12;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(this.volume * 0.8, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + dur + 0.01);
      });
    } catch {}
  }

  /**
   * Caution / warning alert ping
   */
  public playWarning(): void {
    if (!this.isEnabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const notes = [640, 520];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + i * 0.07;
        const dur = 0.14;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(this.volume * 0.75, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + dur + 0.01);
      });
    } catch {}
  }

  /**
   * Discrepancy / thermal excursion alarm sound
   */
  public playDiscrepancy(): void {
    this.playWarning();
  }

  /**
   * Crisp toggle tick
   */
  public playToggle(): void {
    if (!this.isEnabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(980, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.015);

      gain.gain.setValueAtTime(this.volume * 0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.015);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.016);
    } catch {}
  }
}

export const soundService = new SoundService();
