#!/usr/bin/env node
// Offline, deterministic MIDI and stereo PCM renderer. No audio service required.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MidiWriter from "midi-writer-js";

const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log(
    "Usage: node scripts/make-track.mjs --style ambient|pop [--seed INTEGER] [--name NAME]",
  );
  process.exit(0);
}
const options = {};
for (let i = 0; i < args.length; i += 2) {
  if (
    !["--style", "--seed", "--name"].includes(args[i]) ||
    args[i + 1] === undefined ||
    options[args[i]] !== undefined
  ) {
    throw new Error("Expected --style ambient|pop [--seed INTEGER] [--name NAME]");
  }
  options[args[i]] = args[i + 1];
}
const style = options["--style"];
const seedText = options["--seed"] ?? "1";
const name = options["--name"] ?? style;
if (
  !["ambient", "pop"].includes(style) ||
  !/^-?\d+$/.test(seedText) ||
  !Number.isSafeInteger(Number(seedText)) ||
  !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)
) {
  throw new Error("Expected --style ambient|pop and an integer --seed");
}
let state = Number(seedText) >>> 0;
function random() {
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return state / 4294967296;
}
const rate = 48000;
const bpm = style === "ambient" ? 80 : 108;
const beats = 160; // Both styles are exactly 40 bars of 4/4.
const length = Math.round((beats * 60 * rate) / bpm);
const left = new Float32Array(length);
const right = new Float32Array(length);
const events = [];
function note(part, pitch, beat, duration, velocity, channel = 1) {
  if (beat >= beats) return;
  events.push({ part, pitch, beat, duration: Math.min(duration, beats - beat), velocity, channel });
}
if (style === "ambient") {
  // D Dorian: D E F G A B C. Four eight-beat harmonic colours.
  const chords = [
    [50, 57, 60, 64],
    [48, 55, 59, 62],
    [46, 53, 57, 62],
    [48, 55, 60, 64],
  ];
  for (let b = 0; b < beats; b += 8) {
    const chord = chords[(b / 8) % chords.length];
    chord.forEach((p) => note("pad", p, b, 7.8, 42));
    note("sub", chord[0] - 12, b, 7.5, 37);
    for (let i = 0; i < 8; i++) {
      if (random() < 0.78)
        note(
          "arp",
          chord[(i + Math.floor(random() * 2)) % 4] + 12,
          b + i,
          0.6,
          27 + Math.floor(random() * 10),
        );
      if (random() < 0.12) note("shaker", 70, b + i + 0.5, 0.1, 18, 10);
    }
  }
} else {
  const chords = [
    [55, 59, 62],
    [54, 59, 62],
    [52, 55, 59],
    [48, 52, 55],
  ];
  const roots = [43, 38, 40, 36];
  let melody = [
    74, 71, 67, 71, 74, 76, 74, 71, 69, 71, 74, 71, 69, 67, 66, 69, 71, 74, 76, 74, 71, 69, 67, 71,
    72, 71, 69, 67, 69, 71, 67, 67,
  ];
  // Alternative seeds create a new eight-bar hook, repeated with small variations.
  if (Number(seedText) !== 1) {
    melody = Array.from({ length: 32 }, (_, i) => {
      const chord = chords[Math.floor(i / 4) % 4];
      const choices = [chord[0] + 12, chord[1] + 12, chord[2] + 12, chord[0] + 24];
      return choices[Math.floor(random() * choices.length)];
    });
  }
  for (let b = 0; b < beats; b += 4) {
    const bar = b / 4,
      chord = chords[bar % 4];
    for (const offset of [0, 2]) chord.forEach((p) => note("piano", p, b + offset, 1.7, 55));
    for (const offset of [0, 1.5, 2, 3])
      note("bass", roots[bar % 4] + (offset === 3 ? 7 : 0), b + offset, 0.45, 64);
    for (let i = 0; i < 4; i++) {
      note("kick", 36, b + i, 0.12, i % 2 ? 56 : 78, 10);
      if (i % 2) note("snare", 38, b + i, 0.15, 55, 10);
      for (const off of [0, 0.5]) note("hat", 42, b + i + off, 0.06, off ? 28 : 35, 10);
    }
    for (let i = 0; i < 4; i++) {
      const index = (bar % 8) * 4 + i;
      if (random() > 0.13)
        note("lead", melody[index] + (bar >= 8 && random() < 0.09 ? 12 : 0), b + i, 0.72, 46);
    }
  }
}
// MIDI events use absolute ticks, preserving the same arrangement and exact loop length.
const tracks = [];
for (const part of [...new Set(events.map((e) => e.part))]) {
  const track = new MidiWriter.Track();
  track.setTempo(bpm);
  track.addTrackName(part);
  const programs = { pad: 89, sub: 39, arp: 81, piano: 5, bass: 34, lead: 81 };
  if (programs[part])
    track.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: programs[part] }));
  for (const e of events.filter((e) => e.part === part)) {
    track.addEvent(
      new MidiWriter.NoteEvent({
        pitch: [e.pitch],
        startTick: Math.round(e.beat * 128),
        duration: `T${Math.max(1, Math.round(e.duration * 128))}`,
        velocity: e.velocity,
        channel: e.channel,
      }),
    );
  }
  // A silent marker at the end ensures MIDI players retain the intended duration.
  track.addEvent(
    new MidiWriter.NoteEvent({
      pitch: [0],
      startTick: Math.round(beats * 128) - 1,
      duration: "T1",
      velocity: 0,
      channel: 16,
    }),
  );
  tracks.push(track);
}
const output = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/assets/audio");
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(
  path.join(output, `06-${name}.mid`),
  Buffer.from(new MidiWriter.Writer(tracks).buildFile()),
);

