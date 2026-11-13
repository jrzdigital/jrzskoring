import { sound } from "../utils/sound";

export const audioSynth = {
  playHorn: () => sound.playGong(),
  playBuzzer: () => sound.playBuzzer()
};
