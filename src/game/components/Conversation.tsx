import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CAMPAIGN, type StoryChoice } from "../rules";
import { moodOpener, pickTopic, splitEffects, type TalkChoice } from "../dialogues";
import { useGame } from "../store";
import { Portrait } from "./Portrait";

const DONE_KEY = "png-talked";
const readDone = (): string[] => { try { return JSON.parse(localStorage.getItem(DONE_KEY) ?? "[]"); } catch { return []; } };

/** Adventure-style dialogue box; each character raises their own topics. */
export function Conversation() {
  const g = useGame();
  const [node, setNode] = useState("");
  const [notice, setNotice] = useState("");
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => { setDone(readDone()); }, []);
  useEffect(() => { setNode(""); setNotice(""); }, [g.selectedNpc, g.block]);
  const npc = CAMPAIGN.characters.find((c) => c.id === g.selectedNpc);
  if (!npc) return null;
  const topic = pickTopic(npc.id, g.day, g.block, done);
  const generic = (CAMPAIGN.dialogue as Record<string, { text: string; choices: StoryChoice[] }>);
  const current = topic ? topic.nodes[node || topic.start] : generic[node || "opening"];
  if (!current) return null;
  const trust = g.colleagues[npc.id]?.trust ?? 50;
  const isStart = !node || node === topic?.start || node === "opening";
  const text = (isStart ? moodOpener(trust) : "") + current.text.replace("{line}", npc.line);
  const choose = (choice: TalkChoice) => {
    if (choice.next) { setNode(choice.next); return; }
    const { meters, energy, cash } = splitEffects(choice.effects);
    const ok = g.queue({ id: "conversation", kind: "dialogue", timeCost: 1, cashCost: cash || undefined, source: `Conversation with ${npc.name}`, text: choice.result ?? "Conversation completed.", effects: meters, worker: npc.id, trust: choice.trust, pair: choice.pair, score: choice.score, composure: 3, energy: energy || undefined });
    if (ok && topic) { const next = [...done, `${npc.id}:${topic.id}`]; setDone(next); localStorage.setItem(DONE_KEY, JSON.stringify(next)); }
    setNotice(ok ? `${choice.result ?? "Agreed."} (Takes effect at the end of this block.)` : useGame.getState().planError);
  };
  return (
    <div className="dialogue-box" aria-label="Conversation">
      <Portrait face={npc.face} size={96} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2"><h3 className="text-xl">{npc.name} <span className="text-xs text-muted-foreground">· {npc.role} · Trust {trust}</span></h3>
          <Button size="sm" variant="ghost" onClick={() => g.selectNpc(null)}>Leave ✕</Button></div>
        <p className="my-2 font-serif">“{text}”</p>
        {notice ? <p role="status" className="mt-2 text-sm">{notice}</p> :
        <div className="flex flex-col gap-1">{current.choices.map((c, i) => <Button key={i} variant="outline" className="h-auto justify-start whitespace-normal py-1.5 text-left" disabled={g.pending.some((p) => p.id === "conversation")} onClick={() => choose(c)}>▸ {c.label}{c.next ? "" : ` · 1 DP${c.effects?.money ? ` · ƒ${-c.effects.money}` : ""}`}</Button>)}</div>}
      </div>
    </div>
  );
}
