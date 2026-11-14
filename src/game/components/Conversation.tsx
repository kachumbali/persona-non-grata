import { eligible, gateLabel } from "../character";
import { computeStats } from "../rules";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CAMPAIGN, type StoryChoice } from "../rules";
import { moodOpener, pickTopic, splitEffects, type TalkChoice } from "../dialogues";
import { useGame } from "../store";
import { capacityLedger, staffDuty, STAFF_DP } from "../economy";
import { Portrait } from "./Portrait";

/** Adventure-style dialogue box; each character raises their own topics. */
export function Conversation() {
  const g = useGame();
  const [node, setNode] = useState("");
  const [notice, setNotice] = useState("");
  const [overload, setOverload] = useState(false);
  useEffect(() => {
    setNode("");
    setNotice("");
    setOverload(false);
  }, [g.selectedNpc, g.block]);
  const npc = CAMPAIGN.characters.find((c) => c.id === g.selectedNpc);
  if (!npc) return null;
  const done = [
    ...g.storyFlags
      .filter((flag) => flag.startsWith("dialogue:"))
      .map((flag) => flag.slice("dialogue:".length)),
    ...g.pending.flatMap((p) => (p.dialogueTopic ? [p.dialogueTopic] : [])),
  ];
  const topic = pickTopic(npc.id, g.day, g.block, done);
  const generic = CAMPAIGN.dialogue as Record<string, { text: string; choices: StoryChoice[] }>;
  const current = topic ? topic.nodes[node || topic.start] : generic[node || "opening"];
  if (!current) return null;
  const trust = g.colleagues[npc.id]?.trust ?? 50;
  const staff = npc.location === "embassy";
  const ledger = capacityLedger(g.pending, g.block).find((row) => row.id === npc.id);
  const assigned = g.pending.filter((p) => p.worker === npc.id || p.partner === npc.id);
  const isStart = !node || node === topic?.start || node === "opening";
  const text = (isStart ? moodOpener(trust) : "") + current.text.replace("{line}", npc.line);
  const choose = (choice: TalkChoice) => {
    if (choice.next) {
      setNode(choice.next);
      return;
    }
    const { meters, energy, cash } = splitEffects(choice.effects);
    const ok = g.queue({
      id: `conversation-${npc.id}-${topic?.id ?? "general"}`,
      kind: "dialogue",
      timeCost: 1,
      cashCost: cash || undefined,
      source: `Conversation with ${npc.name}${topic ? ` · ${topic.id}` : ""}`,
      text: choice.result ?? "Conversation completed.",
      effects: meters,
      worker: npc.id,
      overload,
      dialogueTopic: topic ? `${npc.id}:${topic.id}` : undefined,
      flag: choice.flag,
      trust: choice.trust,
      pair: choice.pair,
      pairTarget: choice.pairTarget,
      formal: choice.formal,
      traitChoice: choice.requiresTrait,
      score: choice.score,
      composure: 3,
      energy: energy || undefined,
    });
    setNotice(
      ok
        ? `${choice.result ?? "Agreed."} (Takes effect at the end of this block.)`
        : useGame.getState().planError,
    );
  };
  return (
    <div className="dialogue-box" aria-label="Conversation">
      <Portrait face={npc.face} size={96} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-xl">
            {npc.name}{" "}
            <span className="text-xs text-muted-foreground">
              · {npc.role} · Trust {trust}
            </span>
          </h3>
          <Button size="sm" variant="ghost" onClick={() => g.selectNpc(null)}>
            Leave ✕
          </Button>
        </div>
        {staff && (
          <div
            className="my-2 rounded border border-border bg-muted p-2 text-sm"
            aria-label={`${npc.name} workload`}
          >
            {g.block === 3 ? (
              <p>Off duty this evening.</p>
            ) : (
              <p>
                <strong>Routine work:</strong> {staffDuty(npc.id)} · {ledger?.baseline ?? 0} of{" "}
                {STAFF_DP} staff DP. {ledger?.free ?? 0} DP free this block.
              </p>
            )}
            {assigned.length > 0 && (
              <p>
                <strong>Already assigned:</strong> {assigned.map((p) => p.source).join(", ")}.
              </p>
            )}
            {g.block !== 3 && (ledger?.used ?? 0) >= STAFF_DP && (
              <p className="text-destructive">
                Fully booked: remove an existing assignment before scheduling a conversation.
              </p>
            )}
            {g.block !== 3 && (ledger?.free ?? 0) < 1 && (ledger?.used ?? 0) < STAFF_DP && (
              <label className="mt-1 flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={overload}
                  onChange={(e) => setOverload(e.target.checked)}
                />
                Allow this conversation to displace routine work (backlog, fatigue and goodwill
                costs).
              </label>
            )}
          </div>
        )}
        <p className="my-2 font-serif">“{text}”</p>
        {notice ? (
          <p role="status" className="mt-2 text-sm">
            {notice}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {(current.choices as TalkChoice[])
              .filter((c) =>
                eligible(c, g.character?.traits ?? [], computeStats(g.character?.traits ?? [])),
              )
              .map((c, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="h-auto justify-start whitespace-normal py-1.5 text-left"
                  disabled={g.pending.some(
                    (p) => p.id === `conversation-${npc.id}-${topic?.id ?? "general"}`,
                  )}
                  onClick={() => choose(c as TalkChoice)}
                >
                  ▸ {gateLabel(c)}
                  {c.label}
                  {c.next
                    ? ""
                    : ` · 1 DP${c.effects?.["money"] ? ` · ƒ${-c.effects["money"]}` : ""}`}
                </Button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
