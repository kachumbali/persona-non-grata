import city from "@/assets/port-hesperia.jpg";
import { Button } from "@/components/ui/button";
import { BLOCKS } from "../rules";
import { useGame } from "../store";
import { Portrait } from "./Portrait";

export function TitleScreen({ onNew, onLoad }: { onNew: () => void; onLoad: () => void }) {
  const g = useGame();
  const save = g.character && !g.ending ? g.character : null;
  const newGame = () => {
    if (save && !confirm(`Start a new game? ${save.title} ${save.name}'s posting will be overwritten.`)) return;
    g.reset(); onNew();
  };
  return (
    <main className="title-screen" style={{ backgroundImage: `url(${city})` }}>
      <div className="retro-builder mx-auto w-full max-w-md p-0">
        <div className="retro-titlebar">Main Menu</div>
        <div className="p-6 text-center">
          <p className="font-mono text-lg uppercase text-muted-foreground">Republic of Bellaluxe presents</p>
          <h1 className="game-logo my-2">Persona Non Grata</h1>
          <p className="font-mono text-2xl">Chapter 1 · The Minister’s Visit</p>
          <div className="mt-6 flex flex-col gap-3">
            <Button size="lg" className="retro-button" onClick={newGame}>New game</Button>
            <Button size="lg" variant="outline" className="retro-button h-auto py-2" disabled={!save} onClick={onLoad}>
              {save ? <span className="flex items-center gap-3 text-left"><Portrait face={save.face} size={32} /><span>Load game<span className="block text-xs">{save.title} {save.name} · Day {g.day}, {BLOCKS[g.block]?.name}</span></span></span> : "Load game · no saved posting"}
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">Your progress saves automatically in this browser.</p>
        </div>
      </div>
    </main>
  );
}
