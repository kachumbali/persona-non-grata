import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CAMPAIGN, type StoryChoice } from "../rules";
import { useGame } from "../store";
import { Portrait } from "./Portrait";

/** Adventure-style dialogue box with the selected character. */
export function Conversation() {
  const g = useGame();
  const [node, setNode] = useState("opening");
  const [notice, setNotice] = useState("");
  useEffect(() => { setNode("opening"); setNotice(""); }, [g.selectedNpc, g.block]);
  const npc = CAMPAIGN.characters.find((c) => c.id === g.selectedNpc);
  const dialogue = (CAMPAIGN.dialogue as Record<string, { text: string; choices: StoryChoice[] }>)[node];
  if (!npc || !dialogue) return null;
  const choose = (choice: StoryChoice) => {
    if (choice.next) { setNode(choice.next); return; }
    const ok = g.queue({ id: "conversation", kind: "dialogue", timeCost: 1, source: `Conversation with ${npc.name}`, text: choice.result ?? "Conversation completed.", effects: choice.effects ?? {}, worker: npc.id, trust: choice.trust, pair: choice.pair, score: choice.score, composure: 3 });
    setNotice(ok ? "Agreed. The outcome arrives at the end of this block." : useGame.getState().planError);
  };
  return (
    <div className="dialogue-box" aria-label="Conversation">
      <Portrait face={npc.face} size={96} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2"><h3 className="text-xl">{npc.name} <span className="text-xs text-muted-foreground">· {npc.role} · Trust {g.colleagues[npc.id]?.trust ?? 50}</span></h3>
          <Button size="sm" variant="ghost" onClick={() => g.selectNpc(null)}>Leave ✕</Button></div>
        <p className="my-2 font-serif">“{dialogue.text.replace("{line}", npc.line)}”</p>
        <div className="flex flex-col gap-1">{dialogue.choices.map((c) => <Button key={c.id} variant="outline" className="h-auto justify-start whitespace-normal py-1.5 text-left" disabled={g.pending.some((p) => p.id === "conversation")} onClick={() => choose(c)}>▸ {c.label}{c.next ? "" : " · 1 DP"}</Button>)}</div>
        {notice && <p role="status" className="mt-2 text-sm">{notice}</p>}
      </div>
    </div>
  );
}
