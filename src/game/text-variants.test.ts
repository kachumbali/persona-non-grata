import { describe, expect, it } from "vitest";
import { textVariant } from "./text-variants";

describe("text variants", () => {
  it("preserves old content and chooses reproducibly without consuming random state", () => {
    expect(textVariant("original", undefined, 23, "a")).toBe("original");
    const variants = ["one", "two", "three"];
    const first = textVariant("original", variants, 23, "dialogue:one");
    expect(textVariant("original", variants, 23, "dialogue:one")).toBe(first);
    expect(["original", ...variants]).toContain(first);
    expect(
      new Set(
        Array.from({ length: 40 }, (_, seed) =>
          textVariant("original", variants, seed, "dialogue:one"),
        ),
      ).size,
    ).toBe(4);
  });
});
