import { describe, expect, it } from "vitest";
import { campaign as activeCampaign } from "./rules";
import portraitData from "./data/portraits.json";
import { useGame } from "./store";

type PortraitEntry = { id: string; file: string; gender: string; reservedFor?: string };
const portraits: PortraitEntry[] = portraitData;
const campaign = activeCampaign();
const files = import.meta.glob("@/assets/portraits/*.png", { eager: true, import: "default" });

describe("portrait manifest", () => {
  it("gives each NPC an existing portrait matching their gender", () => {
    for (const npc of campaign.characters) {
      expect(["female", "male"], npc.id).toContain(npc.gender);
      const entry = portraits.find((portrait) => portrait.id === npc.portrait);
      expect(entry, npc.id).toBeDefined();
      expect(entry?.gender, npc.id).toBe(npc.gender);
      expect(files[`/src/assets/portraits/${entry?.file}`], npc.id).toBeDefined();
      expect(!entry?.reservedFor || entry.reservedFor === npc.id, npc.id).toBe(true);
    }
  });
  it("requires unique assignments once enough eligible portraits exist", () => {
    for (const gender of ["female", "male"]) {
      const npcs = campaign.characters.filter((npc) => npc.gender === gender);
      const eligible = portraits.filter(
        (p) => p.gender === gender && (!p.reservedFor || npcs.some((n) => n.id === p.reservedFor)),
      );
      if (eligible.length >= npcs.length)
        expect(new Set(npcs.map((npc) => npc.portrait)).size).toBe(npcs.length);
    }
  });
  it("migrates a version 6 player's face and preserves existing portrait ids", async () => {
    const migrate = useGame.persist.getOptions().migrate!;
    const character = { title: "Mx", name: "Test", face: 3, bio: "", traits: [] };
    const migrated = await migrate({ character }, 6);
    expect(migrated.character).toMatchObject({ portrait: "diplomat-4" });
    expect(migrated.character).not.toHaveProperty("face");
    const existing = await migrate({ character: { ...character, portrait: "custom" } }, 6);
    expect(existing.character?.portrait).toBe("custom");
  });
});