// Voices are mixed directly into the buffer; delay taps wrap around the loop.
function render(e) {
  const start = Math.round(((e.beat * 60) / bpm) * rate);
  const sustain = (e.duration * 60) / bpm;
  const release = e.part === "pad" ? 1.2 : e.part === "arp" ? 0.35 : 0.12;
  const total = Math.round((sustain + release) * rate);
  const freq = 440 * 2 ** ((e.pitch - 69) / 12);
  const amp = e.velocity / 127;
  const pan = e.part === "arp" ? 0.35 : e.part === "lead" ? -0.12 : 0;
  let noise = (Math.imul(e.pitch + 1, 2654435761) ^ start ^ state) >>> 0;
  for (let i = 0; i < total; i++) {
    const t = i / rate;
    const tail = t > sustain ? Math.max(0, 1 - (t - sustain) / release) : 1;
    let s = 0;
    if (e.part === "pad") {
      const env = Math.min(1, t / 1.4) * tail;
      s =
        (Math.sin(2 * Math.PI * freq * t) + 0.35 * Math.sin(2 * Math.PI * freq * 1.003 * t)) *
        env *
        0.055;
    } else if (e.part === "sub") {
      s = Math.sin(2 * Math.PI * freq * t) * Math.min(1, t / 0.15) * tail * 0.12;
    } else if (e.part === "arp") {
      s =
        Math.sin(2 * Math.PI * freq * t) *
        Math.min(1, t / 0.025) *
        Math.exp(-t * 1.8) *
        tail *
        0.075;
    } else if (e.part === "piano") {
      s =
        (Math.sin(
          2 * Math.PI * freq * t + 1.5 * Math.sin(2 * Math.PI * freq * 2 * t) * Math.exp(-t * 5),
        ) +
          0.15 * Math.sin(2 * Math.PI * freq * 2 * t)) *
        Math.exp(-t * 1.8) *
        tail *
        0.09;
    } else if (e.part === "bass") {
      s =
        (Math.sin(2 * Math.PI * freq * t) + 0.25 * Math.sin(4 * Math.PI * freq * t)) *
        Math.exp(-t * 3) *
        tail *
        0.18;
    } else if (e.part === "lead") {
      s =
        (Math.sin(2 * Math.PI * freq * t) + 0.2 * Math.sin(4 * Math.PI * freq * t)) *
        Math.min(1, t / 0.04) *
        tail *
        0.08;
    } else {
      noise = (Math.imul(noise, 1664525) + 1013904223) >>> 0;
      const n = noise / 2147483648 - 1;
      if (e.part === "kick")
        s =
          Math.sin(2 * Math.PI * (48 * t + (18 * (1 - Math.exp(-t * 25))) / 25)) *
          Math.exp(-t * 19) *
          0.3;
      else if (e.part === "snare")
        s = (n * 0.7 + Math.sin(2 * Math.PI * 180 * t) * 0.3) * Math.exp(-t * 23) * 0.13;
      else s = n * Math.exp(-t * (e.part === "hat" ? 65 : 35)) * (e.part === "hat" ? 0.045 : 0.035);
    }
    s *= amp;
    const at = (start + i) % length;
    left[at] += s * (1 - pan);
    right[at] += s * (1 + pan);
    if (e.part === "arp") {
      for (const [delay, gain] of [
        [0.375, 0.3],
        [0.75, 0.13],
      ]) {
        const j = (at + Math.round(delay * rate)) % length;
        left[j] += s * gain * 1.2;
        right[j] += s * gain * 0.8;
      }
    }
  }
}
for (const event of events) render(event);

