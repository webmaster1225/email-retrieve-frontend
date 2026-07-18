"use client";

import {
  CANDIDATES,
  DRAFTS,
  type DraftStatus,
} from "@/lib/compass/northwynScenario";

type Props = {
  personId: string;
  body: string;
  status: DraftStatus;
  editing: boolean;
  sendingAccount: string;
  onApprove: () => void;
  onEditToggle: () => void;
  onBodyChange: (body: string) => void;
  onTone: (mode: "shorter" | "warmer" | "direct") => void;
  onApplyAll: (mode: "shorter" | "warmer" | "direct") => void;
  onStub?: (label: string) => void;
};

export function DraftCard({
  personId,
  body,
  status,
  editing,
  sendingAccount,
  onApprove,
  onEditToggle,
  onBodyChange,
  onTone,
  onApplyAll,
  onStub,
}: Props) {
  const person = CANDIDATES.find((c) => c.id === personId);
  const draft = DRAFTS.find((d) => d.personId === personId);
  if (!person || !draft) return null;

  return (
    <article className={`compass-draft-card${status !== "pending" ? " is-approved" : ""}`}>
      <header>
        <p>
          To: <strong>{person.name}</strong> · {person.likelyRole} · from &lt;
          {sendingAccount}&gt;
        </p>
        <p>
          Subject: <strong>{draft.subject}</strong>
          {status !== "pending" ? (
            <span className="compass-ok"> · {status === "edited" ? "Edited" : "Approved"}</span>
          ) : null}
        </p>
      </header>

      {editing ? (
        <textarea
          className="compass-draft-editor"
          rows={10}
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
        />
      ) : (
        <pre className="compass-draft-body">{body}</pre>
      )}

      <div className="compass-draft-meta">
        <div>
          <span className="compass-plan-key">Personalization</span>{" "}
          {draft.personalization.map((p, i) => (
            <span key={i} className="compass-prov">
              {p.kind === "private" ? "🔒" : "🌐"} {p.label}
              {p.href ? (
                <a href={p.href} target="_blank" rel="noreferrer">
                  {" "}
                  ↗
                </a>
              ) : null}
              {i < draft.personalization.length - 1 ? " · " : ""}
            </span>
          ))}
        </div>
        <div>
          <span className="compass-plan-key">Ask</span> {draft.ask}
        </div>
      </div>

      <div className="compass-card-actions">
        <button type="button" className="button small primary" onClick={onApprove}>
          Approve
        </button>
        <button type="button" className="button small" onClick={onEditToggle}>
          {editing ? "Done editing" : "Edit"}
        </button>
        <button
          type="button"
          className="button small secondary"
          onClick={() => onStub?.("Regenerate")}
        >
          Regenerate
        </button>
        <button type="button" className="button small" onClick={() => onTone("shorter")}>
          Shorter
        </button>
        <button type="button" className="button small" onClick={() => onTone("warmer")}>
          Warmer
        </button>
        <button type="button" className="button small" onClick={() => onTone("direct")}>
          More direct
        </button>
        <button
          type="button"
          className="button small secondary"
          onClick={() => onStub?.("Change ask")}
        >
          Change ask
        </button>
        <button
          type="button"
          className="button small secondary"
          onClick={() => onStub?.("Remove public refs")}
        >
          Remove public refs
        </button>
        <button
          type="button"
          className="button small secondary"
          onClick={() => onStub?.("Call script")}
        >
          → Call script
        </button>
        <button
          type="button"
          className="button small secondary"
          onClick={() => onStub?.("LinkedIn")}
        >
          → LinkedIn
        </button>
      </div>
      <p className="compass-muted compass-apply-all">
        Apply this change to:{" "}
        <button type="button" className="compass-text-link" onClick={() => onTone("shorter")}>
          this draft
        </button>{" "}
        |{" "}
        <button type="button" className="compass-text-link" onClick={() => onApplyAll("shorter")}>
          all drafts (shorter)
        </button>{" "}
        |{" "}
        <button type="button" className="compass-text-link" onClick={() => onApplyAll("warmer")}>
          all drafts (warmer)
        </button>
      </p>
    </article>
  );
}
