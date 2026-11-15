/** Helpers shared by the store tests: they play the mission the way a diligent player would. */
import { nextStep, stepContext, stepStatus } from "./mission";
import { campaign, missionTasks } from "./rules";
import { useGame } from "./store";

/**
 * Delegate the next step of each open mission task that can be done now, to a rested colleague
 * who has the skill. Returns how many assignments were queued. Colleagues are off duty in the
 * evening, so nothing is queued then.
 */
export function workOnMissionSteps(): number {
  let queued = 0;
  for (const task of Object.keys(missionTasks())) {
    const s = useGame.getState();
    if (s.block === 3) return queued;
    const step = nextStep(s.missionSteps, task);
    if (!step || stepStatus(stepContext(s), task, step.id).state !== "available") continue;
    if (s.pending.some((p) => p.task === task)) continue;
    const skill = step.skill ?? task;
    const worker = campaign().characters.find(
      (c) =>
        c.location === "embassy" &&
        c.skills.includes(skill) &&
        (s.colleagues[c.id]?.trust ?? 0) >= 25 &&
        (s.colleagues[c.id]?.fatigue ?? 0) < 80 &&
        !s.pending.some((p) => p.worker === c.id),
    );
    if (!worker) continue;
    const ok = useGame.getState().queue({
      id: `work-${worker.id}`,
      kind: "work",
      worker: worker.id,
      task,
      source: `${worker.name} · ${missionTasks()[task]}`,
      text: "",
      effects: { confidence: 3 },
      timeCost: 0,
      overload: true,
    });
    if (ok) queued++;
  }
  return queued;
}
