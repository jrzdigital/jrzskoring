/**
 * Web Audio API Sound Synthesizer untuk Pertandingan Pencak Silat
 * Menghasilkan suara Gong, Peluit/Bell, dan Buzzer secara murni menggunakan Web Audio API.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Suara Gong Besar: Dihapuskan dan digantikan sepenuhnya dengan sound Buzzer Arena resmi
   */
  public playGong() {
    this.playBuzzer();
  }

  /**
   * Suara Bell / Peluit Pembuka & Penutup Penampilan
   */
  public playBell() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.05);

      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.3);
    } catch (e) {
      console.warn('AudioContext playback error', e);
    }
  }

  /**
   * Suara Buzzer Peringatan (misal waktu sisa 30 detik atau kesalahan fatal)
   */
  public playBuzzer() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.setValueAtTime(0.5, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.55);
    } catch (e) {
      console.warn('AudioContext playback error', e);
    }
  }

  /**
   * 2x Beep untuk Peringatan Waktu 30 Detik
   */
  public playWarningBeeps() {
    this.playBell();
    setTimeout(() => {
      this.playBell();
    }, 250);
  }
}

export const soundFx = new SoundSynthesizer();
