import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  absTime, applyEffects, DAY_END, DAY_START, EMAILS, ESCALATE_AFTER, LAST_DAY, pickEnding, START_METERS,
  type Action, type Ending, type Meters,
} from "./rules";

export interface Character { title: string; name: string; face: number; bio: string; traits: string[] }
export interface LogEntry { day: number; time: number; text: string }

interface GameState {
  character: Character | null;
  day: number; minute: number; speed: 1 | 2 | 4; paused: boolean;
  meters: Meters;
  handled: Record<string, string>; // emailId -> action or "ignored"
  log: LogEntry[];
  ending: Ending | null;
  start: (c: Character) => void;
  tick: (gameMinutes: number) => void;
  setSpeed: (s: 1 | 2 | 4) => void;
  togglePause: () => void;
  answer: (id: string, action: Action) => void;
  reset: () => void;
}

const initial = { character: null, day: 1, minute: DAY_START, speed: 1 as const, paused: false, meters: START_METERS, handled: {}, log: [], ending: null };

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      ...initial,
      start: (c) => set({ ...initial, character: c, log: [{ day: 1, time: DAY_START, text: "You arrive. The Ambassador's office is empty except for a cat." }] }),
      setSpeed: (speed) => set({ speed }),
      togglePause: () => set((s) => ({ paused: !s.paused })),
      answer: (id, action) => {
        const s = get();
        const e = EMAILS.find((x) => x.id === id);
        const o = e?.options[action];
        if (!e || !o || s.handled[id]) return;
        const meters = applyEffects(s.meters, o.effects);
        set({ meters, handled: { ...s.handled, [id]: action }, log: [...s.log, { day: s.day, time: s.minute, text: o.text }], ending: pickEnding(meters, false) });
      },
      tick: (dm) => {
        const s = get();
        if (s.paused || s.ending || !s.character) return;
        let { day, minute, meters } = s;
        const handled = { ...s.handled };
        const log = [...s.log];
        minute += dm;
        let finished = false;
        if (minute >= DAY_END) {
          if (day >= LAST_DAY) { finished = true; minute = DAY_END; }
          else { day += 1; minute = DAY_START; log.push({ day, time: DAY_START, text: `Day ${day}. ${LAST_DAY - day} working days until the Minister lands.` }); }
        }
        const now = absTime(day, minute);
        for (const e of EMAILS) {
          if (handled[e.id]) continue;
          const arrived = absTime(e.day, e.time);
          // escalate after ESCALATE_AFTER minutes, or overnight
          if (now >= arrived + ESCALATE_AFTER || (day > e.day && minute >= DAY_START + 30)) {
            handled[e.id] = "ignored";
            meters = applyEffects(meters, e.ignore.effects);
            log.push({ day, time: minute, text: `Ignored "${e.subject}": ${e.ignore.text}` });
          }
        }
        set({ day, minute, meters, handled, log, ending: pickEnding(meters, finished) });
      },
      reset: () => set({ ...initial }),
    }),
    { name: "persona-non-grata-save", partialize: (s) => { const { start, tick, setSpeed, togglePause, answer, reset, ...rest } = s; void start; void tick; void setSpeed; void togglePause; void answer; void reset; return rest; } },
  ),
);

export function inboxFor(day: number, minute: number, handled: Record<string, string>) {
  const now = absTime(day, minute);
  return EMAILS.filter((e) => absTime(e.day, e.time) <= now).map((e) => ({ ...e, status: handled[e.id] }));
}
