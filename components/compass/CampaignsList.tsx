"use client";

type CampaignSummary = {
  id: string;
  title: string | null;
  status: string;
  objective_raw?: string;
  sent?: number;
  replied?: number;
  updated_at?: string | null;
};

type Props = {
  campaigns: CampaignSummary[];
  onOpen: (id: string) => void;
  onHome: () => void;
  busy?: boolean;
};

export function CampaignsList({ campaigns, onOpen, onHome, busy }: Props) {
  return (
    <div className="compass-work-block">
      <h2 className="compass-work-title">Campaigns</h2>
      <p className="compass-muted">Recent campaigns — open one to continue tracking.</p>
      <div className="compass-card-stack">
        {campaigns.length === 0 ? (
          <p className="compass-muted">No campaigns yet.</p>
        ) : (
          campaigns.map((c) => (
            <button
              key={c.id}
              type="button"
              className="compass-account-card"
              onClick={() => onOpen(c.id)}
              disabled={busy}
              style={{ textAlign: "left", width: "100%" }}
            >
              <strong>{c.title || c.objective_raw?.slice(0, 60) || c.id}</strong>
              <div className="compass-muted">
                {c.status}
                {typeof c.sent === "number" ? ` · ${c.sent} sent` : ""}
                {typeof c.replied === "number" ? ` · ${c.replied} replied` : ""}
              </div>
            </button>
          ))
        )}
      </div>
      <div className="compass-work-actions">
        <button type="button" className="button primary" onClick={onHome}>
          New objective
        </button>
      </div>
    </div>
  );
}