// ITU-R BS.1770 K-weighting, 400 ms blocks, absolute and relative gates.
function weightedPower(input) {
  const stages = [
    [1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, 0.73248077421585],
    [1, -2, 1, -1.99004745483398, 0.99007225036621],
  ].map((c) => ({ c, x1: 0, x2: 0, y1: 0, y2: 0 }));
  const power = new Float64Array(input.length);
  for (let i = 0; i < input.length; i++) {
    let x = input[i];
    for (const f of stages) {
      const [b0, b1, b2, a1, a2] = f.c;
      const y = b0 * x + b1 * f.x1 + b2 * f.x2 - a1 * f.y1 - a2 * f.y2;
      f.x2 = f.x1;
      f.x1 = x;
      f.y2 = f.y1;
      f.y1 = y;
      x = y;
    }
    power[i] = x * x;
  }
  return power;
}
const lp = weightedPower(left),
  rp = weightedPower(right);
const block = rate * 0.4,
  step = rate * 0.1;
const powers = [];
for (let start = 0; start + block <= length; start += step) {
  let sum = 0;
  for (let i = start; i < start + block; i++) sum += lp[i] + rp[i];
  const p = sum / block;
  if (-0.691 + 10 * Math.log10(p) >= -70) powers.push(p);
}
const mean = (values) => values.reduce((a, b) => a + b, 0) / values.length;
const relativeGate = mean(powers) / 10;
const loudness = -0.691 + 10 * Math.log10(mean(powers.filter((p) => p >= relativeGate)));
let peak = 0;
for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
const gain = Math.min(10 ** ((-16 - loudness) / 20), 0.98 / peak);
// A short symmetric fade makes the exact sample boundary silent and click-free.
const fade = Math.round(rate * 0.025);
const wav = Buffer.alloc(44 + length * 4);
wav.write("RIFF", 0);
wav.writeUInt32LE(wav.length - 8, 4);
wav.write("WAVEfmt ", 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(rate, 24);
wav.writeUInt32LE(rate * 4, 28);
wav.writeUInt16LE(4, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(length * 4, 40);
for (let i = 0; i < length; i++) {
  const envelope = Math.min(1, i / fade, (length - 1 - i) / fade);
  wav.writeInt16LE(
    Math.round(Math.max(-1, Math.min(1, left[i] * gain * envelope)) * 32767),
    44 + i * 4,
  );
  wav.writeInt16LE(
    Math.round(Math.max(-1, Math.min(1, right[i] * gain * envelope)) * 32767),
    46 + i * 4,
  );
}
fs.writeFileSync(path.join(output, `06-${name}.wav`), wav);
console.log(
  `Wrote 06-${name}.{mid,wav}; estimated integrated loudness ${(loudness + 20 * Math.log10(gain)).toFixed(1)} LUFS${gain < 10 ** ((-16 - loudness) / 20) ? " (peak limited)" : ""}`,
);
