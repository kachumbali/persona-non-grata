#!/usr/bin/env node
/*
 * Q-03 playthrough: plays the 15-day game through the real browser UI and
 * reports bugs. It changes no game source; it only writes
 * playthrough-output/ (git-ignored) and docs/PLAYTHROUGH_REPORT.md.
 *
 *   npm run playthrough
 *
 * Needs Playwright with Chromium installed locally. Not part of `npm test` or CI.
 */
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "playthrough-output");
const REPORT = path.join(ROOT, "docs", "PLAYTHROUGH_REPORT.md");
const PORT = 5199;
const BASE = `http://127.0.0.1:${PORT}/`;
const MAX_BLOCKS = 70;
const STEP_TIMEOUT = 3000;
const STUCK_TIMEOUT = 10000;

const BUILDS = [
  { id: "A", traits: ["Reply-All Reflex", "Compulsive Démarche", "Name-dropper"] },
  { id: "B", traits: ["Functional Alcoholism", "Brussels Brain"] },
  { id: "C", traits: ["Pathologically Punctual", "Allergic to Local Cuisine"] },
];
const VIEWPORTS = [
  { id: "1280x900", width: 1280, height: 900 },
  { id: "400x800", width: 400, height: 800 },
];

const DIALOG = "[role=dialog], [role=alertdialog]";
const END_RE = /^End (morning|midday|afternoon|evening)\b/;
const SKIP_RE =
  /^(Close|Dismiss|Skip|Done reading|Go back|End |Personnel file|Who is who|Menu|PC$|Secure fax|Town|BlackBerry phone|Put phone away|Status|Diary|Mail|Mission Watch|Démarches|Agenda|Staff & diary|Courrielleur 98|Talk to |Travel|Enter |Leave|Read the secure fax|Use your PC|Plan an appointment|Show EU|Deal with it later|Painted view|Dismiss briefing)/;
const ACTION_RE =
  /·\s*\d+ DP|^(Reply|Delegate|Forward|Take Note|File|Send|Request|Copy|Ignore|Archive|Decline|Accept|Attend|Ask|Clip|Put|Schedule|Answer|Reject|Defer)/i;
// Raw ids: id-like strings taken from the content JSON under src/game (keys such as id, location,
// trait, flag). Ordinary hyphenated English ("in-tray") is not an id and is not flagged.
const ID_KEY_RE =
  /^(id|ids|.*Id|.*Ids|character|location|venue|trait|traits|flag|flags|task|outlet|event|portrait|stat|set|reads|requires.*|sets.*|gate.*)$/;
