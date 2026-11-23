import { describe, expect, it } from "vitest";
import { TRACKS, trackFor, useMusicSettings } from "./music";

describe("soundtrack", () => {
  it("plays the title track on the menu and the debrief track after the ending", () => {
    expect(trackFor("title", 7, 15, false)).toBe("title");
    expect(trackFor("play", 15, 15, true)).toBe("ending");
  });

  it("splits a 15-day posting into thirds", () => {
    expect([1, 5, 6, 10, 11, 15].map((d) => trackFor("play", d, 15, false))).toEqual([
      "early",
      "early",
      "middle",
      "middle",
      "late",
      "late",
    ]);
  });

  it("has a URL for every track", () => {
    for (const url of Object.values(TRACKS)) expect(url).toMatch(/\.mp3$/);
  });

  it("remembers the music switch", () => {
    const before = useMusicSettings.getState().muted;
    useMusicSettings.getState().toggle();
    expect(useMusicSettings.getState().muted).toBe(!before);
    expect(localStorage.getItem("persona-non-grata-music-muted")).toBe(before ? "0" : "1");
    useMusicSettings.getState().toggle();
  });
});
