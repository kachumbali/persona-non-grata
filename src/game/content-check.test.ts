import { describe, expect, it } from "vitest";
import { portHesperia2006 } from "./chapters";
import type { ChapterPack } from "./chapters";
import portraits from "./data/portraits.json";
import traits from "./data/traits.json";
import {
  CODE_SET_FLAGS,
  TEXT_LIMITS,
  chapterReport,
  checkChapter,
  type Finding,
} from "./content-check";

const globals = { traits, portraits };
const fresh = (): ChapterPack => structuredClone(portHesperia2006);
const check = (pack: ChapterPack) => checkChapter(pack, globals);
const has = (findings: Finding[], level: Finding["level"], file: string, path: string) =>
  findings.filter((f) => f.level === level && f.file === file && f.path === path);
const firstTopic = (pack: ChapterPack) => Object.values(pack.dialogues)[0]![0]!;

describe("content checker on the real chapter", () => {
  it("finds no errors in Port Hesperia", () => {
    const errors = check(fresh()).filter((f) => f.level === "error");
    expect(errors).toEqual([]);
  });
  it("reports counts", () => {
    const report = chapterReport(fresh());
    expect(report.characters).toBeGreaterThan(0);
    expect(report.storyEvents).toBe(portHesperia2006.campaign.events.length);
    expect(Object.keys(report.taggedByTrait).length).toBeGreaterThan(0);
  });
  it("exports the limits and the code-set flags", () => {
    expect(TEXT_LIMITS.choiceResult).toBe(30);
    expect(CODE_SET_FLAGS.prefixes).toContain("trait:");
  });
});