const ID_VALUE_RE = /^[a-z][a-z0-9]*(?:[-:_][a-z0-9]+)+$/;
const RAW_PREFIX_RE = /\b(?:trait|flag|task|event|outlet|venue|portrait|stat)[:][a-z0-9_-]+/g;
function loadContentIds() {
  const ids = new Set();
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith(".json")) {
        let data;
        try {
          data = JSON.parse(fs.readFileSync(p, "utf8"));
        } catch (e) {
          continue;
        }
        const visit = (node, key) => {
          if (typeof node === "string") {
            if (key && ID_KEY_RE.test(key) && ID_VALUE_RE.test(node) && node.length >= 5)
              ids.add(node);
          } else if (Array.isArray(node)) node.forEach((n) => visit(n, key));
          else if (node && typeof node === "object")
            for (const [k, v] of Object.entries(node)) visit(v, k);
        };
        visit(data, null);
      }
    }
  };
  walk(path.join(ROOT, "src", "game"));
  return [...ids];
}
let CONTENT_IDS = null;
const TEXT_BAD = [
  ["undefined", /\bundefined\b/g],
  ["null", /\bnull\b/g],
  ["NaN", /\bNaN\b/g],
  ["[object Object]", /\[object Object\]/g],
  ["unfilled placeholder", /\{[^{}\n]{0,60}\}/g],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function httpOk(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode < 500);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startServer() {
  if (await httpOk(BASE)) return { child: null };
  const child = spawn(
    "npx",
    ["vite", "dev", "--port", String(PORT), "--host", "127.0.0.1", "--strictPort"],
    {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child.stderr.on("data", () => {});
  child.stdout.on("data", () => {});
  for (let i = 0; i < 120; i++) {
    if (await httpOk(BASE)) return { child };
    await sleep(500);
  }
  child.kill();
  throw new Error("dev server did not respond at " + BASE);
}

/* ---------- small UI helpers, each returns null/false instead of throwing ---------- */

async function isVisible(loc) {
  try {
    return await loc.isVisible({ timeout: 300 });
  } catch (e) {
    return false;
  }
}

// Click the first visible button whose accessible name matches re (optionally inside scope).
// pick(n) chooses which of n visible candidates to use.
async function clickButton(page, re, { scope = null, pick = () => 0 } = {}) {
  try {
    const root = scope ? page.locator(scope) : page;
    const loc = root.getByRole("button", { name: re });
    const n = await loc.count();
    const vis = [];
    for (let i = 0; i < n; i++) {
      if (
        (await isVisible(loc.nth(i))) &&
        (await loc
          .nth(i)
          .isEnabled({ timeout: 300 })
          .catch(() => false))
      )
        vis.push(i);
    }
    if (!vis.length) return null;
    const el = loc.nth(vis[Math.min(pick(vis.length), vis.length - 1)]);
    const name = (
      (await el.getAttribute("aria-label")) ||
      (await el.innerText().catch(() => "")) ||
      ""
    )
      .trim()
      .replace(/\s+/g, " ");
    try {
      await el.click({ timeout: STEP_TIMEOUT });
    } catch (e) {
      await el.click({ timeout: STEP_TIMEOUT, force: true });
    }
    return name;
  } catch (e) {
    return null;
  }
}

async function visibleButtonNames(page, scope = null) {
  try {
    return await page.evaluate((sc) => {
      const root = sc ? document.querySelector(sc) : document;
      if (!root) return [];
      const out = [];
      root.querySelectorAll("button, [role=button]").forEach((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (r.width === 0 || r.height === 0 || cs.visibility === "hidden" || cs.display === "none")
          return;
        if (el.disabled) return;
        const name = (el.getAttribute("aria-label") || el.innerText || "")
          .trim()
          .replace(/\s+/g, " ");
        if (name) out.push(name);
      });
      return out;
    }, scope);
  } catch (e) {
    return [];
  }
}

async function dialogVisible(page) {
  return isVisible(page.locator(DIALOG).first());
}

async function dialogTitle(page) {
  try {
    return await page.evaluate((sel) => {
      const d = [...document.querySelectorAll(sel)].find(
        (e) => e.getBoundingClientRect().width > 0,
      );
      return d ? d.innerText.replace(/\s+/g, " ").slice(0, 120) : "";
    }, DIALOG);
  } catch (e) {
    return "";
  }
}

// Day from the header ("Day 4 / 15"); block from the visible "End <block>" button, which names the current block.
async function readClock(page) {
  try {
    return await page.evaluate(() => {
      const t = document.body.innerText;
      const d = /Day (\d+) \/ 15/i.exec(t);
      let block = null;
      for (const el of document.querySelectorAll("button")) {
        if (el.getBoundingClientRect().width === 0) continue;
        const m = /^End (morning|midday|afternoon|evening)\b/i.exec((el.innerText || "").trim());
        if (m) {
          block = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
          break;
        }
      }
      return { day: d ? Number(d[1]) : null, block };
    });
  } catch (e) {
    return { day: null, block: null };
  }
}

async function isEnding(page) {
  return isVisible(page.getByRole("button", { name: /Request a new posting/ }).first());
}

/* ---------- recording ---------- */

function newRecord(build, vp) {
  return {
    build: build.id,
    traits: build.traits.join(" + "),
    viewport: vp.id,
    blocksPlayed: 0,
    stop: null,
    findings: [],
    ctx: { day: null, block: null },
  };
}

function add(rec, type, text, extra = "") {
  const where = `day ${rec.ctx.day ?? "?"} ${rec.ctx.block ?? "?"}`;
  rec.findings.push({ type, text: String(text).slice(0, 300), where, extra });
}

/* ---------- text and layout checks ---------- */

// Pure. The raw ids in a page's text, as [id, index] pairs. A colon id (trait:x, flag:x) is always
// raw. A content id with hyphens is raw only where it stands alone (a line or label of at most two
// words): "Mira cancelled the clean-port programme." is ordinary prose, so it is not flagged.
function standsAlone(body, start) {
  const lineStart = body.lastIndexOf("\n", start - 1) + 1;
  let lineEnd = body.indexOf("\n", start);
  if (lineEnd < 0) lineEnd = body.length;
  return body.slice(lineStart, lineEnd).trim().split(/\s+/).filter(Boolean).length <= 2;
}
function rawIdHits(body, ids) {
  const hits = new Map();
  RAW_PREFIX_RE.lastIndex = 0;
  let m;
  while ((m = RAW_PREFIX_RE.exec(body))) hits.set(m[0], m.index);
  for (const id of ids) {
    if (!body.includes(id)) continue;
    const re = new RegExp("(?<![\\w-])" + esc(id) + "(?![\\w-])", "g");
    let hit;
    while ((hit = re.exec(body))) {
      if (standsAlone(body, hit.index)) {
        hits.set(id, hit.index);
        break;
      }
    }
  }
  return [...hits];
}

async function scanText(page, rec) {
  let body = "";
  try {
    body = await page.evaluate(() => document.body.innerText);
  } catch (e) {
    return;
  }
  const seen = new Set();
  for (const [label, re] of TEXT_BAD) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(body)) && seen.size < 40) {
      const snippet = body
        .slice(Math.max(0, m.index - 35), m.index + m[0].length + 35)
        .replace(/\s+/g, " ");
      const key = label + "|" + m[0];
      if (seen.has(key)) continue;
      seen.add(key);
      add(rec, "bad-text", `${label}: "${m[0]}" in "...${snippet}..."`);
    }
  }
  if (!CONTENT_IDS) CONTENT_IDS = loadContentIds();
  for (const [id, i] of rawIdHits(body, CONTENT_IDS)) {
    const snippet = body.slice(Math.max(0, i - 35), i + id.length + 35).replace(/\s+/g, " ");
    add(rec, "raw-id", `"${id}" in "...${snippet}..."`);
  }
}

