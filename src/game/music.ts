import { create } from "zustand";
import credentialsAtDawn from "@/assets/audio/credentials-at-dawn.mp3.asset.json";
import inTriplicate from "@/assets/audio/in-triplicate.mp3.asset.json";
import seventeenPointSix from "@/assets/audio/seventeen-point-six-percent.mp3.asset.json";
import theQuietAmendment from "@/assets/audio/the-quiet-amendment.mp3.asset.json";
import afterTheLastCable from "@/assets/audio/after-the-last-cable.mp3.asset.json";

/** The soundtrack. The MP3s are hosted Lovable assets; the .asset.json files hold their URLs. */
export const TRACKS = {
  title: credentialsAtDawn.url,
  early: inTriplicate.url,
  middle: seventeenPointSix.url,
  late: theQuietAmendment.url,
  ending: afterTheLastCable.url,
} as const;
export type TrackId = keyof typeof TRACKS;

/** Which track fits the moment: menu and character builder, the posting in thirds, the debrief. */
export function trackFor(
  screen: "title" | "play",
  day: number,
  lastDay: number,
  ended: boolean,
): TrackId {
  if (screen === "title") return "title";
  if (ended) return "ending";
  const third = Math.max(1, lastDay) / 3;
  if (day <= third) return "early";
  if (day <= third * 2) return "middle";
  return "late";
}

const VOLUME = 0.3;
const FADE_MS = 1500;
const MUTE_KEY = "persona-non-grata-music-muted";

function readMuted(): boolean {
  try {
    return globalThis.localStorage?.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

/** The music on/off switch, kept in browser storage apart from the save slots. */
export const useMusicSettings = create<{ muted: boolean; toggle: () => void }>((set, get) => ({
  muted: readMuted(),
  toggle: () => {
    const muted = !get().muted;
    try {
      globalThis.localStorage?.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {
      // Storage blocked: the switch still works for this visit.
    }
    set({ muted });
    if (muted) player.stop();
    else player.resume();
  },
}));

/** Two looping audio elements that crossfade into each other when the track changes. */
class MusicPlayer {
  private current: HTMLAudioElement | null = null;
  private wanted: TrackId | null = null;
  private playing: TrackId | null = null;
  private unlocked = false;
  private timers = new Map<HTMLAudioElement, ReturnType<typeof setInterval>>();

  /** Browsers block sound until the player clicks or presses a key, so start on the first one. */
  install() {
    if (typeof window === "undefined" || import.meta.env.MODE === "test") return;
    const unlock = () => {
      this.unlocked = true;
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      this.resume();
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
  }

  want(track: TrackId) {
    this.wanted = track;
    this.resume();
  }

  resume() {
    if (!this.unlocked || !this.wanted || useMusicSettings.getState().muted) return;
    if (this.playing === this.wanted && this.current) return;
    const next = new Audio(TRACKS[this.wanted]);
    next.loop = true;
    next.volume = 0;
    next.play().catch(() => {
      // Missing file or blocked playback: stay silent rather than break the game.
    });
    if (this.current) this.fade(this.current, 0, true);
    this.fade(next, VOLUME, false);
    this.current = next;
    this.playing = this.wanted;
  }

  stop() {
    if (this.current) this.fade(this.current, 0, true);
    this.current = null;
    this.playing = null;
  }

  private fade(audio: HTMLAudioElement, to: number, thenPause: boolean) {
    const old = this.timers.get(audio);
    if (old) clearInterval(old);
    const from = audio.volume;
    const steps = FADE_MS / 50;
    let step = 0;
    const timer = setInterval(() => {
      step += 1;
      audio.volume = Math.min(1, Math.max(0, from + ((to - from) * step) / steps));
      if (step >= steps) {
        clearInterval(timer);
        this.timers.delete(audio);
        if (thenPause) {
          audio.pause();
          audio.removeAttribute("src");
          audio.load();
        }
      }
    }, 50);
    this.timers.set(audio, timer);
  }
}

export const player = new MusicPlayer();
