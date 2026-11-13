import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CharacterBuilder } from "@/game/components/CharacterBuilder";
import { TitleScreen } from "@/game/components/TitleScreen";
import { GameScreen } from "@/game/components/GameScreen";
import { useGame } from "@/game/store";

export const Route = createFileRoute("/")({
  ssr: false, // the game reads its save from the browser
  head: () => ({
    meta: [
      { title: "Persona Non Grata — Chapter 1" },
      { name: "description", content: "Chapter 1: The Minister’s Visit. Manage limited time, embassy funds and diplomatic relationships as acting head of mission." },
      { property: "og:title", content: "Persona Non Grata — Chapter 1" },
      { property: "og:description", content: "Chapter 1: The Minister’s Visit. Manage limited time, embassy funds and diplomatic relationships as acting head of mission." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const hasCharacter = useGame((s) => s.character !== null);
  const [screen, setScreen] = useState<"title" | "play">("title");
  if (screen === "title") return <TitleScreen onNew={() => setScreen("play")} onLoad={() => setScreen("play")} />;
  return hasCharacter ? <GameScreen onMenu={() => setScreen("title")} /> : <CharacterBuilder />;
}