async function scanOverflow(page, rec) {
  try {
    const res = await page.evaluate(() => {
      const W = document.documentElement.clientWidth;
      const out = [];
      const clipped = (el) => {
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          const ox = getComputedStyle(p).overflowX;
          if (ox === "hidden" || ox === "auto" || ox === "scroll" || ox === "clip") return true;
        }
        return false;
      };
      for (const el of document.body.querySelectorAll("*")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none") continue;
        if (r.right > W + 1 || r.left < -1) {
          if (clipped(el)) continue;
          out.push({
            tag: el.tagName.toLowerCase(),
            cls: String(
              el.className && el.className.baseVal !== undefined
                ? el.className.baseVal
                : el.className,
            ).slice(0, 60),
            text: (el.innerText || el.getAttribute("aria-label") || "")
              .trim()
              .replace(/\s+/g, " ")
              .slice(0, 40),
            right: Math.round(r.right),
          });
          if (out.length > 25) break;
        }
      }
      return { scrollW: document.documentElement.scrollWidth, W, out };
    });
    if (res.scrollW > res.W + 1)
      add(rec, "overflow", `page scrollWidth ${res.scrollW} > viewport ${res.W}`);
    for (const o of res.out) {
      add(rec, "overflow", `<${o.tag} class="${o.cls}"> "${o.text}" right edge ${o.right}px`);
    }
  } catch (e) {
    /* ignore */
  }
}

/* ---------- game-flow helpers ---------- */

// pop-ups, briefings and the press review. Returns number of clicks made.
// Enabled "▸" options that are visible, excluding ones already tried without effect.
async function popupOptions(page, tried) {
  try {
    const names = await page.evaluate(() =>
      [...document.querySelectorAll("button, [role=button]")]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && !el.disabled;
        })
        .map((el) =>
          (el.getAttribute("aria-label") || el.innerText || "").trim().replace(/\s+/g, " "),
        )
        .filter((t) => t.startsWith("▸")),
    );
    return names.filter((n) => !tried.has(n));
  } catch (e) {
    return [];
  }
}

