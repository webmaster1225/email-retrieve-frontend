"use client";

type ContactRow = {
  candidate_id: string;
  name: string | null;
  email: string | null;
  tracking_status: string;
  company?: string | null;
};

type ReplyRow = {
  id: string;
  candidate_id: string;
  excerpt: string | null;
  matched_by: string | null;
  matched_at: string | null;
};

type CommitmentRow = {
  id: string;
  candidate_id: string;
  owner: string;
  text: string;
  due_hint: string | null;
  status: string;
};

type FollowUpRow = {
  id: string;
  candidate_id: string;
  kind: string;
  subject: string | null;
  body: string;
  status: string;
};

type Props = {
  title?: string | null;
  counts: Record<string, number>;
  contacts: ContactRow[];
  replies: ReplyRow[];
  commitments: CommitmentRow[];
  suggestions: string[];
  followUps: FollowUpRow[];
  personNameFor: (id: string) => string;
  sendingAccount?: string | null;
  onRefresh: () => void;
  onProposeFollowUps: () => void;
  onApproveFollowUp: (id: string) => void;
  onRejectFollowUp: (id: string) => void;
  onSendFollowUp: (id: string, email: string) => void;
  gate9ConfirmId: string | null;
  onOpenGate9: (id: string) => void;
  onCancelGate9: () => void;
  busy?: boolean;
};

export function TrackingDashboard({
  title,
  counts,
  contacts,
  replies,
  commitments,
  suggestions,
  followUps,
  personNameFor,
  sendingAccount,
  onRefresh,
  onProposeFollowUps,
  onApproveFollowUp,
  onRejectFollowUp,
  onSendFollowUp,
  gate9ConfirmId,
  onOpenGate9,
  onCancelGate9,
  busy,
}: Props) {
  const strip = [
    ["sent", counts.sent || 0],
    ["replied", counts.replied || 0],
    ["intros", counts.intro_offered || 0],
    ["meetings", counts.meeting_booked || 0],
    ["declined", counts.declined || 0],
    ["no response", counts.no_response || 0],
  ];

  const gate9 = followUps.find((f) => f.id === gate9ConfirmId);
  const gate9Email =
    gate9 && contacts.find((c) => c.candidate_id === gate9.candidate_id)?.email;

  return (
    <div className="compass-work-block">
      <h2 className="compass-work-title">{title || "Campaign tracking"}</h2>
      <p className="compass-muted">
        {strip.map(([k, v]) => `${v} ${k}`).join(" · ")}
        {sendingAccount ? ` · Sending: <${sendingAccount}>` : ""}
      </p>

      <div className="compass-work-actions">
        <button type="button" className="button" onClick={onRefresh} disabled={busy}>
          Refresh replies
        </button>
        <button type="button" className="button primary" onClick={onProposeFollowUps} disabled={busy}>
          Propose follow-ups
        </button>
      </div>

      {suggestions.length > 0 ? (
        <div className="compass-attention" style={{ marginTop: "1rem" }}>
          <h3>Agent suggests</h3>
          <ul>
            {suggestions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <h3 className="compass-section-label" style={{ marginTop: "1.25rem" }}>
        Per-contact status
      </h3>
      <div className="compass-card-stack">
        {contacts.map((c) => (
          <article key={c.candidate_id} className="compass-research-card">
            <header>
              <h3>
                {c.name || c.email}{" "}
                <span className="compass-muted">· {c.tracking_status}</span>
              </h3>
            </header>
            {replies
              .filter((r) => r.candidate_id === c.candidate_id)
              .slice(0, 2)
              .map((r) => (
                <p key={r.id} className="compass-muted">
                  Reply: {r.excerpt}
                </p>
              ))}
          </article>
        ))}
      </div>

      {commitments.filter((c) => c.status === "open").length > 0 ? (
        <>
          <h3 className="compass-section-label" style={{ marginTop: "1.25rem" }}>
            Commitments
          </h3>
          <ul>
            {commitments
              .filter((c) => c.status === "open")
              .map((c) => (
                <li key={c.id}>
                  <strong>{personNameFor(c.candidate_id)}</strong> ({c.owner}): {c.text}
                  {c.due_hint ? ` — ${c.due_hint}` : ""}
                </li>
              ))}
          </ul>
        </>
      ) : null}

      {followUps.length > 0 ? (
        <>
          <h3 className="compass-section-label" style={{ marginTop: "1.25rem" }}>
            Follow-ups (Gate 9)
          </h3>
          <div className="compass-card-stack">
            {followUps.map((f) => (
              <article key={f.id} className="compass-draft-card">
                <header>
                  <p>
                    {personNameFor(f.candidate_id)} · {f.kind} · <em>{f.status}</em>
                  </p>
                  <p>
                    Subject: <strong>{f.subject}</strong>
                  </p>
                </header>
                <pre className="compass-draft-body">{f.body}</pre>
                <div className="compass-card-actions">
                  {f.status === "proposed" ? (
                    <>
                      <button
                        type="button"
                        className="button small primary"
                        onClick={() => onApproveFollowUp(f.id)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="button small"
                        onClick={() => onRejectFollowUp(f.id)}
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                  {(f.status === "proposed" || f.status === "approved") &&
                  f.kind !== "intro_task" ? (
                    <button
                      type="button"
                      className="button small primary"
                      onClick={() => onOpenGate9(f.id)}
                    >
                      Authorize send
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </>
      ) : null}

      {gate9 && gate9Email ? (
        <div className="compass-send-confirm">
          <p>
            Gate 9: send follow-up from &lt;{sendingAccount || "confirmed account"}&gt; to{" "}
            <strong>
              {personNameFor(gate9.candidate_id)} &lt;{gate9Email}&gt;
            </strong>
            ? This is separate from draft approval.
          </p>
          <div className="compass-work-actions">
            <button
              type="button"
              className="button primary"
              onClick={() => onSendFollowUp(gate9.id, gate9Email)}
            >
              Send
            </button>
            <button type="button" className="button" onClick={onCancelGate9}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
