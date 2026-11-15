import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { blocks, endings, lastDay, missionTasks, type VisitTask } from "../rules";

import { activeChapter } from "../chapters";
import { newPosting } from "../saves";
import { useGame } from "../store";
import { Portrait } from "./Portrait";
import { WhoIsWho } from "./WhoIsWho";
import { CityMap } from "./CityMap";
import { PlaceScene } from "./PlaceScene";
import { BlackBerry } from "./BlackBerry";
import { Interruption } from "./Interruption";
import { DiplomaticRecord } from "./DiplomaticRecord";
import { StoryRecord } from "./StoryRecord";
import { PressReview } from "./PressReview";
import { PostingBriefing } from "./PostingBriefing";
import { MissionSteps } from "./MissionSteps";
import { taskQuality } from "../mission";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function GameScreen({ onMenu }: { onMenu?: () => void }) {
  const g = useGame();
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [briefingOpen, setBriefingOpen] = useState(g.day === 1 && g.block === 0);
  const [view, setView] = useState<"city" | "place">("city");
  const [reopened, setReopened] = useState(false);
  useEffect(() => {
    if (g.block === 0) g.preparePress();
  }, [g.day, g.block, g.preparePress]);
  const pressOpen =
    g.block === 0 &&
    g.pressDay === g.day &&
    !briefingOpen &&
    (g.pressDismissedDay !== g.day || reopened);
  const c = g.character;
  if (!c) return null;
  const chapter = activeChapter().manifest;
  const payoffSources = new Set(activeChapter().conversationPayoffs.map((payoff) => payoff.source));

  if (g.ending) {
    const end = endings()[g.ending] ?? { title: g.ending, text: "" };
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="paper p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Persona Non Grata — {chapter.label} · Final cable · Day {g.day}
          </p>
          <Portrait portrait={c.portrait} size={96} />
          <h1 className="mt-6 text-3xl text-destructive">{end.title}</h1>
          <p className="mt-6 font-serif">
            {c.title} {c.name}: {end.text}
          </p>
          <p className="mt-4 font-mono">
            HQ goodwill: {g.meters.confidence} · Host goodwill: {g.meters.goodwill}
          </p>
          {g.goodwillHistory
            .filter((entry) => payoffSources.has(entry.source))
            .map((entry, i) => (
              <p key={i} className="mt-4 font-serif">
                {entry.text}
              </p>
            ))}
          {g.goodwillHistory.at(-1) && !payoffSources.has(g.goodwillHistory.at(-1)!.source) && (
            <p className="mt-3 text-sm">Last outcome: {g.goodwillHistory.at(-1)?.text}</p>
          )}
          {g.day >= lastDay() && (
            <p className="mt-4 font-serif">
              Fuel quay:{" "}
              {g.storyFlags.includes("fuel-bought")
                ? "Early buyers received their generator fuel before rationing."
                : g.storyFlags.includes("fuel-mira")
                  ? "Mira’s timetable kept the generator delivery on course."
                  : "Late buyers faced rationing and higher generator fuel charges."}
            </p>
          )}
          {g.day >= lastDay() &&
            Object.entries(missionTasks())
              .filter(([id]) => g.visit[id])
              .map(([id, label]) => (
                <p key={id} className="mt-2 text-sm">
                  {label}:{" "}
                  {chapter.missionQualityTexts?.[id]?.[taskQuality(g.stepQualities, id)] ??
                    (taskQuality(g.stepQualities, id) === "adequate"
                      ? "confirmed, with qualifications."
                      : "confirmed as agreed.")}
                </p>
              ))}
          <DiplomaticRecord outcomes={g.storyOutcomes} />
          <StoryRecord outcomes={g.storyOutcomes} completed={g.completedEvents} day={g.day} />
          <Button className="mt-8" onClick={newPosting}>
            Request a new posting
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl retro-game px-3 py-4 sm:px-5">
      <header className="paper mb-4 flex flex-wrap items-center gap-4 px-4 py-3">
        <Portrait portrait={c.portrait} size={48} />
        <div className="mr-auto min-w-0 flex-1 basis-[240px]">
          <h1 className="text-xl font-bold leading-tight">Persona Non Grata — {chapter.label}</h1>
          <p className="text-sm">
            {c.title} {c.name} · Acting Head of Mission
          </p>
          <p className="text-xs text-muted-foreground">
            {chapter.playerRank} · {chapter.post}
          </p>
        </div>
        <Button variant="outline" onClick={() => setPeopleOpen(true)}>
          Who is who
        </Button>
        {onMenu && (
          <Button variant="outline" className="retro-button" onClick={onMenu}>
            Menu
          </Button>
        )}
        <div className="clock text-right font-mono">
          <div className="text-2xl">{blocks()[g.block]?.name}</div>
          <div className="text-xs text-muted-foreground">
            Day {g.day} / {lastDay()} ·{" "}
            {g.day >= lastDay()
              ? `${chapter.missionActor} arrives today`
              : `${chapter.missionActor} in ${lastDay() - g.day} days`}
          </div>
        </div>
      </header>

      <Dialog open={peopleOpen} onOpenChange={setPeopleOpen}>
        <DialogContent className="max-h-[85dvh] max-w-[calc(100vw-1rem)] overflow-y-auto bg-card sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Who is who</DialogTitle>
            <DialogDescription>Your notebook of people and their relationships.</DialogDescription>
          </DialogHeader>
          <WhoIsWho />
        </DialogContent>
      </Dialog>
      <Dialog open={briefingOpen} onOpenChange={setBriefingOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto bg-card sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Courrielleur 98 · Welcome to your posting</DialogTitle>
            <DialogDescription>Personnel Directorate · Posting briefing</DialogDescription>
          </DialogHeader>
          <PostingBriefing />
          <Button variant="outline" onClick={() => setBriefingOpen(false)}>
            Dismiss briefing
          </Button>
        </DialogContent>
      </Dialog>
      {pressOpen && (
        <PressReview
          onClose={() => {
            g.dismissPress();
            setReopened(false);
          }}
        />
      )}
      <details className="paper mb-4 p-3">
        <summary className="cursor-pointer font-bold">
          Ministerial visit ·{" "}
          {Object.keys(missionTasks()).filter((key) => g.visit[key as VisitTask]).length}/
          {Object.keys(missionTasks()).length} confirmed · Day {lastDay()} arrival
        </summary>
        <div className="mt-2">
          <MissionSteps compact />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Watch your mail and secure fax for arrangements. Mission Watch on the embassy PC has the
          full record.
        </p>
      </details>
      {view === "city" ? (
        <CityMap onEnter={() => setView("place")} />
      ) : (
        <PlaceScene onLeave={() => setView("city")} />
      )}
      <BlackBerry onOpenPress={() => setReopened(true)} />
      {!briefingOpen && !pressOpen && <Interruption />}
    </main>
  );
}