async function clearOverlays(page, rec, blockNo, maxIters = 12) {
  let clicks = 0;
  const tried = new Set();
  for (let i = 0; i < maxIters; i++) {
    if (await clickButton(page, /^Dismiss briefing/)) {
      clicks++;
      continue;
    }
    if (await clickButton(page, /^Done reading/)) {
      clicks++;
      continue;
    }
    // some pop-ups gate their options behind a checkbox (e.g. "Allow displaced routine work"): tick it first
    const boxes = page.locator(`${DIALOG} input[type=checkbox]:not(:checked)`);
    if ((await boxes.count().catch(() => 0)) > 0 && (await isVisible(boxes.first()))) {
      await boxes
        .first()
        .check({ timeout: STEP_TIMEOUT, force: true })
        .catch(() => {});
      await sleep(150);
    }
    const opts = await popupOptions(page, tried);
    if (opts.length) {
      const name = opts[(blockNo * 7 + i) % opts.length];
      const before = await dialogTitle(page);
      const clicked = await clickButton(page, new RegExp("^" + esc(name.slice(0, 50))));
      if (clicked) {
        clicks++;
        await sleep(250);
        const after = await dialogTitle(page);
        const still = (await popupOptions(page, new Set())).includes(name);
        if (before && after === before && still) {
          tried.add(name);
          add(
            rec,
            "ui-note",
            `option did not resolve its pop-up: "${name.slice(0, 80)}" in "${before.slice(0, 60)}"`,
          );
        }
        continue;
      }
      tried.add(name);
      continue;
    }
    // no usable option left: deal with it later, and record which pop-up it was
    const title = await dialogTitle(page);
    if (await clickButton(page, /^Deal with it later/)) {
      add(
        rec,
        "ui-note",
        `pop-up with no usable option, dealt with later${title ? `: "${title.slice(0, 80)}"` : ""}`,
      );
      clicks++;
      continue;
    }
    break;
  }
  return clicks;
}

// Work through mail in an open window: open each item once, take its first action when one appears.
async function handleMail(page, rec, scope, maxActs = 14) {
  const done = new Set();
  for (let i = 0; i < maxActs; i++) {
    const names = await visibleButtonNames(page, scope);
    let next = names.find((n) => ACTION_RE.test(n) && !done.has(n) && !SKIP_RE.test(n));
    if (!next) next = names.find((n) => !done.has(n) && !SKIP_RE.test(n) && n.length > 12);
    if (!next) break;
    done.add(next);
    const pickFirst = () => 0;
    const re = new RegExp("^" + esc(next.slice(0, 40)));
    const clicked = await clickButton(page, re, { scope, pick: pickFirst });
    if (!clicked) continue;
    await sleep(120);
    await clearOverlays(page, rec, 0, 3);
  }
}

async function closeWindow(page, rec, label) {
  for (let i = 0; i < 3; i++) {
    if (!(await dialogVisible(page))) return true;
    if (await clickButton(page, /^Close$/, { scope: DIALOG })) {
      await sleep(200);
      continue;
    }
    await page.keyboard.press("Escape").catch(() => {});
    await sleep(250);
  }
  if (await dialogVisible(page)) {
    add(rec, "dialog-not-closed", `${label}: "${(await dialogTitle(page)).slice(0, 90)}"`);
    return false;
  }
  return true;
}

async function ensureInEmbassy(page) {
  if (await isVisible(page.getByRole("button", { name: /Use your PC/ }))) return true;
  if (await clickButton(page, /Enter Embassy/)) {
    await sleep(400);
  }
  return isVisible(page.getByRole("button", { name: /Use your PC/ }));
}

async function doFax(page, rec) {
  if (!(await clickButton(page, /Read the secure fax/))) return;
  await sleep(300);
  await handleMail(page, rec, DIALOG);
  await closeWindow(page, rec, "secure fax");
}

