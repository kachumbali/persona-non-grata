import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CharacterBuilder } from "@/game/components/CharacterBuilder";
import { TitleScreen } from "@/game/components/TitleScreen";
import { GameScreen } from "@/game/components/GameScreen";
import { activeChapter } from "@/game/chapters";
import { initSaves } from "@/game/saves";
import { useGame } from "@/game/store";

// Load the save slots before the first render (the game reads browser storage, so client only).
if (typeof window !== "undefined") initSaves();

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
  const hasCharacter = useGame((s) => s.character !== null);
  const [screen, setScreen] = useState<"title" | "play">("title");
  if (screen === "title")
    return <TitleScreen onNew={() => setScreen("play")} onLoad={() => setScreen("play")} />;
  return hasCharacter ? <GameScreen onMenu={() => setScreen("title")} /> : <CharacterBuilder />;
}
