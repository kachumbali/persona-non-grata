import { CanvasTexture, NearestFilter, SRGBColorSpace } from "three";

export const SCENE_TOKENS = ["ground", "wall", "trim", "wood", "tile", "stone", "grass", "leaf", "ink", "paper", "blue", "red", "gold", "skin1", "skin2", "skin3", "skin4"] as const;
export type Palette = Record<typeof SCENE_TOKENS[number], string>;

// Resolve CSS colors through the browser, including oklch, before giving them to Three.js.
export function readPalette(): Palette {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) throw new Error("Pixel-art canvas unavailable");
  const css = getComputedStyle(document.documentElement);
  return Object.fromEntries(SCENE_TOKENS.map((key) => {
    ctx.fillStyle = css.getPropertyValue(`--embassy-${key}`).trim();
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return [key, `rgb(${r}, ${g}, ${b})`];
  })) as Palette;
}

function texture(canvas: HTMLCanvasElement) {
  const t = new CanvasTexture(canvas);
  t.magFilter = NearestFilter;
  t.minFilter = NearestFilter;
  t.colorSpace = SRGBColorSpace;
  return t;
}

export function floorTexture(kind: string, p: Palette) {
  const canvas = document.createElement("canvas");
  canvas.width = 64; canvas.height = 48;
  const ctx = canvas.getContext("2d");
  if (!ctx) return texture(canvas);
  ctx.fillStyle = kind === "checker" || kind === "tile" ? p.tile : kind === "wood" ? p.wood : kind === "grass" ? p.grass : p.stone;
  ctx.fillRect(0, 0, 64, 48);
  for (let y = 0; y < 48; y += 8) for (let x = 0; x < 64; x += 8) {
    ctx.fillStyle = kind === "checker" ? ((x + y) % 16 === 0 ? p.paper : p.blue) : p.ink;
    ctx.globalAlpha = kind === "checker" ? 0.35 : 0.12;
    if (kind === "wood") ctx.fillRect(x, y, 16, 1);
    else if (kind === "grass") ctx.fillRect(x + ((y * 3 + x) % 5), y + 2, 2, 2);
    else { ctx.fillRect(x, y, 8, 1); ctx.fillRect(x, y, 1, 8); }
  }
  ctx.globalAlpha = 1;
  return texture(canvas);
}

export function characterTexture(face: number, p: Palette, animal?: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 16; canvas.height = 24;
  const ctx = canvas.getContext("2d");
  if (!ctx) return texture(canvas);
  const rect = (color: string, x: number, y: number, w: number, h: number) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
  if (animal === "cat") {
    rect(p.ink, 3, 12, 10, 8); rect(p.ink, 3, 9, 3, 5); rect(p.ink, 10, 9, 3, 5);
    rect(p.gold, 5, 14, 2, 1); rect(p.gold, 10, 14, 2, 1); rect(p.paper, 7, 17, 3, 2);
    rect(p.ink, 12, 17, 3, 5); rect(p.ink, 2, 20, 3, 3);
  } else if (animal === "parrot") {
    rect(p.leaf, 5, 6, 6, 13); rect(p.red, 6, 6, 6, 4); rect(p.gold, 10, 10, 4, 3);
    rect(p.blue, 4, 13, 3, 9); rect(p.ink, 9, 8, 1, 1); rect(p.gold, 5, 21, 6, 1);
  } else {
    const skin = [p.skin1, p.skin2, p.skin3, p.skin4][face % 4] ?? p.skin1;
    const coat = [p.blue, p.red, p.leaf, p.ink, p.gold, p.paper, p.blue, p.red][face % 8] ?? p.blue;
    rect(p.ink, 5, 1, 7, 3); rect(skin, 4, 4, 9, 7); rect(p.ink, 4, 3, 2, 4);
    if (face % 2) rect(p.ink, 12, 3, 2, 9);
    rect(p.ink, 7, 6, 1, 1); rect(p.ink, 11, 6, 1, 1);
    if (face % 3 === 0) { rect(p.ink, 6, 5, 7, 1); rect(p.ink, 6, 7, 7, 1); }
    rect(p.red, 8, 9, 2, 1); rect(coat, 4, 11, 9, 9);
    rect(p.paper, 7, 11, 3, 6); rect(p.gold, 8, 13, 1, 5);
    rect(coat, 2, 12, 2, 6); rect(skin, 2, 18, 2, 2); rect(coat, 13, 12, 2, 6); rect(skin, 13, 18, 2, 2);
    rect(p.ink, 5, 20, 3, 4); rect(p.ink, 10, 20, 3, 4);
    if (face === 5) { rect(p.paper, 4, 0, 10, 3); rect(p.paper, 6, 0, 6, 5); }
  }
  return texture(canvas);
}