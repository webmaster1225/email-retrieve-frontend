"use client";

import type { CompassStage } from "@/lib/compass/stages";

/** Primary funnel steps shown in the workspace progress strip. */
export const FUNNEL_STEPS: { id: CompassStage; label: string }[] = [
  { id: "plan", label: "Plan" },
  { id: "cards", label: "Contacts" },
  { id: "confirm", label: "Strategy" },
  { id: "research", label: "Context" },
  { id: "drafts", label: "Drafts" },
  { id: "sendAcct", label: "Mailbox" },
  { id: "review", label: "Send" },
  { id: "tracking", label: "Track" },
];

function funnelIndex(stage: CompassStage): number {
  switch (stage) {
    case "home":
    case "clarify":
    case "campaigns":
      return -1;
    case "plan":
    case "progress":
      return 0;
    case "cards":
      return 1;
    case "confirm":
      return 2;
    case "research":
      return 3;
    case "drafts":
      return 4;
    case "sendAcct":
      return 5;
    case "review":
    case "done":
      return 6;
    case "tracking":
      return 7;
    default:
      return -1;
  }
}

type Props = {
  stage: CompassStage;
};

export function StageStrip({ stage }: Props) {
  const active = funnelIndex(stage);
  if (active < 0) return null;

  return (
    <nav className="compass-stage-strip" aria-label="Campaign progress">
      <ol className="compass-stage-list">
        {FUNNEL_STEPS.map((step, i) => {
          const state = i < active ? "done" : i === active ? "current" : "upcoming";
          return (
            <li key={step.id} className={`compass-stage-item is-${state}`}>
              <span className="compass-stage-index" aria-hidden>
                {i < active ? "✓" : i + 1}
              </span>
              <span className="compass-stage-label">{step.label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
