import { create } from "zustand";
import credentialsAtDawn from "@/assets/audio/credentials-at-dawn.mp3.asset.json";
import inTriplicate from "@/assets/audio/in-triplicate.mp3.asset.json";
import seventeenPointSix from "@/assets/audio/seventeen-point-six-percent.mp3.asset.json";
import theQuietAmendment from "@/assets/audio/the-quiet-amendment.mp3.asset.json";
import afterTheLastCable from "@/assets/audio/after-the-last-cable.mp3.asset.json";

import ambient from "@/assets/audio/06-ambient.mp3";
import ambient2 from "@/assets/audio/06-ambient-2.mp3";
import ambient3 from "@/assets/audio/06-ambient-3.mp3";
import ambient4 from "@/assets/audio/06-ambient-4.mp3";
import pop from "@/assets/audio/06-pop.mp3";
import pop2 from "@/assets/audio/06-pop-2.mp3";
import pop3 from "@/assets/audio/06-pop-3.mp3";
import pop4 from "@/assets/audio/06-pop-4.mp3";

/**
 * The soundtrack: one playlist per moment, played in turn. The five jazz pieces are hosted Lovable
 * assets (the .asset.json files hold their URLs); the ambient and pop loops are bundled MP3s.
 */
export const PLAYLISTS = {
  title: [credentialsAtDawn.url, pop],
  office: [inTriplicate.url, ambient, ambient2],
  city: [seventeenPointSix.url, pop2, pop3],
  outside: [theQuietAmendment.url, pop4, ambient3],
  evening: [afterTheLastCable.url, ambient4],
} as const satisfies Record<string, readonly string[]>;
export type TrackId = keyof typeof PLAYLISTS;

export interface MusicMoment {
  screen: "title" | "play";
  ended: boolean;
  evening: boolean;
  view: "city" | "place";
  location: string;
}

/**
 * Which track fits the moment: the menu and character builder, the evening block and the debrief,
 * the town map, the embassy office, and every other place.
 */
export function trackFor(m: MusicMoment): TrackId {
  if (m.screen === "title") return "title";
  if (m.ended || m.evening) return "evening";
  if (m.view === "city") return "city";
  return m.location === "embassy" ? "office" : "outside";
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

/** Plays the moment's playlist in turn and crossfades whenever the track or the moment changes. */
class MusicPlayer {
  private current: HTMLAudioElement | null = null;
  private wanted: TrackId | null = null;
  private playing: TrackId | null = null;
  private unlocked = false;
  /** Where each playlist stands, so coming back to a moment carries on with its next track. */
  private position: Partial<Record<TrackId, number>> = {};
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
    this.start(this.wanted);
  }

  private start(scene: TrackId, failures = 0) {
    const list = PLAYLISTS[scene];
    const index = (this.position[scene] ?? 0) % list.length;
    const next = new Audio(list[index]);
    next.volume = 0;
    let advanced = false;
    const advance = (failed: boolean) => {
      if (advanced || this.current !== next) return;
      advanced = true;
      this.position[scene] = index + 1;
      // A track that will not load (say, a hosted file in local dev) is skipped; when none load, stay silent.
      if (!failed) this.start(scene);
      else if (failures + 1 < list.length) this.start(scene, failures + 1);
    };
    // Fade into the next track just before this one ends.
    next.addEventListener("timeupdate", () => {
      if (next.duration && next.duration - next.currentTime < FADE_MS / 1000) advance(false);
    });
    next.addEventListener("ended", () => advance(false));
    next.addEventListener("error", () => advance(true));
    next.play().catch(() => {
      // Blocked playback: the error event (if any) moves on; otherwise stay silent.
    });
    if (this.current) this.fade(this.current, 0, true);
    this.fade(next, VOLUME, false);
    this.current = next;
    this.playing = scene;
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
