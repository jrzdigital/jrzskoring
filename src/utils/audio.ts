import { sound } from "./sound";

export const soundManager = sound;

export function playPointSound(type?: string) {
  sound.playPoint();
}

export function playBuzzerSound() {
  sound.playBuzzer();
}

export function playGongSound() {
  sound.playGong();
}

export function playSoundByKey(key: string) {
  if (key === "gong") sound.playGong();
  else if (key === "buzzer" || key === "short_beep") sound.playBuzzer();
  else if (key === "success_chime") soundEffects.playChime();
  else sound.playClick();
}

export const soundEffects = {
  playClick: () => sound.playClick(),
  playGong: () => sound.playGong(),
  playBuzzer: () => sound.playBuzzer(),
  playPoint: () => sound.playPoint(),
  playWhistle: () => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(2400, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  },
  playChime: () => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.3);
      });
    } catch {}
  }
};
