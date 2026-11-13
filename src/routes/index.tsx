import { createFileRoute } from "@tanstack/react-router";
import { CharacterBuilder } from "@/game/components/CharacterBuilder";
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
  return hasCharacter ? <GameScreen /> : <CharacterBuilder />;
}
