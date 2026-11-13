class SoundManager {
  private playTone(freq: number, duration: number, type: OscillatorType = "sine") {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }

  playGong() {
    this.playTone(180, 1.5, "triangle");
  }

  playBuzzer() {
    this.playTone(320, 0.8, "sawtooth");
  }

  playClick() {
    this.playTone(800, 0.08, "sine");
  }

  playPoint() {
    this.playTone(1050, 0.15, "sine");
  }

  playWarning() {
    this.playTone(440, 0.4, "square");
  }

  playShuffle() {
    this.playTone(600, 0.1, "sine");
  }
}

export const sound = new SoundManager();
