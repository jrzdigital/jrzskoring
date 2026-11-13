/**
 * Web Audio API synthesizer for Pencak Silat tournament sounds:
 * - Gong Bel Babak (Indonesian Traditional Bronze Gong synthesis)
 * - Buzzer Akhir Babak (Arena horn buzzer)
 * - Haptic/Click Juri (Tactile click feedback)
 * - Peluit Wasit (Referee whistle)
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Traditional Bronze Gong sound synthesis
  public playGong() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Fundamental deep gong tone (around 95Hz to 110Hz)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const osc3 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(104, now);
      osc1.frequency.exponentialRampToValueAtTime(98, now + 2.5);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(215, now);
      osc2.frequency.exponentialRampToValueAtTime(204, now + 1.8);

      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(328, now);

      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

      osc1.connect(gain);
      osc2.connect(gain);
      osc3.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);

      osc1.stop(now + 3.3);
      osc2.stop(now + 3.3);
      osc3.stop(now + 3.3);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // Tournament arena end-of-round horn buzzer
  public playBuzzer() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(330, now);

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(440, now);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.setValueAtTime(0.4, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.5);
      osc2.stop(now + 1.5);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // Judge tactile score hit beep
  public playJudgeClick(points: number = 1) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Higher tone for higher points
      const freq = points === 3 ? 880 : points === 2 ? 660 : 520;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);

      // Trigger mobile haptic vibration if supported
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(points * 40);
      }
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // Referee whistle double chirp
  public playWhistle() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2600, now);
      osc.frequency.exponentialRampToValueAtTime(2400, now + 0.15);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }
}

export const audioEngine = new SoundSynthesizer();
