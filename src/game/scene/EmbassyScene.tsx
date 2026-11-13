import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Environment, Lightformer } from "@react-three/drei";
import { CanvasTexture, NearestFilter, SRGBColorSpace } from "three";
import { Building2, ChevronLeft, ChevronRight, Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import data from "../data/embassy.json";
import { useGame } from "../store";
import { characterTexture, floorTexture, readPalette, type Palette } from "./pixel-art";

type Room = typeof data.rooms[number];
type Staff = typeof data.staff[number];
type Point = [number, number, number];

function Block({ at, size, color }: { at: Point; size: Point; color: string }) {
  return <mesh position={at}><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={0.95} flatShading /></mesh>;
}

function Desk({ x = 0, z = 0, p }: { x?: number; z?: number; p: Palette }) {
  return <group position={[x, 0, z]}>
    <Block at={[0, 0.5, 0]} size={[1.7, 0.18, 0.85]} color={p.wood} />
    <Block at={[-0.6, 0.24, 0]} size={[0.28, 0.48, 0.65]} color={p.ink} />
    <Block at={[0.6, 0.24, 0]} size={[0.28, 0.48, 0.65]} color={p.ink} />
    <Block at={[-0.35, 0.74, -0.15]} size={[0.62, 0.42, 0.12]} color={p.ink} />
    <Block at={[-0.35, 0.74, -0.08]} size={[0.46, 0.27, 0.03]} color={p.blue} />
    <Block at={[0.45, 0.62, 0.15]} size={[0.45, 0.07, 0.35]} color={p.paper} />
  </group>;
}

function Plant({ x, z, p }: { x: number; z: number; p: Palette }) {
  return <group position={[x, 0, z]}>
    <Block at={[0, 0.22, 0]} size={[0.4, 0.44, 0.4]} color={p.red} />
    <Block at={[0, 0.72, 0]} size={[0.7, 0.7, 0.6]} color={p.leaf} />
    <Block at={[0.1, 1.12, 0]} size={[0.42, 0.35, 0.42]} color={p.grass} />
  </group>;
}

function Furniture({ room, p }: { room: Room; p: Palette }) {
  switch (room.kind) {
    case "office": return <><Desk x={0.3} z={-0.6} p={p} /><Block at={[-1.8, 0.35, -0.7]} size={[0.7, 0.7, 1.5]} color={p.blue} /><Plant x={2.2} z={-1.1} p={p} /></>;
    case "desks": return <><Desk x={-1.3} z={-0.65} p={p} /><Desk x={1.3} z={-0.65} p={p} /><Block at={[1.6, 0.45, 0.75]} size={[1.2, 0.9, 0.4]} color={p.blue} /></>;
    case "archive": return <>{[-1.8, -0.6, 0.6, 1.8].map((x) => <group key={x} position={[x, 0, -1.15]}><Block at={[0, 0.68, 0]} size={[0.9, 1.35, 0.55]} color={p.blue} />{[0.35, 0.8, 1.25].map((y) => <Block key={y} at={[0, y, 0.29]} size={[0.65, 0.09, 0.04]} color={p.paper} />)}</group>)}<Block at={[-1, 0.4, 0.5]} size={[1.5, 0.8, 0.8]} color={p.wood} /></>;
    case "server": return <>{[-1.7, 0, 1.7].map((x) => <group key={x} position={[x, 0, -1]}><Block at={[0, 0.85, 0]} size={[1, 1.7, 0.65]} color={p.ink} />{[0.35, 0.7, 1.05, 1.4].map((y) => <Block key={y} at={[0, y, 0.34]} size={[0.65, 0.13, 0.03]} color={p.leaf} />)}</group>)}</>;
    case "roof": return <><Block at={[0.7, 0.35, -0.25]} size={[0.5, 0.7, 0.5]} color={p.ink} /><mesh position={[0.7, 1.3, -0.25]} rotation={[0.8, 0, 0.2]}><sphereGeometry args={[1.15, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={p.paper} side={2} flatShading /></mesh><Block at={[0.7, 1.6, 0]} size={[0.08, 1.4, 0.08]} color={p.ink} /><Block at={[-1.8, 0.25, -1.1]} size={[0.8, 0.5, 0.8]} color={p.blue} /></>;
    case "reception": return <><Block at={[0, 0.38, -0.4]} size={[3.5, 0.76, 1.1]} color={p.wood} /><Block at={[0, 0.8, -0.4]} size={[3.6, 0.08, 1.15]} color={p.paper} />{[-1.3, 0, 1.3].map((x) => <Block key={x} at={[x, 0.88, -0.4]} size={[0.42, 0.07, 0.42]} color={p.gold} />)}<Plant x={2.2} z={-1.1} p={p} /></>;
    case "kitchen": return <><Block at={[0, 0.45, -1]} size={[4.5, 0.9, 0.8]} color={p.paper} /><Block at={[-1.3, 0.93, -1]} size={[1, 0.08, 0.65]} color={p.ink} /><Block at={[1.1, 1.15, -1]} size={[0.65, 0.5, 0.55]} color={p.red} /><Block at={[2.1, 0.8, 0]} size={[0.65, 1.6, 0.8]} color={p.blue} /><Block at={[0.1, 0.97, -1]} size={[0.45, 0.16, 0.3]} color={p.gold} /></>;
    case "generator": return <><Block at={[0.6, 0.55, -0.6]} size={[2.5, 1.1, 1.3]} color={p.leaf} /><Block at={[0.4, 1.18, -0.6]} size={[1.8, 0.16, 0.8]} color={p.ink} /><Block at={[1.4, 1.65, -1]} size={[0.18, 1.3, 0.18]} color={p.ink} /><Block at={[-1.9, 0.42, -1]} size={[0.65, 0.84, 0.65]} color={p.red} /></>;
    case "consular": return <><Block at={[0, 0.5, -0.85]} size={[4.7, 1, 0.7]} color={p.blue} /><Block at={[0, 1.04, -0.85]} size={[4.9, 0.08, 0.85]} color={p.wood} />{[-1.7, -0.65, 0.4].map((x) => <Block key={x} at={[x, 0.3, 0.65]} size={[0.65, 0.6, 0.65]} color={p.red} />)}</>;
    case "garden": return <><Plant x={-1.8} z={-0.9} p={p} /><Plant x={1.8} z={-0.9} p={p} /><Block at={[0, 0.32, -0.6]} size={[2, 0.2, 0.6]} color={p.wood} /><Block at={[0, 0.63, -0.9]} size={[2, 0.55, 0.12]} color={p.wood} /><Block at={[0, 0.12, 0.5]} size={[1.7, 0.2, 0.6]} color={p.stone} /></>;
    case "motor": return <>{[-1.2, 2.3].map((x) => <group key={x} position={[x, 0, -0.25]}><Block at={[0, 0.4, 0]} size={[2.8, 0.55, 1.3]} color={p.ink} /><Block at={[0.2, 0.95, 0]} size={[1.4, 0.65, 1.2]} color={p.blue} /><Block at={[0.2, 1.04, 0.62]} size={[1.1, 0.34, 0.03]} color={p.paper} />{[-0.9, 0.9].map((wheel) => <Block key={wheel} at={[wheel, 0.25, 0]} size={[0.5, 0.5, 1.5]} color={p.ink} />)}<Block at={[-1.42, 0.52, 0]} size={[0.05, 0.2, 1.1]} color={p.gold} /></group>)}</>;
    default: return null;
  }
}

function RoomLabel({ text, p, width = 3.9 }: { text: string; p: Palette; width?: number }) {
  const map = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 320; c.height = 36;
    const ctx = c.getContext("2d");
    if (ctx) { ctx.fillStyle = p.ink; ctx.fillRect(0, 0, 320, 36); ctx.fillStyle = p.paper; ctx.font = "bold 16px monospace"; ctx.textAlign = "center"; ctx.fillText(text.toUpperCase(), 160, 24); }
    const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.magFilter = NearestFilter; return t;
  }, [text, p]);
  useEffect(() => () => map.dispose(), [map]);
  return <Billboard><mesh><planeGeometry args={[width, width * 36 / 320]} /><meshBasicMaterial map={map} transparent depthTest={false} /></mesh></Billboard>;
}

function RoomFloor({ room, p, selected, onSelect }: { room: Room; p: Palette; selected: boolean; onSelect: () => void }) {
  const map = useMemo(() => floorTexture(room.floor, p), [room.floor, p]);
  useEffect(() => () => map.dispose(), [map]);
  const width = room.id === "motor" ? 11.7 : 5.7;
  return <group position={[room.x, 0, room.z]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <planeGeometry args={[width, 3.7]} /><meshStandardMaterial map={map} roughness={1} />
    </mesh>
    <Block at={[0, 0.2, -1.95]} size={[width + 0.15, 0.4, 0.16]} color={selected ? p.gold : p.trim} />
    <Block at={[-width / 2 - 0.1, 0.2, 0]} size={[0.16, 0.4, 3.9]} color={selected ? p.gold : p.trim} />
    <Furniture room={room} p={p} />
    <group position={[0, 0.15, 1.5]}><RoomLabel text={room.name} p={p} width={room.id === "rooftop" ? 4.9 : 4.5} /></group>
  </group>;
}

function Person({ staff, p, selected, onSelect }: { staff: Staff; p: Palette; selected: boolean; onSelect: () => void }) {
  const room = data.rooms.find((r) => r.id === staff.room);
  const map = useMemo(() => characterTexture(staff.face, p, staff.animal), [staff.face, staff.animal, p]);
  useEffect(() => () => map.dispose(), [map]);
  if (!room) return null;
  return <group position={[room.x + staff.x, 0, room.z + staff.z]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}><circleGeometry args={[0.4, 16]} /><meshBasicMaterial color={selected ? p.gold : p.ink} transparent opacity={selected ? 0.9 : 0.18} /></mesh>
    <Billboard position={[0, 0.95, 0]}><mesh onClick={(e) => { e.stopPropagation(); onSelect(); }}><planeGeometry args={[1.05, 1.58]} /><meshBasicMaterial map={map} transparent alphaTest={0.1} /></mesh></Billboard>
  </group>;
}

function CameraRig({ zoom }: { zoom: number }) {
  const { camera, size } = useThree();
  useEffect(() => { camera.position.set(22, 26, 28); camera.lookAt(0, 0, 0); camera.zoom = Math.min(size.width / 33, size.height / 24) * zoom; camera.updateProjectionMatrix(); }, [camera, size, zoom]);
  return null;
}

function Ready({ wrapper }: { wrapper: React.RefObject<HTMLDivElement | null> }) {
  const frames = useRef(0);
  useFrame(() => { frames.current += 1; if (frames.current === 2 && wrapper.current) wrapper.current.dataset['sceneReady'] = "1"; });
  return null;
}

export const EmbassyScene = memo(function EmbassyScene() {
  const wrapper = useRef<HTMLDivElement>(null);
  const [p, setPalette] = useState<Palette | null>(null);
  const [roomId, setRoomId] = useState("office");
  const [staffId, setStaffId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [angle, setAngle] = useState(0);
  const character = useGame((s) => s.character);
  useEffect(() => { setPalette(readPalette()); }, []);
  const room = data.rooms.find((r) => r.id === roomId) ?? data.rooms[0];
  const staff = data.staff.find((s) => s.id === staffId);
  const chooseStaff = (s: Staff) => { setStaffId(s.id); setRoomId(s.room); };
  const player = useMemo(() => ({ id: "player", name: character?.name ?? "Chargé d’Affaires", role: "Chargé d’Affaires a.i.", room: "reception", face: character?.face ?? 0, x: -1.5, z: 0.65 }), [character]);
  if (!room) return null;

  return <section className="mb-4 overflow-hidden border border-border bg-card" aria-label="Embassy floor plan">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
      <div className="flex items-center gap-2"><Building2 className="size-4 text-primary" /><h2 className="font-bold">Embassy of Bellaluxe</h2><span className="hidden font-mono text-xs text-muted-foreground sm:inline">PORT HESPERIA</span></div>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" title="Rotate left" aria-label="Rotate left" onClick={() => setAngle((v) => v - Math.PI / 2)}><ChevronLeft /></Button>
        <Button variant="ghost" size="icon" title="Rotate right" aria-label="Rotate right" onClick={() => setAngle((v) => v + Math.PI / 2)}><ChevronRight /></Button>
        <Button variant="ghost" size="icon" title="Zoom out" aria-label="Zoom out" disabled={zoom <= 0.8} onClick={() => setZoom((v) => Math.max(0.8, v - 0.2))}><Minus /></Button>
        <Button variant="ghost" size="icon" title="Zoom in" aria-label="Zoom in" disabled={zoom >= 1.6} onClick={() => setZoom((v) => Math.min(1.6, v + 0.2))}><Plus /></Button>
        <Button variant="ghost" size="icon" title="Reset view" aria-label="Reset view" onClick={() => { setZoom(1); setAngle(0); }}><RotateCcw /></Button>
      </div>
    </div>
    <div ref={wrapper} className="embassy-canvas relative h-[420px] w-full sm:h-[510px] lg:h-[570px]">
      {p && <Canvas orthographic flat dpr={0.8} frameloop="demand" camera={{ position: [22, 26, 28], near: 0.1, far: 150 }} gl={{ antialias: false, alpha: false }}>
        <color attach="background" args={[p.ground]} />
        <ambientLight intensity={0.8} /><directionalLight position={[-10, 20, 8]} intensity={2.2} />
        <Environment resolution={64}><Lightformer intensity={1} position={[0, 10, 0]} scale={[30, 30, 1]} /><Lightformer color={p.blue} intensity={0.5} position={[-10, 3, 0]} rotation-y={Math.PI / 2} scale={[20, 10, 1]} /></Environment>
        <CameraRig zoom={zoom} />
        <group rotation-y={angle}>
          <Block at={[0, -0.25, 0]} size={[24.5, 0.5, 12.5]} color={p.trim} />
          <Block at={[0, 1.1, -6.2]} size={[24.5, 2.2, 0.2]} color={p.wall} />
          {[-10.5, -7.5, -4.5, -1.5, 1.5, 4.5, 7.5, 10.5].map((x) => <group key={x}><Block at={[x, 1.25, -6.07]} size={[1.6, 1.3, 0.04]} color={p.trim} /><Block at={[x, 1.25, -6.03]} size={[1.35, 1.1, 0.04]} color={p.blue} /><Block at={[x, 1.25, -6]} size={[0.07, 1.1, 0.04]} color={p.paper} /></group>)}
          {data.rooms.map((r) => <RoomFloor key={r.id} room={r} p={p} selected={r.id === roomId} onSelect={() => { setRoomId(r.id); setStaffId(null); }} />)}
          {data.staff.map((s) => <Person key={s.id} staff={s} p={p} selected={staffId === s.id} onSelect={() => chooseStaff(s)} />)}
          <Person staff={player} p={p} selected={staffId === "player"} onSelect={() => { setStaffId("player"); setRoomId("reception"); }} />
          <Block at={[-12.8, 1.4, 4.5]} size={[0.08, 2.8, 0.08]} color={p.ink} />
          <Block at={[-12.15, 2.45, 4.5]} size={[1.3, 0.65, 0.05]} color={p.blue} /><Block at={[-12.15, 2.22, 4.54]} size={[1.3, 0.18, 0.02]} color={p.gold} />
        </group><Ready wrapper={wrapper} />
      </Canvas>}
    </div>
    <div className="grid border-t border-border md:grid-cols-[1fr_280px]">
      <div className="min-w-0 p-4"><h3 className="mb-2 text-sm font-bold">Locations</h3><div className="flex flex-wrap gap-1.5">{data.rooms.map((r) => <Button key={r.id} size="sm" variant={roomId === r.id ? "secondary" : "ghost"} onClick={() => { setRoomId(r.id); setStaffId(null); }}>{r.name}</Button>)}</div></div>
      <div className="border-t border-border p-4 md:border-l md:border-t-0"><p className="font-mono text-xs text-muted-foreground">{staff ? staff.role : staffId === "player" ? player.role : "LOCATION FILE"}</p><h3 className="mt-1 text-sm font-bold">{staff?.name ?? (staffId === "player" ? player.name : room.name)}</h3><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{room.note}</p></div>
    </div>
    <div className="border-t border-border px-4 py-3"><h3 className="mb-2 text-sm font-bold">Personnel</h3><div className="flex flex-wrap gap-1.5">{data.staff.map((s) => <Button key={s.id} variant={staffId === s.id ? "secondary" : "ghost"} size="sm" onClick={() => chooseStaff(s)}>{s.name}</Button>)}</div></div>
  </section>;
});