async function doPc(page, rec, blockNo, scheduleTry) {
  if (!(await clickButton(page, /Use your PC/))) return;
  await sleep(300);
  await handleMail(page, rec, DIALOG);
  // Staff & diary: try to schedule one mission step (once per block)
  if (await clickButton(page, /^Staff & diary/, { scope: DIALOG })) {
    await sleep(200);
    if (scheduleTry) {
      const name = await clickButton(page, /^Schedule assignment/, { scope: DIALOG });
      if (!name) add(rec, "ui-note", "Schedule assignment button not found in Staff & diary");
      await sleep(200);
      await clearOverlays(page, rec, blockNo, 3);
    }
  }
  if (blockNo % 3 === 0 && (await clickButton(page, /^Démarches/, { scope: DIALOG }))) {
    await sleep(200);
    await handleMail(page, rec, DIALOG, 4);
  }
  if (await clickButton(page, /^Courrielleur 98/, { scope: DIALOG })) await sleep(200);
  await closeWindow(page, rec, "PC");
}

async function doColleague(page, rec, blockNo) {
  const names =
    (await page
      .evaluate(() =>
        [...document.querySelectorAll('button[aria-label^="Talk to "]')]
          .filter((e) => e.getBoundingClientRect().width > 0)
          .map((e) => e.getAttribute("aria-label")),
      )
      .catch(() => [])) || [];
  if (!names.length) return;
  const label = names[blockNo % names.length];
  const re = new RegExp("^" + esc(label) + "$");
  if (!(await clickButton(page, re))) return;
  await sleep(300);
  await clearOverlays(page, rec, blockNo, 6);
  await closeWindow(page, rec, `colleague ${label}`);
}

async function doTravel(page, rec, blockNo) {
  // leave the embassy for the town map, travel to a non-embassy place, then return next block
  if (!(await clickButton(page, /Leave to the town map/))) return false;
  await sleep(300);
  const dests = await page
    .evaluate(() =>
      [...document.querySelectorAll("button")]
        .filter((e) => e.getBoundingClientRect().width > 0)
        .map((e) => (e.getAttribute("aria-label") || e.innerText || "").trim())
        .filter((t) => /^Travel to /.test(t) && !/Embassy/.test(t)),
    )
    .catch(() => []);
  if (!dests.length) {
    add(rec, "ui-note", "no travel destinations listed on the town map");
    return false;
  }
  const dest = dests[blockNo % dests.length];
  const re = new RegExp("^" + esc(dest.slice(0, 30)));
  if (!(await clickButton(page, re))) return false;
  await sleep(300);
  const confirmed = await clickButton(page, /^(Travel|Confirm|Go|Yes)/, { scope: DIALOG });
  if (!confirmed) add(rec, "ui-note", `no confirm button for ${dest}`);
  await sleep(500);
  await clearOverlays(page, rec, blockNo, 4);
  return true;
}

async function endBlock(page, rec) {
  const deadline = Date.now() + STUCK_TIMEOUT;
  let blockNo = 0;
  let found = false;
  while (Date.now() < deadline) {
    if (await isVisible(page.getByRole("button", { name: END_RE }).first())) {
      found = true;
      break;
    }
    await clearOverlays(page, rec, blockNo++, 4);
    await sleep(300);
  }
  if (!found) {
    const names = await visibleButtonNames(page);
    const title = await dialogTitle(page);
    add(
      rec,
      "stuck",
      `no "End ..." button within 10 s; open dialog: "${title.slice(0, 80)}"; visible buttons: ${names.slice(0, 12).join(" | ")}`,
    );
    const shotFile = path.join(
      OUT,
      `stuck-${rec.build}-${rec.viewport}-day${rec.ctx.day}-${rec.ctx.block}.png`,
    );
    const shot = await Promise.race([
      page.screenshot({ path: shotFile, timeout: 8000 }).then(() => "saved"),
      sleep(9000).then(() => "timed out"),
    ]).catch((e) => "failed: " + e.message.split("\n")[0]);
    const body = await Promise.race([
      page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 160)),
      sleep(3000).then(() => "(page evaluate timed out)"),
    ]).catch((e) => "evaluate failed: " + e.message.split("\n")[0]);
    add(rec, "ui-note", `stuck diagnostics: screenshot ${shot}; body text "${body}"`);
    return false;
  }
  const before = await readClock(page);
  const endName = await clickButton(page, END_RE);
  if (!endName) {
    add(rec, "stuck", `"${endName}" button found but could not be clicked within 10 s`);
    return false;
  }
  await sleep(400);
  if (await clickButton(page, /^End the block anyway/)) await sleep(300);
  const changeDeadline = Date.now() + STUCK_TIMEOUT;
  while (Date.now() < changeDeadline) {
    const now = await readClock(page);
    if ((now.day !== before.day || now.block !== before.block) && now.day !== null) return true;
    if (await isEnding(page)) return true;
    await clearOverlays(page, rec, 0, 3);
    await sleep(300);
  }
  add(rec, "stuck", `clicked "${endName}" but the block did not change within 10 s`);
  return false;
}

