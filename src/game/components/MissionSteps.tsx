import { campaign, missionTasks, type VisitTask } from "../rules";
import { money } from "../economy";
import {
  stepCash,
  routeContext,
  routeStatus,
  stepContext,
  stepLabel,
  stepStatus,
  stepsDone,
  stepsOf,
  taskComplete,
} from "../mission";
import { useGame } from "../store";
import { Portrait } from "./Portrait";

/**
 * The mission tasks with their steps: done, available now, or blocked with the reason.
 * One list, shown on Mission Watch and in the summary under the header.
 */
export function MissionSteps({ compact = false }: { compact?: boolean }) {
  const g = useGame();
  const ctx = stepContext(g);
  return (
    <div>
      <p className="mb-2 text-xs">
        Owed to you:{" "}
        {Object.entries(g.favours.owedToYou)
          .filter(([, n]) => n > 0)
          .map(([id, n]) => `${campaign().characters.find((c) => c.id === id)?.name ?? id} ${n}`)
          .join(" · ") || "none"}{" "}
        · You owe:{" "}
        {Object.entries(g.favours.youOwe)
          .filter(([, n]) => n > 0)
          .map(([id, n]) => `${campaign().characters.find((c) => c.id === id)?.name ?? id} ${n}`)
          .join(" · ") || "none"}
      </p>
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
                  const key = `${task}.${step.id}`;
                  const delivery = g.routeDeliveries[key];
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
                        {delivery
                          ? `confirmation due Day ${delivery.dueDay}`
                          : status.state === "done"
                            ? "done"
                            : status.state === "available"
                              ? `available now${!step.routes && cash ? ` · ${money(cash)}` : ""}`
                              : status.reason}
                      </span>
                      {status.state === "available" && status.hint && (
                        <span className="basis-full pl-4 text-xs font-normal text-muted-foreground">
                          {status.hint}
                        </span>
                      )}
                      {step.routes &&
                        (() => {
                          const gatekeeper = campaign().characters.find(
                            (c) => c.id === step.gatekeeper,
                          );
                          return (
                            <div className="basis-full pl-4 text-xs font-normal text-muted-foreground">
                              {gatekeeper && (
                                <div className="flex items-center gap-2">
                                  <Portrait portrait={gatekeeper.portrait} size={32} />
                                  {gatekeeper.name}
                                </div>
                              )}
                              <ul>
                                {step.routes.map((route) => {
                                  const state = routeStatus(route, routeContext(g, task, step.id));
                                  const label = state.state === "undiscovered" ? "?" : route.label;
                                  const detail =
                                    g.usedRoutes[key] === route.id
                                      ? delivery
                                        ? `in progress · due Day ${delivery.dueDay}`
                                        : "used"
                                      : state.state === "available"
                                        ? `${status.state === "blocked" ? `${status.reason} · ` : ""}${route.dp} DP · ${money(route.cash)} · ${route.days} ${route.days === 1 ? "day" : "days"}`
                                        : state.state === "blocked"
                                          ? state.reason
                                          : state.state;
                                  return (
                                    <li key={route.id}>
                                      {label} · {detail}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          );
                        })()}
                    </li>
                  );
                })}
              </ol>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
