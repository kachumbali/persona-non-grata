import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CharacterBuilder } from "@/game/components/CharacterBuilder";
import { TitleScreen } from "@/game/components/TitleScreen";
import { GameScreen } from "@/game/components/GameScreen";
import { ErrorBoundary } from "@/game/components/ErrorBoundary";
import { activeChapter } from "@/game/chapters";
import { initSaves } from "@/game/saves";
import { useGame } from "@/game/store";
import { lastDay } from "@/game/rules";
import { player, trackFor } from "@/game/music";

// Load the save slots before the first render (the game reads browser storage, so client only).
if (typeof window !== "undefined") {
  initSaves();
  player.install(); // music starts after the first click or key press (browser autoplay rules)
}

export const Route = createFileRoute("/")({
  ssr: false, // the game reads its save from the browser
  head: () => {
    const chapter = activeChapter().manifest;
    const description = `${chapter.label}: ${chapter.title}. Manage limited time, embassy funds and diplomatic relationships as acting head of mission.`;
    return {
      meta: [
        { title: `Persona Non Grata — ${chapter.label}` },
        { name: "description", content: description },
        { property: "og:title", content: `Persona Non Grata — ${chapter.label}` },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: Index,
});

function Index() {
  const [screen, setScreen] = useState<"title" | "play">("title");
  const toTitle = () => setScreen("title");
  const day = useGame((s) => s.day);
  const ended = useGame((s) => s.ending !== null);
  const playing = useGame((s) => s.character !== null) && screen === "play";
  useEffect(() => {
    player.want(trackFor(playing ? "play" : "title", day, lastDay(), ended));
  }, [playing, day, ended]);
  // A render error on either screen shows the apology; "Back to the title screen" leaves the save as it was.
  return (
    <ErrorBoundary onBackToTitle={toTitle}>
      <Screen screen={screen} onPlay={() => setScreen("play")} onTitle={toTitle} />
    </ErrorBoundary>
  );
}

function Screen({
  screen,
  onPlay,
  onTitle,
}: {
  screen: "title" | "play";
  onPlay: () => void;
  onTitle: () => void;
}) {
  const hasCharacter = useGame((s) => s.character !== null);
  if (screen === "title") return <TitleScreen onNew={onPlay} onLoad={onPlay} />;
  return hasCharacter ? <GameScreen onMenu={onTitle} /> : <CharacterBuilder />;
}
