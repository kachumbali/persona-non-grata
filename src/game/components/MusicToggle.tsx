import { Music, VolumeX } from "lucide-react";
import { useMusicSettings } from "../music";

/** Music on/off, remembered in browser storage. */
export function MusicToggle({ className = "" }: { className?: string }) {
  const muted = useMusicSettings((s) => s.muted);
  const toggle = useMusicSettings((s) => s.toggle);
  return (
    <button
      type="button"
      className={`hud-phone ${className}`}
      onClick={toggle}
      aria-pressed={!muted}
      aria-label={muted ? "Music off. Turn music on" : "Music on. Turn music off"}
      title={muted ? "Music off" : "Music on"}
    >
      {muted ? <VolumeX className="size-5" /> : <Music className="size-5" />}
    </button>
  );
}
