/** Deterministic end-of-posting narrative, shared by the screen, career and simulation. */
import { activeChapter } from "./chapters";
import { computeStats, TRAITS } from "./rules";
import { taskQuality } from "./mission";
import { REPUTATIONS, EARNED_QUIRKS } from "./personnel";
import type { SavedGame } from "./store";

type Game = SavedGame;
export interface Payslip {
  base: number;
  acting: number;
  hardship: number;
  drinks: number;
  moneyRoutes: number;
  total: number;
  advance?: number;
  tutorFees?: number;
  languageAllowance?: number;
}
export interface Debrief {
  title: string;
  cable: string;
  variant: string;
  epithet: string;
  board: { id: string; name: string; line: string }[];
  payslip: Payslip;
  sections: { heading: string; lines: string[] }[];
  text: string;
}
const scoreHash = (s: string) =>
  [...s].reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0, 7);
export function buildDebrief(g: Game): Debrief {
  const chapter = activeChapter().manifest,
    data = chapter.debrief,
    person = g.personnel;
  const counts = person?.counters ?? {},
    flags = g.storyFlags ?? [],
    traits = g.character?.traits ?? [];
  const starting = person?.start.traits ?? traits,
    reps = person?.reputations ?? [];
  const candidates = (data?.epithets ?? [])
    .flatMap((item) => {
      const value = item.counter
        ? (counts[item.counter] ?? 0) / (item.threshold ?? 1)
        : item.trait && starting.includes(item.trait)
          ? 1
          : item.flag && flags.includes(item.flag)
            ? 1
            : item.outcome && g.storyOutcomes?.[item.outcome.event]?.choice === item.outcome.choice
              ? 1
              : 0;
      if (value < 1) return [];
      return [
        {
          item,
          score: item.trait ? 2.5 : item.flag || item.outcome ? 2.8 : Math.min(3, value),
          tie: scoreHash(`${item.id}:${g.seed}:${flags.join("|")}`),
        },
      ];
    })
    .sort((a, b) => b.score - a.score || b.tie - a.tie);
  const epithet = candidates[0]?.item.text ?? "The diplomat who filed a final report.";
  const end = chapter.endings[g.ending ?? ""] ?? { title: g.ending ?? "Posting ended", text: "" };
  const dominantTrait = candidates[0]?.item.trait ?? starting[0];
  const variant =
    data?.variants[g.ending ?? ""]?.find(
      (row) =>
        (row.trait && row.trait === dominantTrait) ||
        (row.reputation && reps.includes(row.reputation)),
    )?.text ?? "Personnel has added a final note to the file.";
  const tone = g.ending === "promoted" ? "good" : g.ending === "ambassador" ? "mixed" : "bad";
  const eligible = Object.keys(data?.board ?? {}),
    met = g.metPeople ?? [];
  const known = eligible.filter(
    (id) =>
      met.includes(id) ||
      activeChapter().campaign.characters.find((c) => c.id === id)?.location ===
        chapter.officeLocation,
  );
  const selected = known
    .sort(
      (a, b) =>
        Math.abs((g.colleagues?.[b]?.trust ?? 50) - 50) -
          Math.abs((g.colleagues?.[a]?.trust ?? 50) - 50) || a.localeCompare(b),
    )
    .slice(0, 3);
  const board = selected.map((id) => ({
    id,
    name: activeChapter().campaign.characters.find((c) => c.id === id)?.name ?? id,
    line: data!.board[id]![tone],
  }));
  const salary = data?.payslip ?? {
    base: 0,
    acting: 0,
    hardship: 0,
    drinkDeduction: 0,
    moneyRouteDeduction: 0,
  };
  const payslip: Payslip = {
    base: salary.base,
    acting: salary.acting,
    hardship: salary.hardship,
    drinks: (counts["drinks"] ?? 0) * salary.drinkDeduction,
    moneyRoutes: (counts["money_routes"] ?? 0) * salary.moneyRouteDeduction,
    advance: salary.advance ?? 0,
    tutorFees: g.tutorFees ?? 0,
    languageAllowance:
      Object.values(g.character?.languages ?? {}).filter((level) => level >= 4).length *
      (salary.languageAllowance ?? 0),
    total: 0,
  };
  payslip.total =
    payslip.base +
    payslip.acting +
    payslip.hardship +
    (payslip.languageAllowance ?? 0) -
    payslip.drinks -
    payslip.moneyRoutes -
    (payslip.tutorFees ?? 0);
  const finalStats = computeStats(traits, person?.drift),
    startingStats = person?.start.stats ?? computeStats(starting);
  const name = (id: string) =>
    activeChapter().campaign.characters.find((c) => c.id === id)?.name ?? id;
  const display = (ids: string[]) =>
    ids
      .map(
        (id) =>
          REPUTATIONS.find((r) => r.id === id)?.name ??
          EARNED_QUIRKS.find((q) => q.id === id)?.name ??
          TRAITS.find((t) => t.id === id)?.name ??
          id,
      )
      .join(", ") || "None";
  const personnelLines = [
    `Languages: ${Object.entries(g.character?.languages ?? { bellaluxian: 3 })
      .map(([id, level]) => `${id} ${level}`)
      .join(", ")}`,
    `Day 1 traits: ${display(starting)}`,
    `Last day traits: ${display(traits)}`,
    `Gained: ${display((person?.earnedQuirks ?? []).filter((q) => !starting.includes(q)))}`,
    `Cured or replaced: ${(person?.curedTraits ?? []).map((id) => `${display([id])} (${EARNED_QUIRKS.some((q) => person?.earnedQuirks.includes(q.id) && q.replaces === id) ? "replaced" : "cured"})`).join(", ") || "None"}`,
    `Day 1 stats: ${Object.entries(startingStats)
      .map(([k, v]) => `${k} ${v}`)
      .join(", ")}`,
    `Last day stats: ${Object.entries(finalStats)
      .map(
        ([k, v]) =>
          `${k} ${v}${person?.drift[k as keyof typeof finalStats] ? ` (drift ${person.drift[k as keyof typeof finalStats]! > 0 ? "+" : ""}${person.drift[k as keyof typeof finalStats]})` : ""}`,
      )
      .join(", ")}`,
    `Day 1 reputations: ${display(person?.start.reputations ?? [])}`,
    `Last day reputations: ${display(reps)}`,
  ];
  const mission = Object.entries(chapter.missionTasks).map(
    ([id, label]) =>
      `${label}: ${g.visit?.[id] ? (chapter.missionQualityTexts?.[id]?.[taskQuality(g.stepQualities ?? {}, id)] ?? "confirmed") : "not confirmed"}`,
  );
  const deliveries = Object.values(g.demarches ?? {}),
    good = deliveries.filter((x) => x.status === "delivered" && x.quality !== "failed").length,
    failed = deliveries.filter((x) => x.status === "delivered" && x.quality === "failed").length,
    missed = deliveries.filter((x) => x.status === "missed").length;
  mission.push(`Démarches: ${good} delivered, ${failed} failed, ${missed} missed.`);
  const relations = Object.entries(g.colleagues ?? {})
    .filter(([id]) => met.includes(id))
    .sort(
      (a, b) =>
        Math.abs(b[1].trust - chapter.startTrust) - Math.abs(a[1].trust - chapter.startTrust),
    )
    .slice(0, 5)
    .map(([id, c]) => `${name(id)}: trust ${chapter.startTrust} → ${c.trust}.`);
  const owed = Object.entries(g.favours?.youOwe ?? {})
      .filter(([, n]) => n > 0)
      .map(([id, n]) => `You owe ${name(id)} ${n}.`),
    owing = Object.entries(g.favours?.owedToYou ?? {})
      .filter(([, n]) => n > 0)
      .map(([id, n]) => `${name(id)} owes you ${n}.`);
  const falseRumours = flags
    .filter((f) => f.startsWith("gossip:false:"))
    .map((f) => `False gossip acted on: ${f.slice("gossip:false:".length)}.`);
  const consequences = (g.goodwillHistory ?? [])
    .filter((item) => item.kind === "Outcome" || item.kind === "Missed instruction")
    .slice(-5)
    .map(
      (item) =>
        `${item.source}: ${item.text} (HQ ${item.before.confidence} → ${item.after.confidence}; host ${item.before.goodwill} → ${item.after.goodwill}).`,
    );
  const sections = [
    { heading: "Personnel file · Day 1 and last day", lines: personnelLines },
    { heading: "Epithet", lines: [epithet] },
    { heading: "Promotion board", lines: board.map((x) => `${x.name}: “${x.line}”`) },
    { heading: "The mission", lines: mission },
    { heading: "People", lines: [...relations, ...owed, ...owing, ...falseRumours] },
    { heading: "Things you set in motion", lines: consequences },
    {
      heading: "Payslip",
      lines: [
        `Base salary (${chapter.playerRank}): ƒ${payslip.base}`,
        `Acting allowance: ƒ${payslip.acting}`,
        `Hardship allowance: ƒ${payslip.hardship}`,
        `Dry cleaning after toasts: −ƒ${payslip.drinks}`,
        `Rejected expedited claims: −ƒ${payslip.moneyRoutes}`,
        `Advance made available during posting: ƒ${payslip.advance ?? 0}`,
        `Private tuition: −ƒ${payslip.tutorFees ?? 0}`,
        `Language allowance: ƒ${payslip.languageAllowance ?? 0}`,
        `Total: ƒ${payslip.total}`,
      ],
    },
  ];
  const cable = `${g.character?.title ?? ""} ${g.character?.name ?? ""}: ${end.text}`.trim();
  const text = [
    end.title,
    cable,
    variant,
    ...sections.flatMap((section) => [
      "",
      section.heading,
      ...(section.lines.length ? section.lines : ["None recorded."]),
    ]),
  ]
    .filter((x, i) => x !== "" || i > 2)
    .join("\n");
  return { title: end.title, cable, variant, epithet, board, payslip, sections, text };
}
