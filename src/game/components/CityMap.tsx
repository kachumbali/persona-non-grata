import { useState } from "react";
import { MapPin } from "lucide-react";
import city from "@/assets/port-hesperia.jpg";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { BLOCKS, CAMPAIGN, locationStories } from "../rules";
import { playerTime, playerCapacity } from "../economy";
import { visibleInvitations } from "../calendar";
import { TRAVEL_DP, useGame } from "../store";

// Hotspot positions (% of the painting) for each campaign location.
export const SPOTS: Record<string, { x: number; y: number }> = {
  embassy: { x: 16, y: 34 }, ministry: { x: 39, y: 20 }, un: { x: 68, y: 26 }, eu: { x: 89, y: 32 },
  golf: { x: 85, y: 10 }, pressclub: { x: 66, y: 80 }, bar: { x: 92, y: 82 },
};

export function CityMap({ onEnter }: { onEnter: () => void }) {
  const g = useGame();
  const [target, setTarget] = useState<string | null>(null);
  const [error, setError] = useState("");
  const left = playerCapacity(g.character, g.energy, g.composure, g.alcohol).total - g.pending.reduce((n, p) => n + playerTime(p), 0);
  const invitations = visibleInvitations(g.day, g.block, g.storyOutcomes);
  const leads = locationStories(g.day, g.completedEvents, g.storyOutcomes);
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
          const lead = leads.find((item) => item.location === l.id);
          const invitation = invitations.find((item) => item.location === l.id);
          return (
            <button key={l.id} type="button" onClick={() => (here ? onEnter() : (setError(""), setTarget(l.id)))}
              className="map-spot" data-here={here} style={{ left: `${spot.x}%`, top: `${spot.y}%` }} aria-label={`${here ? `Enter ${l.name} (you are here)` : `Travel to ${l.name}`}${invitation ? ` · invitation Day ${invitation.day} ${BLOCKS[invitation.block]?.name}` : ""}${lead ? ` · story lead: ${lead.title}` : ""}`}>
              {here && <MapPin className="map-pin size-9" aria-hidden />}
              <span className="map-label">{l.name}{here ? " · YOU ARE HERE" : ""}{invitation ? ` · invitation D${invitation.day}` : ""}{lead ? " · lead" : ""}</span>
            </button>
          );
        })}
      </div>
      <div className="map-destinations" aria-label="Destinations">
        {CAMPAIGN.locations.map((location) => {
          const here = g.location === location.id;
          const invitation = invitations.find((item) => item.location === location.id);
          const lead = leads.find((item) => item.location === location.id);
          return <Button key={location.id} type="button" variant="outline" className="h-auto min-h-10 justify-start whitespace-normal text-left" onClick={() => here ? onEnter() : (setError(""), setTarget(location.id))}>
            <span>{here ? "Enter" : "Travel to"} {location.name}{here ? " · you are here" : ""}{invitation ? ` · invitation Day ${invitation.day} ${BLOCKS[invitation.block]?.name}` : ""}{lead ? " · story lead" : ""}</span>
          </Button>;
        })}
      </div>
      <p className="px-3 py-2 text-sm">Enter where you are or choose a destination. Travelling elsewhere costs {TRAVEL_DP} DP.</p>
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
