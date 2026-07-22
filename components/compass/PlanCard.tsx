"use client";

import { useEffect, useState } from "react";
import type { PlanView } from "@/lib/compass/types";

type Props = {
  onApprove: () => void;
  onCandidateLimitChange?: (limit: number) => void;
  plan: PlanView | null;
  busy?: boolean;
};

export function PlanCard({ onApprove, onCandidateLimitChange, plan, busy }: Props) {
  const [limitDraft, setLimitDraft] = useState<string>("5");

  useEffect(() => {
    if (plan?.candidateLimit != null) {
      setLimitDraft(String(plan.candidateLimit));
    }
  }, [plan?.candidateLimit]);

  if (!plan) {
    return (
      <div className="compass-work-block">
        <h2 className="compass-work-title">Search plan</h2>
        <p className="compass-muted">Loading plan from campaign…</p>
      </div>
    );
  }

  const commitLimit = () => {
    if (!onCandidateLimitChange) return;
    const n = Number.parseInt(limitDraft, 10);
    if (!Number.isFinite(n)) {
      setLimitDraft(String(plan.candidateLimit));
      return;
    }
    const clamped = Math.max(5, Math.min(100, n));
    setLimitDraft(String(clamped));
    if (clamped !== plan.candidateLimit) {
      onCandidateLimitChange(clamped);
    }
  };

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
          <span className="compass-plan-key">Top candidates</span>
          <span className="compass-plan-limit">
            <input
              type="number"
              min={5}
              max={100}
              step={1}
              className="compass-plan-limit-input"
              value={limitDraft}
              disabled={busy || !onCandidateLimitChange}
              aria-label="Number of top-ranked candidates to surface"
              onChange={(e) => setLimitDraft(e.target.value)}
              onBlur={commitLimit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                }
              }}
            />
            <span className="compass-muted"> people (5–100)</span>
          </span>
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