/* ---------- one run ---------- */

async function playRun(browser, build, vp, outDir) {
  const rec = newRecord(build, vp);
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => add(rec, "page-error", e.message.split("\n")[0]));
  let finished = false;
  page.on("crash", () => add(rec, "page-error", "renderer crashed"));
  page.on("close", () => {
    if (!finished) add(rec, "page-error", "page closed during the run");
  });
  page.on("console", (m) => {
    if (m.type() === "error") add(rec, "console-error", m.text().slice(0, 240));
  });
  const shots = [];
  try {
    await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
    await page.getByRole("button", { name: "New career" }).first().click({ timeout: 10000 });
    await sleep(600);
    await page.getByPlaceholder("Surname").fill("Testov");
    for (const t of build.traits) {
      const ok = await clickButton(page, new RegExp("^[+−0-9]*\\s*" + esc(t)));
      if (!ok) add(rec, "builder", `trait button not found: ${t}`);
    }
    const accept = page.getByRole("button", { name: /^Accept posting/ });
    if (!(await accept.isEnabled({ timeout: 2000 }).catch(() => false))) {
      add(rec, "builder", "Accept posting button disabled with this build");
    }
    await accept
      .click({ timeout: 5000 })
      .catch((e) => add(rec, "builder", "could not accept posting: " + e.message.split("\n")[0]));
    await sleep(800);

    let lastDayBlock = "";
    for (let i = 0; i < MAX_BLOCKS; i++) {
      if (await isEnding(page)) break;
      const clock = await readClock(page);
      rec.ctx = clock;
      const key = `${clock.day}-${clock.block}`;
      if (key !== lastDayBlock) {
        lastDayBlock = key;
        rec.blocksPlayed++;
        if (process.env.PLAYTHROUGH_VERBOSE) console.log(`  ${build.id} ${vp.id} block ${key}`);
      }
      await clearOverlays(page, rec, i);
      await sleep(250);
      if (clock.block === "Morning" && clock.day) {
        const file = path.join(
          outDir,
          `${build.id}-${vp.id}-day${String(clock.day).padStart(2, "0")}-morning.png`,
        );
        await page.screenshot({ path: file }).catch(() => {});
        shots.push(path.basename(file));
      }
      await scanText(page, rec);
      if (vp.width < 500) await scanOverflow(page, rec);

      const log = (s) => {
        if (process.env.PLAYTHROUGH_VERBOSE) console.log("    " + s);
      };
      if (!(await ensureInEmbassy(page))) {
        add(rec, "ui-note", 'could not get back into the embassy (no "Use your PC")');
      } else {
        log("fax");
        await doFax(page, rec);
        log("pc");
        await doPc(page, rec, i, i % 2 === 0);
        if (i % 2 === 0) {
          log("colleague");
          await doColleague(page, rec, i);
        }
        if (i % 6 === 5 && i < MAX_BLOCKS - 2) {
          log("travel");
          await doTravel(page, rec, i);
        }
      }
      log("overlays");
      await clearOverlays(page, rec, i);
      await scanText(page, rec);

      log("end");
      const ok = await endBlock(page, rec);
      log("end done " + ok);
      if (!ok) {
        rec.stop = `stuck in ${key}`;
        break;
      }
    }
    rec.ctx = await readClock(page);
    if (await isEnding(page)) {
      rec.stop = "ending reached";
      const t = await dialogTitle(page);
      rec.endingText =
        t ||
        (await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 200)));
      await page
        .screenshot({ path: path.join(outDir, `${build.id}-${vp.id}-final.png`) })
        .catch(() => {});
    } else if (!rec.stop) {
      rec.stop = `block limit (${MAX_BLOCKS}) reached`;
    }
  } catch (e) {
    rec.stop = "script error: " + e.message.split("\n")[0];
    await page
      .screenshot({ path: path.join(outDir, `${build.id}-${vp.id}-error.png`) })
      .catch(() => {});
  } finally {
    finished = true;
    rec.shots = shots;
    await ctx.close().catch(() => {});
  }
  return rec;
}

