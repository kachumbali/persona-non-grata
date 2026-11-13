import { useState } from "react";
import { MapPin } from "lucide-react";
import city from "@/assets/port-hesperia.jpg";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CAMPAIGN } from "../rules";
import { playerTime } from "../economy";
import { TRAVEL_DP, useGame } from "../store";

// Hotspot positions (% of the painting) for each campaign location.
const SPOTS: Record<string, { x: number; y: number }> = {
  embassy: { x: 16, y: 34 }, ministry: { x: 39, y: 20 }, un: { x: 68, y: 26 }, eu: { x: 89, y: 32 },
  golf: { x: 85, y: 10 }, pressclub: { x: 66, y: 80 }, bar: { x: 92, y: 82 },
};

export function CityMap({ onEnter }: { onEnter: () => void }) {
  const g = useGame();
  const [target, setTarget] = useState<string | null>(null);
  const [error, setError] = useState("");
  const left = 2 - g.pending.reduce((n, p) => n + playerTime(p), 0);
  const dest = CAMPAIGN.locations.find((l) => l.id === target);
  const travel = () => {
    if (!target) return;
    if (g.move(target)) { setTarget(null); setError(""); } else setError(useGame.getState().planError || "You cannot travel now.");
  };
  return (
    <section className="embassy-window bg-card" aria-label="Town map">
      <div className="retro-titlebar justify-between"><h2>Port Hesperia</h2><span className="font-mono">{left} DP left this block</span></div>
      <div className="relative">
        <img src={city} width={1536} height={768} alt="Painted map of Port Hesperia" className="block aspect-[2/1] w-full object-cover" />
        {CAMPAIGN.locations.map((l) => {
          const spot = SPOTS[l.id]; if (!spot) return null;
          const here = g.location === l.id;
          return (
            <button key={l.id} type="button" onClick={() => (here ? onEnter() : (setError(""), setTarget(l.id)))}
              className="map-spot" data-here={here} style={{ left: `${spot.x}%`, top: `${spot.y}%` }} aria-label={here ? `Enter ${l.name} (you are here)` : `Travel to ${l.name}`}>
              {here && <MapPin className="map-pin size-9" aria-hidden />}
              <span className="map-label">{l.name}{here ? " · YOU ARE HERE" : ""}</span>
            </button>
          );
        })}
      </div>
      <p className="px-3 py-2 text-sm">Click the pin to enter where you are. Travelling elsewhere costs {TRAVEL_DP} DP.</p>
      <AlertDialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <AlertDialogContent className="retro-builder">
          <AlertDialogHeader>
            <AlertDialogTitle>Travel to {dest?.name}?</AlertDialogTitle>
            <AlertDialogDescription>{dest?.description} The trip costs {TRAVEL_DP} DP. You have {left} DP left this block.</AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Stay here</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); travel(); }}>Travel · {TRAVEL_DP} DP</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
