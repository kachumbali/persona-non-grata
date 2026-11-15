import { missionTasks, type VisitTask } from "../rules";
import { money } from "../economy";
import {
  stepCash,
  stepContext,
  stepLabel,
  stepStatus,
  stepsDone,
  stepsOf,
  taskComplete,
} from "../mission";
import { useGame } from "../store";

/**
 * The mission tasks with their steps: done, available now, or blocked with the reason.
 * One list, shown on Mission Watch and in the summary under the header.
 */
export function MissionSteps({ compact = false }: { compact?: boolean }) {
  const g = useGame();
  const ctx = stepContext(g);
  return (
    <ul className="space-y-2 text-sm" aria-label="Visit tasks and steps">
      {(Object.entries(missionTasks()) as [VisitTask, string][]).map(([task, label]) => {
        const steps = stepsOf(task);
        const complete = taskComplete(g.missionSteps, task);
        return (
          <li key={task} className="min-w-0">
            <div className={`font-bold ${complete ? "text-primary" : ""}`}>
              {complete ? "✓" : "○"} {label}
              <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
                {stepsDone(g.missionSteps, task)}/{steps.length}
              </span>
            </div>
            <ol className={`mt-1 space-y-0.5 pl-4 ${compact ? "text-xs" : "text-sm"}`}>
              {steps.map((step) => {
                const status = stepStatus(ctx, task, step.id);
                const cash = stepCash(step, task, g.setbacksApplied);
                const text = stepLabel(step, task, g.setbacksApplied);
                return (
                  <li
                    key={step.id}
                    data-state={status.state}
                    className={`flex flex-wrap gap-x-2 ${
                      status.state === "done"
                        ? "text-primary"
                        : status.state === "available"
                          ? "font-semibold"
                          : "text-muted-foreground"
                    }`}
                  >
                    <span aria-hidden="true">
                      {status.state === "done" ? "✓" : status.state === "available" ? "▶" : "·"}
                    </span>
                    <span className="min-w-0 flex-1 basis-40">{text}</span>
                    <span className="text-xs">
                      {status.state === "done"
                        ? "done"
                        : status.state === "available"
                          ? `available now${cash ? ` · ${money(cash)}` : ""}`
                          : status.reason}
                    </span>
                    {status.state === "available" && status.hint && (
                      <span className="basis-full pl-4 text-xs font-normal text-muted-foreground">
                        {status.hint}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </li>
        );
      })}
    </ul>
  );
}
