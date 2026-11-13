const SKINS = ["var(--skin-1)", "var(--skin-2)", "var(--skin-3)", "var(--skin-4)"];
const HAIR = ["var(--foreground)", "var(--accent)", "var(--muted-foreground)", "var(--destructive)"];

/** 8 flat-vector faces built from skin/hair/accessory combinations. */
export function Portrait({ face, size = 64 }: { face: number; size?: number }) {
  const skin = SKINS[face % 4];
  const hair = HAIR[(face * 3) % 4];
  const glasses = face % 3 === 0;
  const longHair = face % 2 === 1;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-label={`Portrait ${face + 1}`}>
      <rect width="64" height="64" fill="var(--secondary)" opacity="0.35" />
      {longHair && <rect x="14" y="18" width="36" height="34" rx="12" fill={hair} />}
      <path d="M10 64c2-12 11-17 22-17s20 5 22 17z" fill="var(--primary)" />
      <path d="M28 47h8l-4 8z" fill="var(--card)" />
      <ellipse cx="32" cy="30" rx="13" ry="15" fill={skin} />
      <path d={face % 4 === 2 ? "M19 26c0-11 26-11 26 0-4-5-22-5-26 0z" : "M18 28c-1-14 29-16 28 0-3-7-10-9-14-9s-11 2-14 9z"} fill={hair} />
      <circle cx="27" cy="31" r="1.6" fill="var(--foreground)" />
      <circle cx="37" cy="31" r="1.6" fill="var(--foreground)" />
      {glasses && (<g fill="none" stroke="var(--foreground)" strokeWidth="1.2"><circle cx="27" cy="31" r="4" /><circle cx="37" cy="31" r="4" /><path d="M31 31h2" /></g>)}
      <path d={face % 2 ? "M28 38q4 2 8 0" : "M28 38h8"} stroke="var(--foreground)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}