/* ---------- report ---------- */

function writeReport(runs, totalMs) {
  const counts = (r) => {
    const c = {};
    for (const f of r.findings) c[f.type] = (c[f.type] || 0) + 1;
    return c;
  };
  const types = [
    "console-error",
    "page-error",
    "stuck",
    "dialog-not-closed",
    "bad-text",
    "raw-id",
    "overflow",
    "builder",
    "ui-note",
  ];
  const L = [];
  L.push("# Playthrough report");
  L.push("");
  L.push(
    "Generated by `scripts/playthrough.cjs` (Q-03). It plays the whole game in a real browser through the UI, once per build and screen size, and records what it sees. It changes no game code. Screenshots of each Morning are in `playthrough-output/` (git-ignored).",
  );
  L.push("");
  L.push(
    "Command: `npm run playthrough` (runs `node scripts/playthrough.cjs`; starts `vite dev` on 127.0.0.1:5199 if nothing is listening there). Not part of `npm test` or CI.",
  );
  L.push("");
  L.push(
    totalMs
      ? `Total run time: ${Math.round(totalMs / 1000)} s for ${runs.length} runs (three at a time).`
      : `Runs: ${runs.length}, three at a time; total run time not recorded in results.`,
  );
  L.push("");
  L.push("## Summary per run");
  L.push("");
  L.push(
    "| Build | Traits | Viewport | Blocks played | Ending or stop point | console errors | page errors | stuck | dialogs not closed | bad text | raw ids | overflow |",
  );
  L.push("|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of runs) {
    const c = counts(r);
    const stop =
      r.stop === "ending reached" ? `ending: ${String(r.endingText || "").slice(0, 80)}` : r.stop;
    L.push(
      `| ${r.build} | ${r.traits} | ${r.viewport} | ${r.blocksPlayed} | ${stop} | ${c["console-error"] || 0} | ${c["page-error"] || 0} | ${c.stuck || 0} | ${c["dialog-not-closed"] || 0} | ${c["bad-text"] || 0} | ${c["raw-id"] || 0} | ${c.overflow || 0} |`,
    );
  }
  L.push("");
  L.push(
    "Screenshots saved per run: " +
      runs.map((r) => `${r.build} ${r.viewport}: ${(r.shots || []).length}`).join("; ") +
      ".",
  );
  L.push("");
  L.push("## Findings grouped by type");
  L.push("");
  L.push(
    "Each finding is deduplicated by its text with the day and block stripped; the count is the number of occurrences over all runs, and the runs column lists where it appeared. Examples give the first location seen.",
  );
  L.push("");
  for (const t of types) {
    const map = new Map();
    for (const r of runs) {
      for (const f of r.findings) {
        if (f.type !== t) continue;
        const key = f.text
          .replace(/day \S+ \S+/g, "")
          .replace(/\s+/g, " ")
          .trim();
        if (!map.has(key)) map.set(key, { text: f.text, count: 0, runs: new Set(), examples: [] });
        const e = map.get(key);
        e.count++;
        e.runs.add(`${r.build}-${r.viewport}`);
        if (e.examples.length < 3) e.examples.push(`${r.build} ${r.viewport}, ${f.where}`);
      }
    }
    const total = [...map.values()].reduce((s, e) => s + e.count, 0);
    L.push(`### ${t} (${total} occurrences, ${map.size} distinct)`);
    L.push("");
    if (!map.size) {
      L.push("None.");
      L.push("");
      continue;
    }
    const sorted = [...map.values()].sort((a, b) => b.count - a.count).slice(0, 60);
    for (const e of sorted) {
      L.push(`- x${e.count} (${[...e.runs].join(", ")}): ${e.text.replace(/\|/g, "\\|")}`);
      L.push(`  - e.g. ${e.examples.join("; ")}`);
    }
    if (map.size > sorted.length)
      L.push(`- ... ${map.size - sorted.length} more distinct items, see the run log`);
    L.push("");
  }
  L.push("## Stop points and endings");
  L.push("");
  for (const r of runs)
    L.push(`- ${r.build} ${r.viewport}: ${r.stop}${r.endingText ? ` (${r.endingText})` : ""}`);
  L.push("");
  L.push("## How to read these findings");
  L.push("");
  L.push(
    '- Endings "Replaced by Capital" are the game-over recall when HQ goodwill reaches zero. They come from the fixed policy this script follows, which does not manage goodwill; they are not script failures. The game is 15 days, so an early ending means the run did not reach the debrief.',
  );
  L.push(
    '- `option did not resolve its pop-up` means a pop-up option was clickable, was clicked, and the same pop-up was still open afterwards. Those options show "2 colleague DP" costs while the Staff panel reported 0 free staff DP, so the script could not pay them. Whether this is a bug or the intended gate is for a reader of the game design to decide.',
  );
  L.push(
    "- `could not get back into the embassy` happens after the script travels (`doTravel`) and does not travel back. It is a script limitation and says nothing about the game.",
  );
  L.push(
    "- `Schedule assignment button not found` and `no travel destinations listed` mean the script did not find the control with the name it expects. The report does not establish whether the control is absent or only named differently.",
  );
  L.push(
    "- `raw-id` is matched against ids from the content JSON under src/game, so ordinary words are not flagged.",
  );
  L.push("");
  fs.writeFileSync(REPORT, L.join("\n"));
}

