"use client";

import type { DraftStatus } from "@/lib/compass/types";

type PersonalizationChip = {
  kind: "private" | "public";
  label: string;
  href?: string;
};

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
  onRegenerate?: () => void;
  onChangeAsk?: () => void;
  onRemovePublicRefs?: () => void;
  onCallScript?: () => void;
  onLinkedIn?: () => void;
  personName: string;
  roleLabel?: string;
  subject: string;
  ask?: string;
  email?: string;
  personalization?: PersonalizationChip[];
  warnings?: string[];
};

export function DraftCard({
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
  onRegenerate,
  onChangeAsk,
  onRemovePublicRefs,
  onCallScript,
  onLinkedIn,
  personName,
  roleLabel,
  subject,
  ask,
  email,
  personalization,
  warnings,
}: Props) {
  const role = roleLabel || "";
  const askText = ask ?? "";
  const chips = personalization ?? [];

  return (
    <article className={`compass-draft-card${status !== "pending" ? " is-approved" : ""}`}>
      <header>
        <p>
          To: <strong>{personName}</strong>
          {email ? <> &lt;{email}&gt;</> : null}
          {role ? <> · {role}</> : null} · from &lt;{sendingAccount}&gt;
        </p>
        <p>
          Subject: <strong>{subject}</strong>
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

      {warnings && warnings.length > 0 ? (
        <p className="compass-warn">{warnings.join(" · ")}</p>
      ) : null}

      <div className="compass-draft-meta">
        <div>
          <span className="compass-plan-key">Personalization</span>{" "}
          {chips.length === 0 ? (
            <span className="compass-muted">Relationship history</span>
          ) : (
            chips.map((p, i) => (
              <span key={i} className="compass-prov">
                {p.kind === "private" ? "🔒" : "🌐"} {p.label}
                {p.href ? (
                  <a href={p.href} target="_blank" rel="noreferrer">
                    {" "}
                    ↗
                  </a>
                ) : null}
                {i < chips.length - 1 ? " · " : ""}
              </span>
            ))
          )}
        </div>
        <div>
          <span className="compass-plan-key">Ask</span> {askText}
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
          onClick={() => (onRegenerate ? onRegenerate() : onStub?.("Regenerate"))}
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
          onClick={() => (onChangeAsk ? onChangeAsk() : onStub?.("Change ask"))}
        >
          Change ask
        </button>
        <button
          type="button"
          className="button small secondary"
          onClick={() =>
            onRemovePublicRefs ? onRemovePublicRefs() : onStub?.("Remove public refs")
          }
        >
          Remove public refs
        </button>
        <button
          type="button"
          className="button small secondary"
          onClick={() => (onCallScript ? onCallScript() : onStub?.("Call script"))}
        >
          → Call script
        </button>
        <button
          type="button"
          className="button small secondary"
          onClick={() => (onLinkedIn ? onLinkedIn() : onStub?.("LinkedIn"))}
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
