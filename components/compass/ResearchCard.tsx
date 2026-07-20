"use client";

import type { FactDecision, ResearchItemView } from "@/lib/compass/types";

type Props = {
  research: ResearchItemView;
  decision: FactDecision;
  onDecision: (d: FactDecision) => void;
  onDigDeeper?: () => void;
  personName: string;
};

export function ResearchCard({
  research,
  decision,
  onDecision,
  onDigDeeper,
  personName,
}: Props) {
  return (
    <article className={`compass-research-card${decision ? ` is-${decision}` : ""}`}>
      <header>
        <h3>
          {personName} — external context{" "}
          <span className={research.identityConfirmed ? "compass-ok" : "compass-warn"}>
            Identity {research.identityConfirmed ? "✓ Confirmed" : "○ Unconfirmed"}
          </span>
        </h3>
        <p className="compass-muted">({research.identityNote})</p>
      </header>

      {research.facts.length > 0 ? (
        <div>
          <div className="compass-section-label">Recent &amp; relevant</div>
          <ul className="compass-fact-list">
            {research.facts.map((f) => (
              <li key={f.claim}>
                <strong>• {f.claim}</strong>
                <div className="compass-muted">source: {f.source}</div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="compass-muted">No public facts attributed.</p>
      )}

      {research.specialMessage ? (
        <p className="compass-warn">{research.specialMessage}</p>
      ) : null}

      <p>
        <span className="compass-plan-key">Recommended use</span> {research.recommendedUse}
      </p>

      <div className="compass-card-actions">
        <button
          type="button"
          className={`button small${decision === "use" ? " primary" : ""}`}
          onClick={() => onDecision("use")}
          disabled={!research.identityConfirmed || research.facts.length === 0}
        >
          Use it
        </button>
        <button
          type="button"
          className={`button small${decision === "background" ? " primary" : ""}`}
          onClick={() => onDecision("background")}
        >
          Background only
        </button>
        <button
          type="button"
          className={`button small${decision === "dont_use" ? " primary" : ""}`}
          onClick={() => onDecision("dont_use")}
        >
          Don&apos;t use
        </button>
        <button type="button" className="button small secondary" onClick={onDigDeeper}>
          Dig deeper
        </button>
      </div>
    </article>
  );
}
