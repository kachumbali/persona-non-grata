import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { blocks, lastDay, missionTasks, type VisitTask } from "../rules";

import { activeChapter } from "../chapters";
import { useGame } from "../store";
import { Portrait } from "./Portrait";
import { WhoIsWho } from "./WhoIsWho";
import { PersonnelFile } from "./PersonnelFile";
import { Debrief } from "./Debrief";
import { CityMap } from "./CityMap";
import { PlaceScene } from "./PlaceScene";
import { BlackBerry } from "./BlackBerry";
import { Interruption } from "./Interruption";
import { PressReview } from "./PressReview";
import { PostingBriefing } from "./PostingBriefing";
import { MissionSteps } from "./MissionSteps";
import { ArrivalNotice, FirstDayChecklist } from "./FirstHour";
import { useUi } from "../ui";
import { player, trackFor } from "../music";
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
  const [fileOpen, setFileOpen] = useState(false);
  const [briefingOpen, setBriefingOpen] = useState(
    g.day === 1 && g.block === 0 && !g.briefingDismissed,
  );
  const closeBriefing = () => {
    setBriefingOpen(false);
    g.dismissBriefing();
  };
  const [view, setView] = useState<"city" | "place">("city");
  const [reopened, setReopened] = useState(false);
  useEffect(() => {
    if (g.block === 0) g.preparePress();
  }, [g.day, g.block, g.preparePress]);
  const evening = g.block === blocks().length - 1;
  const ended = g.ending !== null;
  useEffect(() => {
    player.want(trackFor({ screen: "play", ended, evening, view, location: g.location }));
  }, [ended, evening, view, g.location]);
  const pressOpen =
    g.block === 0 &&
    g.pressDay === g.day &&
    !briefingOpen &&
    (g.pressDismissedDay !== g.day || reopened);
  const c = g.character;
  if (!c) return null;
  const chapter = activeChapter().manifest;
  if (g.ending) return <Debrief />;

  return (
    <main className="mx-auto max-w-7xl retro-game px-3 py-4 sm:px-5">
      <header className="paper mb-4 flex items-center gap-3 px-3 py-2 sm:flex-wrap sm:gap-4 sm:px-4 sm:py-3">
        <Portrait portrait={c.portrait} size={40} />
        <div className="mr-auto min-w-0 flex-1 sm:basis-[240px]">
          <h1 className="sr-only sm:not-sr-only sm:text-xl sm:font-bold sm:leading-tight">
            Persona Non Grata — {chapter.label}
          </h1>
          <p className="truncate text-sm font-bold sm:font-normal">
            {c.title} {c.name}
            <span className="hidden sm:inline"> · Acting Head of Mission</span>
          </p>
          <p className="hidden text-xs text-muted-foreground sm:block">
            {chapter.playerRank} · {chapter.post}
          </p>
        </div>
        <Button
          variant="outline"
          className="hidden sm:inline-flex"
          onClick={() => setFileOpen(true)}
        >
          Personnel file
        </Button>
        <Button
          variant="outline"
          className="hidden sm:inline-flex"
          onClick={() => setPeopleOpen(true)}
        >
          Who is who
        </Button>
        {onMenu && (
          <Button variant="outline" className="retro-button hidden sm:inline-flex" onClick={onMenu}>
            Menu
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="sm:hidden" aria-label="Menu">
              Menu
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setFileOpen(true)}>Personnel file</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setPeopleOpen(true)}>Who is who</DropdownMenuItem>
            {onMenu && <DropdownMenuItem onSelect={onMenu}>Main menu</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="clock shrink-0 text-right font-mono">
          <div className="text-lg leading-tight sm:text-2xl">{blocks()[g.block]?.name}</div>
          <div className="text-xs text-muted-foreground">
            <span className="sm:hidden">
              Day {g.day} / {lastDay()}
            </span>
            <span className="hidden sm:inline">
              Day {g.day} / {lastDay()} ·{" "}
              {g.day >= lastDay()
                ? `${chapter.missionActor} arrives today`
                : `${chapter.missionActor} in ${lastDay() - g.day} days`}
            </span>
          </div>
        </div>
      </header>

      <Dialog open={fileOpen} onOpenChange={setFileOpen}>
        <DialogContent className="max-h-[85dvh] max-w-[calc(100vw-1rem)] overflow-y-auto bg-card sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Personnel file</DialogTitle>
            <DialogDescription>Your current personnel record.</DialogDescription>
          </DialogHeader>
          <PersonnelFile />
        </DialogContent>
      </Dialog>
      <Dialog open={peopleOpen} onOpenChange={setPeopleOpen}>
        <DialogContent className="max-h-[85dvh] max-w-[calc(100vw-1rem)] overflow-y-auto bg-card sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Who is who</DialogTitle>
            <DialogDescription>Your notebook of people and their relationships.</DialogDescription>
          </DialogHeader>
          <WhoIsWho />
        </DialogContent>
      </Dialog>
      <Dialog
        open={briefingOpen}
        onOpenChange={(o) => (o ? setBriefingOpen(true) : closeBriefing())}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto bg-card sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Courrielleur 98 · Welcome to your posting</DialogTitle>
            <DialogDescription>Personnel Directorate · Posting briefing</DialogDescription>
          </DialogHeader>
          <PostingBriefing />
          <Button variant="outline" onClick={closeBriefing}>
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
      <ArrivalNotice
        onOpen={(part) => {
          if (part.key === "fax" || part.key === "pc") setView("place");
          useUi
            .getState()
            .open(
              part.key === "fax"
                ? "fax"
                : part.key === "pc"
                  ? "pc"
                  : part.key === "invitation"
                    ? "phone-diary"
                    : "phone-mail",
            );
        }}
      />
      <FirstDayChecklist />
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
