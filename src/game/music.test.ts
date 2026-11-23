import { describe, expect, it } from "vitest";
import { TRACKS, trackFor, useMusicSettings, type MusicMoment } from "./music";

const day: MusicMoment = {
  screen: "play",
  ended: false,
  evening: false,
  view: "city",
  location: "embassy",
};

describe("soundtrack", () => {
  it("picks the track for each moment", () => {
    expect(trackFor({ ...day, screen: "title" })).toBe("title");
    expect(trackFor(day)).toBe("city");
    expect(trackFor({ ...day, view: "place" })).toBe("office");
    expect(trackFor({ ...day, view: "place", location: "hotel" })).toBe("outside");
    expect(trackFor({ ...day, view: "place", evening: true })).toBe("evening");
    expect(trackFor({ ...day, ended: true })).toBe("evening");
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