/* ---------- main ---------- */

(async () => {
  // PLAYTHROUGH_REPORT_ONLY=1 rebuilds docs/PLAYTHROUGH_REPORT.md from playthrough-output/results.json
  if (process.env.PLAYTHROUGH_REPORT_ONLY) {
    const runs = JSON.parse(fs.readFileSync(path.join(OUT, "results.json"), "utf8"));
    const meta = fs.existsSync(path.join(OUT, "meta.json"))
      ? JSON.parse(fs.readFileSync(path.join(OUT, "meta.json"), "utf8"))
      : {};
    writeReport(runs, meta.totalMs || 0);
    console.log(`Report written to ${REPORT}`);
    return;
  }
  const t0 = Date.now();
  fs.mkdirSync(OUT, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch({ args: ["--disable-dev-shm-usage"] });
  browser.on("disconnected", () => console.log("browser disconnected"));
  const runs = [];
  try {
    // PLAYTHROUGH_ONLY=A:1280x900 runs a single case while debugging
    const only = process.env.PLAYTHROUGH_ONLY || "";
    const cases = [];
    for (const build of BUILDS) {
      for (const vp of VIEWPORTS) {
        if (only && only !== `${build.id}:${vp.id}`) continue;
        cases.push({ build, vp });
      }
    }
    // runs are independent (own browser context); a small pool keeps the machine responsive
    const CONCURRENCY = Number(process.env.PLAYTHROUGH_CONCURRENCY || 3);
    let next = 0;
    const worker = async () => {
      while (next < cases.length) {
        const { build, vp } = cases[next++];
        const started = Date.now();
        const rec = await playRun(browser, build, vp, OUT);
        runs.push(rec);
        const secs = Math.round((Date.now() - started) / 1000);
        console.log(
          `[${build.id} ${vp.id}] ${rec.blocksPlayed} blocks, ${rec.stop}, ${rec.findings.length} findings, ${secs} s`,
        );
        fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(runs, null, 2));
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, cases.length) }, worker));
    runs.sort((a, b) => (a.build + a.viewport).localeCompare(b.build + b.viewport));
  } finally {
    await browser.close().catch(() => {});
    if (server.child) server.child.kill();
    fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(runs, null, 2));
    fs.writeFileSync(path.join(OUT, "meta.json"), JSON.stringify({ totalMs: Date.now() - t0 }));
    writeReport(runs, Date.now() - t0);
    console.log(`Report written to ${REPORT}`);
  }
})();