describe("content checker catches mistakes", () => {
  it("rejects invalid démarche recipients, dates and missing guaranteed routes", () => {
    const pack = fresh();
    const d = pack.demarches.instructions[0]!;
    d.recipient = "nobody";
    d.deadlineDay = 1;
    d.routes = d.routes.filter((route) => route.kind !== "note");
    const errors = check(pack).filter(
      (finding) => finding.level === "error" && finding.file === "demarches.json",
    );
    expect(errors.some((finding) => finding.message.includes("nobody"))).toBe(true);
    expect(errors.some((finding) => finding.message.includes("Deadline precedes"))).toBe(true);
    expect(errors.some((finding) => finding.message.includes("note verbale"))).toBe(true);
  });
  it("rejects dangling supersessions and unrecognised colleague IDs", () => {
    const pack = fresh();
    pack.demarches.instructions[0]!.supersededBy = { day: 3, block: 1, demarcheId: "not-real" };
    pack.demarches.colleagueLines["not-real"] = "A line.";
    const errors = check(pack).filter(
      (finding) => finding.level === "error" && finding.file === "demarches.json",
    );
    expect(errors.some((finding) => finding.path.endsWith("supersededBy"))).toBe(true);
    expect(errors.some((finding) => finding.path === "colleagueLines")).toBe(true);
  });
  it("rejects an untaught route fact and an owed favour without a call-in", () => {
    const pack = fresh();
    const route = pack.manifest.missionSteps["programme"]!.find(
      (step) => step.id === "host-agreement",
    )!.routes!.find((item) => item.kind === "knowledge")!;
    route.requires = { fact: "never-taught" };
    route.consequences = { oweFavour: "anselm" };
    const errors = check(pack).filter((finding) => finding.level === "error");
    expect(errors.some((finding) => finding.message.includes("never taught"))).toBe(true);
    expect(errors.some((finding) => finding.message.includes("No call-in event"))).toBe(true);
  });
  it("rejects a favour granted by an unknown character", () => {
    const pack = fresh();
    pack.campaign.events[0]!.choices[0]!.favour = { character: "nobody", delta: 1 };
    expect(
      has(check(pack), "error", "campaign.json", "events[0].choices[0].favour.character"),
    ).toHaveLength(1);
  });
  it("requires an unconditional official route and unique route ids", () => {
    const pack = fresh();
    const step = pack.manifest.missionSteps["clearance"]![0]!;
    step.gatekeeper = "protocol";
    step.routes = [
      {
        id: "same",
        label: "Official",
        kind: "official",
        dp: 1,
        cash: 100,
        days: 3,
        quality: "good",
        result: "Filed.",
      },
      {
        id: "same",
        label: "Favour",
        kind: "favour",
        dp: 1,
        cash: 0,
        days: 0,
        quality: "good",
        result: "Filed.",
      },
    ];
    const errors = check(pack).filter((finding) => finding.level === "error");
    expect(errors.some((finding) => finding.message.includes("cost only time"))).toBe(true);
    expect(errors.some((finding) => finding.message.includes("Duplicate route id"))).toBe(true);
  });
  it("unknown character id", () => {
    const pack = fresh();
    pack.campaign.events[0]!.npc = "nobody";
    expect(has(check(pack), "error", "campaign.json", "events[0].npc")).toHaveLength(1);
  });
  it("unknown portrait id", () => {
    const pack = fresh();
    pack.campaign.characters[0]!.portrait = "npc-ghost";
    expect(has(check(pack), "error", "campaign.json", "characters[0].portrait")).toHaveLength(1);
  });
  it("portrait of the wrong gender", () => {
    const pack = fresh();
    const other = portraits.find((p) => p.gender !== pack.campaign.characters[0]!.gender)!;
    pack.campaign.characters[0]!.portrait = other.id;
    expect(has(check(pack), "error", "campaign.json", "characters[0].portrait")).toHaveLength(1);
  });
  it("misspelled field", () => {
    const pack = fresh();
    Object.assign(pack.campaign.events[0]!.choices[0]!, { requiresTriat: "liver" });
    const found = has(check(pack), "error", "campaign.json", "events[0].choices[0].requiresTriat");
    expect(found).toHaveLength(1);
    expect(found[0]!.message).toContain("requiresTriat");
  });
  it("unknown trait id", () => {
    const pack = fresh();
    pack.campaign.events[0]!.choices[0]!.requiresTrait = "no-such-trait";
    expect(
      has(check(pack), "error", "campaign.json", "events[0].choices[0].requiresTrait"),
    ).toHaveLength(1);
  });
  it("flag that is read but never set", () => {
    const pack = fresh();
    pack.campaign.events[0]!.requiresFlag = "never-set-anywhere";
    expect(has(check(pack), "error", "campaign.json", "events[0].requiresFlag")).toHaveLength(1);
  });
  it("flag read by a clipping but never set", () => {
    const pack = fresh();
    pack.press.clippings[0]!.trigger = { flag: "never-set-anywhere" };
    expect(has(check(pack), "error", "press.json", "clippings[0].trigger.flag")).toHaveLength(1);
  });
  it("accepts flags the code sets and warns about flags nobody reads", () => {
    const pack = fresh();
    pack.campaign.events[0]!.requiresFlag = "dialogue:anything";
    pack.campaign.events[0]!.choices[0]!.flag = "orphan-flag";
    const findings = check(pack);
    expect(has(findings, "error", "campaign.json", "events[0].requiresFlag")).toHaveLength(0);
    expect(has(findings, "warning", "campaign.json", "events[0].choices[0].flag")).toHaveLength(1);
  });
  it("scene where every choice is gated", () => {
    const pack = fresh();
    for (const c of pack.campaign.events[0]!.choices) c.requiresTrait = "liver";
    expect(has(check(pack), "error", "campaign.json", "events[0].choices")).toHaveLength(1);
  });
  it("dialogue node where every choice is gated", () => {
    const pack = fresh();
    const topic = firstTopic(pack);
    for (const c of topic.nodes[topic.start]!.choices) c.requiresStat = { stat: "charm", min: 4 };
    const npc = Object.keys(pack.dialogues)[0]!;
    const path = `${npc}[0].nodes.${topic.start}.choices`;
    expect(has(check(pack), "error", "dialogues.json", path)).toHaveLength(1);
  });
  it("missing result text", () => {
    const pack = fresh();
    delete pack.campaign.events[0]!.choices[0]!.result;
    expect(has(check(pack), "error", "campaign.json", "events[0].choices[0].result")).toHaveLength(
      1,
    );
  });
  it("missing email result text", () => {
    const pack = fresh();
    pack.emails[0]!.ignore.text = "";
    expect(has(check(pack), "error", "emails.json", "[0].ignore.text")).toHaveLength(1);
  });
  it("day outside the chapter", () => {
    const pack = fresh();
    pack.campaign.events[0]!.minDay = pack.manifest.days + 1;
    pack.emails[0]!.day = 0;
    pack.invitations[0]!.day = 99;
    pack.press.clippings[0]!.minDay = 40;
    const findings = check(pack);
    expect(has(findings, "error", "campaign.json", "events[0].minDay")).toHaveLength(1);
    expect(has(findings, "error", "emails.json", "[0].day")).toHaveLength(1);
    expect(has(findings, "error", "invitations.json", "[0].day")).toHaveLength(1);
    expect(has(findings, "error", "press.json", "clippings[0].minDay")).toHaveLength(1);
  });
  it("expiry before start", () => {
    const pack = fresh();
    pack.campaign.events[0]!.minDay = 5;
    pack.campaign.events[0]!.expiresDay = 3;
    expect(has(check(pack), "error", "campaign.json", "events[0].expiresDay")).toHaveLength(1);
  });
  it("dangling dialogue next and missing start", () => {
    const pack = fresh();
    const topic = firstTopic(pack);
    const npc = Object.keys(pack.dialogues)[0]!;
    topic.nodes[topic.start]!.choices[0]!.next = "nowhere";
    const findings = check(pack);
    expect(
      has(findings, "error", "dialogues.json", `${npc}[0].nodes.${topic.start}.choices[0].next`),
    ).toHaveLength(1);
    topic.start = "nowhere";
    expect(has(check(pack), "error", "dialogues.json", `${npc}[0].start`)).toHaveLength(1);
  });
  it("unreachable dialogue node is a warning", () => {
    const pack = fresh();
    const topic = firstTopic(pack);
    const npc = Object.keys(pack.dialogues)[0]!;
    topic.nodes["orphan"] = { text: "Nobody asks.", choices: [{ label: "Fine", result: "Fine." }] };
    expect(has(check(pack), "warning", "dialogues.json", `${npc}[0].nodes.orphan`)).toHaveLength(1);
  });
  it("duplicate ids", () => {
    const pack = fresh();
    pack.campaign.characters[1]!.id = pack.campaign.characters[0]!.id;
    pack.campaign.events[1]!.id = pack.campaign.events[0]!.id;
    const findings = check(pack);
    expect(has(findings, "error", "campaign.json", "characters[1].id")).toHaveLength(1);
    expect(has(findings, "error", "campaign.json", "events[1].id")).toHaveLength(1);
  });
  it("unknown event, location, outlet, task and room ids", () => {
    const pack = fresh();
    pack.campaign.events[0]!.location = "moon";
    pack.press.clippings[0]!.outlet = "gazette";
    pack.press.clippings[1]!.trigger = { outcome: { eventId: "no-event" } };
    pack.emails[0]!.options.reply!.confirmsStep = "no-task.nothing";
    pack.manifest.startRoom = "no-room";
    const findings = check(pack);
    expect(has(findings, "error", "campaign.json", "events[0].location")).toHaveLength(1);
    expect(has(findings, "error", "press.json", "clippings[0].outlet")).toHaveLength(1);
    expect(
      has(findings, "error", "press.json", "clippings[1].trigger.outcome.eventId"),
    ).toHaveLength(1);
    expect(has(findings, "error", "emails.json", "[0].options.reply.confirmsStep")).toHaveLength(1);
    expect(has(findings, "error", "chapter.json", "startRoom")).toHaveLength(1);
  });
  it("text over the limit is a warning", () => {
    const pack = fresh();
    pack.campaign.events[0]!.choices[0]!.label = Array(TEXT_LIMITS.choiceLabel + 1)
      .fill("word")
      .join(" ");
    expect(has(check(pack), "warning", "campaign.json", "events[0].choices[0].label")).toHaveLength(
      1,
    );
  });
});

