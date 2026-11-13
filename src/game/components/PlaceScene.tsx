import { useState } from "react";
import { Monitor, Printer, Smartphone, DoorOpen } from "lucide-react";
import office from "@/assets/scenes/embassy-office.jpg";
import city from "@/assets/port-hesperia.jpg";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CAMPAIGN } from "../rules";
import { useGame } from "../store";
import { SPOTS } from "./CityMap";
import { Conversation } from "./Conversation";
import { GoodwillDashboard } from "./GoodwillDashboard";
import { Mailbox } from "./Mailbox";
import { PlanningDesk } from "./PlanningDesk";
import { Portrait } from "./Portrait";

type Win = null | "pc" | "fax" | "phone";
const PC_TABS = [["mail", "Outlook 98"], ["tasks", "Staff & diary"], ["watch", "Mission Watch"]] as const;

export function PlaceScene({ onLeave }: { onLeave: () => void }) {
  const g = useGame();
  const [win, setWin] = useState<Win>(null);
  const [tab, setTab] = useState<typeof PC_TABS[number][0]>("mail");
  const place = CAMPAIGN.locations.find((l) => l.id === g.location) ?? CAMPAIGN.locations[0];
  const atEmbassy = g.location === "embassy";
  const people = CAMPAIGN.characters.filter((c) => c.location === g.location);
  const spot = SPOTS[g.location] ?? { x: 50, y: 50 };
  return (
    <section className="embassy-window bg-card" aria-label={place?.name}>
      <div className="retro-titlebar justify-between"><h2>{atEmbassy ? "Embassy · Your office" : place?.name}</h2></div>
      <div className="place-scene">
        {atEmbassy
          ? <img src={office} width={1536} height={768} alt="Painted embassy office" className="block aspect-[2/1] w-full object-cover" />
          : <div role="img" aria-label={`Painted view of ${place?.name}`} className="aspect-[2/1] w-full" style={{ backgroundImage: `url(${city})`, backgroundSize: "300%", backgroundPosition: `${spot.x}% ${spot.y}%` }} />}
        {atEmbassy && <>
          <button type="button" className="scene-hotspot" style={{ left: "3%", top: "42%", width: "12%", height: "22%" }} onClick={() => setWin("pc")} aria-label="Use your PC"><span className="map-label"><Monitor className="inline size-4" /> PC</span></button>
          <button type="button" className="scene-hotspot" style={{ left: "69%", top: "38%", width: "10%", height: "16%" }} onClick={() => setWin("fax")} aria-label="Read the secure fax"><span className="map-label"><Printer className="inline size-4" /> Secure fax</span></button>
        </>}
        <button type="button" className="scene-hotspot" style={{ right: "1%", top: "8%", width: "8%", height: "60%" }} onClick={onLeave} aria-label="Leave to the town map"><span className="map-label"><DoorOpen className="inline size-4" /> Town</span></button>
        <div className="scene-people">
          {people.map((c) => (
            <button key={c.id} type="button" className="scene-person" data-active={g.selectedNpc === c.id} onClick={() => g.selectNpc(c.id)} aria-label={`Talk to ${c.name}`}>
              <Portrait face={c.face} size={56} /><span className="map-label">{c.name.split(" ")[0]}</span>
            </button>
          ))}
        </div>
        {!atEmbassy && <Button className="absolute bottom-3 right-3" onClick={() => setWin("phone")}><Smartphone className="size-4" />BlackBerry</Button>}
      </div>
      <p className="px-3 py-2 text-sm">{place?.description} {atEmbassy ? "Click your PC, the fax, or a colleague." : "Click someone to talk. Your BlackBerry keeps mail within reach."}</p>
      <Conversation />

      <Dialog open={win === "pc"} onOpenChange={(o) => !o && setWin(null)}>
        <DialogContent className="xp-window text-card-foreground max-h-[92vh] max-w-6xl overflow-y-auto p-0">
          <DialogTitle className="xp-titlebar">Bellaluxe Diplomatic Workstation — Windows XP</DialogTitle>
          <div className="flex gap-1 border-b border-border bg-muted px-2 pt-2">{PC_TABS.map(([id, label]) => <Button key={id} size="sm" variant={tab === id ? "secondary" : "ghost"} aria-pressed={tab === id} className="retro-button" onClick={() => setTab(id)}>{label}</Button>)}</div>
          {tab === "mail" && <Mailbox channel="mail" />}
          {tab === "tasks" && <PlanningDesk />}
          {tab === "watch" && <GoodwillDashboard />}
        </DialogContent>
      </Dialog>
      <Dialog open={win === "fax"} onOpenChange={(o) => !o && setWin(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto bg-card p-0 text-card-foreground">
          <DialogTitle className="retro-titlebar">SECURE FAX · Capital → Port Hesperia</DialogTitle>
          <Mailbox channel="fax" />
        </DialogContent>
      </Dialog>
      <Dialog open={win === "phone"} onOpenChange={(o) => !o && setWin(null)}>
        <DialogContent className="blackberry max-h-[90vh] max-w-md overflow-y-auto">
          <DialogTitle className="font-mono">BlackBerry · Mail</DialogTitle>
          <Mailbox channel="mail" />
          <p className="text-xs">Capital's instructions arrive by secure fax. You must be at the embassy to read them.</p>
        </DialogContent>
      </Dialog>
    </section>
  );
}
