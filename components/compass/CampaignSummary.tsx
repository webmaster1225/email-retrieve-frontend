"use client";

type Props = {
  objective: string;
  mailboxes: string;
  found: number;
  approved: number;
  researched: number;
  drafted: number;
  sendingAccount: string | null;
  nextDecision: string;
  open: boolean;
  onToggle: () => void;
};

export function CampaignSummary({
  objective,
  mailboxes,
  found,
  approved,
  researched,
  drafted,
  sendingAccount,
  nextDecision,
  open,
  onToggle,
}: Props) {
  return (
    <aside className={`compass-summary${open ? "" : " is-collapsed"}`}>
      <div className="compass-summary-head">
        <h2 className="compass-pane-title">Campaign</h2>
        <button type="button" className="compass-link-btn" onClick={onToggle}>
          {open ? "Collapse" : "Expand"}
        </button>
      </div>
      {open ? (
        <div className="compass-summary-body">
          <dl className="compass-summary-dl">
            <dt>Objective</dt>
            <dd>{objective || "—"}</dd>
            <dt>Mailboxes</dt>
            <dd>{mailboxes || "—"}</dd>
            <dt>Criteria</dt>
            <dd>Strength first, then fundraising relevance · 5 years</dd>
            <dt>Counts</dt>
            <dd>
              {found} found · {approved} approved · {researched} researched · {drafted}{" "}
              drafted
            </dd>
            <dt>Sending</dt>
            <dd>{sendingAccount ? `<${sendingAccount}>` : "Not confirmed"}</dd>
          </dl>
          <div className="compass-summary-next">
            <div className="compass-section-label">Next decision</div>
            <p>{nextDecision}</p>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
