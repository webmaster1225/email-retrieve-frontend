"use client";

import type { PlanView } from "@/lib/compass/types";

type Props = {
  onApprove: () => void;
  plan: PlanView | null;
  busy?: boolean;
};

export function PlanCard({ onApprove, plan, busy }: Props) {
  if (!plan) {
    return (
      <div className="compass-work-block">
        <h2 className="compass-work-title">Search plan</h2>
        <p className="compass-muted">Loading plan from campaign…</p>
      </div>
    );
  }

  return (
    <div className="compass-work-block">
      <h2 className="compass-work-title">Here&apos;s my plan — approve or tell me what to change</h2>
      <div className="compass-plan-card">
        <div className="compass-plan-row">
          <span className="compass-plan-key">Objective</span>
          <span>{plan.objective}</span>
        </div>
        <div className="compass-plan-row">
          <span className="compass-plan-key">Search</span>
          <span>
            {plan.search}
            <br />
            <span className="compass-muted">{plan.searchDetail}</span>
          </span>
        </div>
        <div className="compass-plan-row">
          <span className="compass-plan-key">Look for</span>
          <span>{plan.lookFor}</span>
        </div>
        <div className="compass-plan-row">
          <span className="compass-plan-key">Prioritize</span>
          <span>{plan.prioritize}</span>
        </div>
        <div className="compass-plan-row">
          <span className="compass-plan-key">Exclude</span>
          <span>{plan.exclude}</span>
        </div>
        <div className="compass-plan-row">
          <span className="compass-plan-key">Later</span>
          <span>{plan.later}</span>
        </div>
        <div className="compass-plan-row">
          <span className="compass-plan-key">Assumption</span>
          <span>{plan.assumption}</span>
        </div>
      </div>
      <div className="compass-work-actions">
        <button type="button" className="button primary" disabled={busy} onClick={onApprove}>
          Approve &amp; start searching
        </button>
        <span className="compass-muted">or reply in the conversation…</span>
      </div>
    </div>
  );
}