describe("content checker on mission steps and setbacks", () => {
  const errorsAt = (pack: ChapterPack, path: string) =>
    check(pack).filter((f) => f.level === "error" && f.file === "chapter.json" && f.path === path);
  it("a task without steps", () => {
    const pack = fresh();
    pack.manifest.missionSteps["lounge"] = [];
    expect(errorsAt(pack, "missionSteps.lounge")).toHaveLength(1);
  });
  it("duplicate step ids in a task", () => {
    const pack = fresh();
    pack.manifest.missionSteps["lounge"]![1]!.id = "reservation";
    expect(errorsAt(pack, "missionSteps.lounge[1].id")).toHaveLength(1);
  });
  it("requiresStep that does not exist, and a step that requires itself", () => {
    const pack = fresh();
    pack.manifest.missionSteps["lounge"]![2]!.requiresStep = { task: "programme", step: "ghost" };
    expect(errorsAt(pack, "missionSteps.lounge[2].requiresStep")).toHaveLength(1);
    const own = fresh();
    own.manifest.missionSteps["lounge"]![2]!.requiresStep = { task: "lounge", step: "guest-list" };
    expect(errorsAt(own, "missionSteps.lounge[2].requiresStep")).toHaveLength(1);
  });
  it("earliestDay outside the chapter", () => {
    const pack = fresh();
    pack.manifest.missionSteps["lounge"]![0]!.earliestDay = 40;
    expect(errorsAt(pack, "missionSteps.lounge[0].earliestDay")).toHaveLength(1);
  });
  it("a last step that cannot be done before the final day", () => {
    const pack = fresh();
    pack.manifest.missionSteps["programme"]![3]!.earliestDay = 15;
    expect(errorsAt(pack, "missionSteps.programme[3].earliestDay")).toHaveLength(1);
  });
  it("steps that require each other in a loop", () => {
    const pack = fresh();
    pack.manifest.missionSteps["lounge"]![0]!.requiresStep = { task: "lounge", step: "guest-list" };
    expect(errorsAt(pack, "missionSteps.lounge").length).toBeGreaterThan(0);
  });
  it("a setback that leaves too little time to recover", () => {
    const pack = fresh();
    pack.manifest.setbacks[3]!.day = 14;
    pack.emails.find((e) => e.id === "setback-parade")!.day = 14;
    expect(errorsAt(pack, "setbacks[3].targets")).toHaveLength(1);
  });
  it("a setback whose mail is missing or on another day", () => {
    const pack = fresh();
    pack.manifest.setbacks[0]!.mail = "no-mail";
    pack.manifest.setbacks[1]!.mail = "setback-parade";
    expect(errorsAt(pack, "setbacks[0].mail")).toHaveLength(1);
    expect(errorsAt(pack, "setbacks[1].mail")).toHaveLength(1);
  });
  it("a setback that reopens a step that costs cash, or names an unknown step", () => {
    const pack = fresh();
    pack.manifest.setbacks[0]!.targets.push({ task: "lounge", step: "deposit" });
    pack.manifest.setbacks[0]!.targets.push({ task: "lounge", step: "ghost" });
    expect(errorsAt(pack, "setbacks[0].targets[3]")).toHaveLength(1);
    expect(errorsAt(pack, "setbacks[0].targets[4]")).toHaveLength(1);
  });
  it("a mail that confirms a step before the step opens", () => {
    const pack = fresh();
    pack.emails.find((e) => e.id === "visit-lounge")!.day = 3;
    const found = check(pack).filter(
      (f) => f.level === "error" && f.file === "emails.json" && f.path.endsWith("confirmsStep"),
    );
    expect(found.length).toBeGreaterThan(0);
  });
});
