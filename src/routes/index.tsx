import { createFileRoute } from "@tanstack/react-router";
import { CharacterBuilder } from "@/game/components/CharacterBuilder";
import { GameScreen } from "@/game/components/GameScreen";
import { useGame } from "@/game/store";

export const Route = createFileRoute("/")({
  ssr: false, // the game reads its save from the browser
  head: () => ({
    meta: [
      { title: "Persona Non Grata — A Satirical Embassy Simulator" },
      { name: "description", content: "Survive 15 working days as Chargé d'Affaires ad interim before the Foreign Minister arrives." },
      { property: "og:title", content: "Persona Non Grata — A Satirical Embassy Simulator" },
      { property: "og:description", content: "Survive 15 working days as Chargé d'Affaires ad interim before the Foreign Minister arrives." },
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
