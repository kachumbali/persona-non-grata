import portraits from "../data/portraits.json";
import campaignData from "../data/campaign.json";

if (import.meta.env.DEV) {
  const assigned = new Map<string, string[]>();
  for (const npc of campaignData.characters) {
    const names = assigned.get(npc.portrait) ?? [];
    names.push(npc.id);
    assigned.set(npc.portrait, names);
  }
  for (const [portrait, names] of assigned) {
    if (names.length > 1)
      console.warn(`Portrait ${portrait} is shared by NPCs: ${names.join(", ")}`);
  }
}

const images = import.meta.glob<string>("@/assets/portraits/*.png", {
  eager: true,
  import: "default",
});

export function Portrait({ portrait, size = 64 }: { portrait?: string; size?: number }) {
  const id = portrait;
  const entry = portraits.find((item) => item.id === id);
  const src = entry && images[`/src/assets/portraits/${entry.file}`];
  const height = Math.round((size * 4) / 3);
  if (!src)
    return (
      <span
        className="pixel-portrait"
        role="img"
        aria-label="Unknown portrait"
        style={{ width: size, height, display: "grid", placeItems: "center" }}
      >
        <svg viewBox="0 0 96 128" width="100%" height="100%" aria-hidden="true">
          <circle cx="48" cy="43" r="19" fill="currentColor" />
          <path d="M12 120c2-34 16-51 36-51s34 17 36 51" fill="currentColor" />
        </svg>
      </span>
    );
  return (
    <img
      className="pixel-portrait"
      src={src}
      width={size}
      height={height}
      alt={`Portrait: ${entry.look}`}
    />
  );
}
