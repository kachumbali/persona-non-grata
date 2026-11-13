import face1 from "@/assets/portraits/diplomat-1.png";
import face2 from "@/assets/portraits/diplomat-2.png";
import face3 from "@/assets/portraits/diplomat-3.png";
import face4 from "@/assets/portraits/diplomat-4.png";
import face5 from "@/assets/portraits/diplomat-5.png";
import face6 from "@/assets/portraits/diplomat-6.png";
import face7 from "@/assets/portraits/diplomat-7.png";
import face8 from "@/assets/portraits/diplomat-8.png";
const faces = [face1, face2, face3, face4, face5, face6, face7, face8];
export function Portrait({ face, size = 64 }: { face: number; size?: number }) {
  return <img className="pixel-portrait" src={faces[((face % 8) + 8) % 8]} width={size} height={Math.round(size * 4 / 3)} alt={`Diplomat portrait ${face + 1}`} />;
}
