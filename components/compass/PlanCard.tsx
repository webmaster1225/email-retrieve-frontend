"use client";

import { PLAN } from "@/lib/compass/northwynScenario";

type Props = {
  onApprove: () => void;
};

export function PlanCard({ onApprove }: Props) {
  return (
    <div className="compass-work-block">
      <h2 className="compass-work-title">Here&apos;s my plan — approve or tell me what to change</h2>
      <div className="compass-plan-card">
        <div className="compass-plan-row">
          <span className="compass-plan-key">Objective</span>
          <span>{PLAN.objective}</span>
        </div>
        <div className="compass-plan-row">
          <span className="compass-plan-key">Search</span>
          <span>
            {PLAN.search}
            <br />
            <span className="compass-muted">{PLAN.searchDetail}</span>
          </span>
        </div>
        <div className="compass-plan-row">
          <span className="compass-plan-key">Look for</span>
          <span>{PLAN.lookFor}</span>
        </div>
        <div className="compass-plan-row">
          <span className="compass-plan-key">Prioritize</span>
          <span>{PLAN.prioritize}</span>
        </div>
        <div className="compass-plan-row">
          <span className="compass-plan-key">Exclude</span>
          <span>{PLAN.exclude}</span>
        </div>
        <div className="compass-plan-row">
          <span className="compass-plan-key">Later</span>
          <span>{PLAN.later}</span>
        </div>
        <div className="compass-plan-row">
          <span className="compass-plan-key">Assumption</span>
          <span>{PLAN.assumption}</span>
        </div>
      </div>
      <div className="compass-work-actions">
        <button type="button" className="button primary" onClick={onApprove}>
          Approve &amp; start searching
        </button>
        <span className="compass-muted">or reply in the conversation…</span>
      </div>
    </div>
  );
}
