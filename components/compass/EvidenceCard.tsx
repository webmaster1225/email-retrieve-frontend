"use client";

import type { CandidateFixture, ContactDecision } from "@/lib/compass/northwynScenario";

type Props = {
  candidate: CandidateFixture;
  decision: ContactDecision;
  evidenceOpen: boolean;
  onDecision: (d: ContactDecision) => void;
  onToggleEvidence: () => void;
};

function StrengthDots({ n }: { n: number }) {
  return (
    <span className="compass-strength" aria-label={`Strength ${n} of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < n ? "is-on" : ""}>
          ●
        </span>
      ))}
    </span>
  );
}

export function EvidenceCard({
  candidate,
  decision,
  evidenceOpen,
  onDecision,
  onToggleEvidence,
}: Props) {
  return (
    <article
      className={`compass-evidence-card${
        decision === "include" ? " is-include" : ""
      }${decision === "pass" ? " is-pass" : ""}${decision === "unsure" ? " is-unsure" : ""}`}
    >
      <header className="compass-evidence-head">
        <div>
          <h3>
            {candidate.name} — {candidate.title}, {candidate.org}
          </h3>
          <p className="compass-muted">
            {candidate.email ? `<${candidate.email}>` : "No verified email"} ·{" "}
            {candidate.mailboxes}
          </p>
        </div>
        <div className="compass-evidence-meta">
          <span>
            Likely role <strong>{candidate.likelyRole}</strong>
          </span>
          <span>
            Confidence <strong>● {candidate.confidence}</strong>
          </span>
        </div>
      </header>

      <div className="compass-evidence-why">
        <span className="compass-plan-key">Why her</span>
        <p>{candidate.whyHer}</p>
      </div>

      <div className="compass-evidence-stats">
        <span>
          Strength <StrengthDots n={candidate.strength} />
        </span>
        <span>Last touch {candidate.lastTouch}</span>
        <span>Freq {candidate.freq}</span>
      </div>

      <button type="button" className="compass-text-link" onClick={onToggleEvidence}>
        {evidenceOpen ? "▾" : "▸"} Evidence ({candidate.evidence.length} items)
      </button>

      {evidenceOpen ? (
        <ul className="compass-evidence-list">
          {candidate.evidence.map((e, i) => (
            <li key={i}>
              <span className="compass-badge">{e.mailbox}</span> {e.date} · {e.direction} ·{" "}
              <em>{e.subject}</em> — {e.summary}{" "}
              <span className="compass-muted">Open in Outlook</span>
            </li>
          ))}
        </ul>
      ) : null}

      {candidate.warnings.length > 0 ? (
        <ul className="compass-warnings">
          {candidate.warnings.map((w) => (
            <li key={w}>⚠ {w}</li>
          ))}
        </ul>
      ) : (
        <p className="compass-muted">⚠ none</p>
      )}

      <div className="compass-card-actions">
        <button
          type="button"
          className={`button small${decision === "include" ? " primary" : ""}`}
          onClick={() => onDecision("include")}
        >
          ✓ Include
        </button>
        <button
          type="button"
          className={`button small${decision === "pass" ? " primary" : ""}`}
          onClick={() => onDecision("pass")}
        >
          ✕ Not this time
        </button>
        <button
          type="button"
          className={`button small${decision === "unsure" ? " primary" : ""}`}
          onClick={() => onDecision("unsure")}
        >
          ? Unsure
        </button>
        <button type="button" className="button small secondary" onClick={onToggleEvidence}>
          Why {candidate.name.split(" ")[0] === "Sarah" ? "her" : "them"}?
        </button>
      </div>
    </article>
  );
}
