import { useState } from "react";
import { InterpreterSelect } from "./InterpreterSelect";
import { Button } from "@/components/ui/button";
import { activeChapter } from "../chapters";
import { demarches, planDemarche, statusOf, tick } from "../demarche";
import { playerCapacity, validatePlan } from "../economy";
import { campaign, type PendingDecision } from "../rules";
import { useGame } from "../store";

/** Capital's live instruction board; all choices still enter the ordinary block plan. */
export function DemarcheBoard() {
  const g = useGame();
  const [selected, setSelected] = useState("");
  const [worker, setWorker] = useState(
    () =>
      campaign().characters.find(
        (person) => person.location === activeChapter().manifest.officeLocation,
      )?.id ?? "",
  );
  const [trait, setTrait] = useState("");
  const [interpreter, setInterpreter] = useState("");
  const [overload, setOverload] = useState(false);
  const [notice, setNotice] = useState("");
  const items = demarches().filter((d) => statusOf(d, g.demarches, g.day, g.block) !== "future");
  const chosen =
    items.find((d) => d.id === selected) ??
    items.find((d) => ["new", "in-progress"].includes(statusOf(d, g.demarches, g.day, g.block))) ??
    items[0];
  const decision = (route: PendingDecision["demarcheRoute"]): PendingDecision => ({
    id: `demarche-${chosen?.id ?? ""}`,
    kind: "work",
    source: chosen?.subject ?? "Démarche",
    text: "",
    effects: {},
    demarcheId: chosen?.id,
    demarcheRoute: route,
    worker: route === "colleague" || route === "note" ? worker : undefined,
    demarcheTrait: trait || undefined,
    languageGate: chosen?.routes.find((item) => item.kind === route)?.requiresLanguage,
    interpreter:
      chosen?.routes.find((item) => item.kind === route)?.requiresLanguage &&
      (g.character?.languages?.[
        chosen.routes.find((item) => item.kind === route)!.requiresLanguage!.language
      ] ?? 0) === 0
        ? interpreter || undefined
        : undefined,
    overload,
  });
  const add = (route: PendingDecision["demarcheRoute"]) => {
    const ok = g.queue(decision(route));
    setNotice(ok ? "Added to the current block." : useGame.getState().planError);
  };
  return (
    <section
      aria-label="Démarche board"
      className="min-w-0 border-t-2 border-border bg-card p-3 text-sm"
    >
      <h2 className="text-xl font-bold">Démarche board</h2>
      <p>Capital’s instructions, deadlines and delivery reports.</p>
      {!items.length ? (
        <p className="mt-2 text-muted-foreground">No instructions have arrived.</p>
      ) : (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <ul className="space-y-1" aria-label="Démarche instructions">
            {items.map((d) => {
              const status = g.pending.some((p) => p.demarcheId === d.id)
                ? "in progress"
                : statusOf(d, g.demarches, g.day, g.block);
              const quality = g.demarches[d.id]?.quality;
              const remaining = Math.max(0, d.deadlineDay - g.day);
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    aria-pressed={chosen?.id === d.id}
                    onClick={() => {
                      setSelected(d.id);
                      setTrait("");
                      setNotice("");
                    }}
                    className="w-full border border-border bg-muted p-2 text-left hover:bg-accent focus-visible:outline focus-visible:outline-2"
                  >
                    <strong>{d.subject}</strong>
                    <br />
                    {d.level} ·{" "}
                    {campaign().characters.find((c) => c.id === d.recipient)?.name ?? d.recipient} ·{" "}
                    {remaining} {remaining === 1 ? "day" : "days"} left
                    <br />
                    {status}
                    {quality ? ` · ${quality}` : ""}
                  </button>
                </li>
              );
            })}
          </ul>
          {chosen && (
            <div className="min-w-0 space-y-2">
              <h3 className="font-bold">{chosen.subject}</h3>
              <p>{chosen.instruction}</p>
              <p>
                Deadline: Day {chosen.deadlineDay} ·{" "}
                {activeChapter().manifest.blocks[chosen.deadlineBlock]?.name}
              </p>
              <ul className="list-disc pl-5">
                {chosen.talkingPoints.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <label className="block">
                Colleague{" "}
                <select
                  aria-label="Démarche colleague"
                  value={worker}
                  onChange={(e) => setWorker(e.target.value)}
                  className="mt-1 w-full border border-input bg-muted p-2"
                >
                  {campaign()
                    .characters.filter(
                      (person) => person.location === activeChapter().manifest.officeLocation,
                    )
                    .map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                </select>
              </label>
              {(chosen.traitOptions?.some((option) =>
                g.character?.traits.includes(option.requiresTrait),
              ) ||
                chosen.gossipOptions?.some((option) =>
                  g.knownFacts.includes(option.requiresFact),
                )) && (
                <label className="block">
                  Approach{" "}
                  <select
                    aria-label="Démarche approach"
                    value={trait}
                    onChange={(e) => setTrait(e.target.value)}
                    className="mt-1 w-full border border-input bg-muted p-2"
                  >
                    <option value="">Standard</option>
                    {(chosen.traitOptions ?? [])
                      .filter((option) => g.character?.traits.includes(option.requiresTrait))
                      .map((option) => (
                        <option value={option.id} key={option.id}>
                          {option.label}
                        </option>
                      ))}
                    {(chosen.gossipOptions ?? [])
                      .filter((option) => g.knownFacts.includes(option.requiresFact))
                      .map((option) => (
                        <option value={option.id} key={option.id}>
                          {option.label}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              <label className="flex gap-2">
                <input
                  type="checkbox"
                  checked={overload}
                  onChange={(e) => setOverload(e.target.checked)}
                />
                Allow displaced routine work
              </label>
              {chosen.routes.some((route) => route.requiresLanguage) && (
                <InterpreterSelect value={interpreter} onChange={setInterpreter} />
              )}
              {!g.demarches[chosen.id]?.coordinated && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="disabled:opacity-100 disabled:text-muted-foreground"
                  onClick={() => add("coordinate")}
                  disabled={typeof planDemarche(g, decision("coordinate")) === "string"}
                >
                  Coordinate at EU · 1 DP
                </Button>
              )}
              <ul className="space-y-1">
                {chosen.routes.map((route) => {
                  const candidate = planDemarche(g, decision(route.kind));
                  const blocked =
                    typeof candidate === "string"
                      ? candidate
                      : g.character
                        ? (validatePlan(
                            [...g.pending, candidate],
                            g.block,
                            g.economy,
                            playerCapacity(
                              g.character,
                              g.energy,
                              g.composure,
                              g.alcohol,
                              g.hangover,
                            ).total,
                          ) ?? "")
                        : "";
                  return (
                    <li key={route.id}>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-auto w-full whitespace-normal text-left disabled:opacity-100 disabled:text-muted-foreground"
                        disabled={!!blocked}
                        onClick={() => add(route.kind)}
                      >
                        {route.label} · {route.dp} DP
                        {route.kind === "colleague" || route.kind === "note" ? " · 2 staff DP" : ""}
                        {blocked ? ` · ${blocked}` : ""}
                      </Button>
                    </li>
                  );
                })}
              </ul>
              {notice && <p role="status">{notice}</p>}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
