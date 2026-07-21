"use client";

import type { CampaignCandidateView } from "@/lib/compass/types";

type Props = {
  roleSummary: string;
  searched: string;
  sendingAccount: string;
  usedFacts: number;
  researchMode?: string | null;
  approvedIds: string[];
  sendableCount: number;
  sendConfirmOpen: boolean;
  onSave: () => void;
  onSchedule: () => void;
  onSend: () => void;
  onAuthorizeSend: () => void;
  onCancelSend: () => void;
  onCancelCampaign: () => void;
  onDropMissingEmail: () => void;
  candidates: CampaignCandidateView[];
  sendPreviewNames?: string[];
  preflightAttention?: {
    missing_email: Array<{ id: string; name: string }>;
    recently_messaged: Array<{ id: string; name: string }>;
    call_better: Array<{ id: string; name: string }>;
    needs_review: Array<{ id: string; name: string }>;
    duplicates: Array<{ id: string; name: string }>;
  } | null;
};

export function FinalReview({
  roleSummary,
  searched,
  sendingAccount,
  usedFacts,
  researchMode,
  approvedIds,
  sendableCount,
  sendConfirmOpen,
  onSave,
  onSchedule,
  onSend,
  onAuthorizeSend,
  onCancelSend,
  onCancelCampaign,
  onDropMissingEmail,
  candidates,
  sendPreviewNames,
  preflightAttention,
}: Props) {
  const included = candidates.filter((c) => approvedIds.includes(c.id));
  const missingEmail =
    preflightAttention?.missing_email?.[0] ||
    included.find((c) => c.missingEmail);
  const recent =
    preflightAttention?.recently_messaged?.length
      ? preflightAttention.recently_messaged
      : included.filter((c) => c.recentContact);
  const callBetter =
    preflightAttention?.call_better?.length
      ? preflightAttention.call_better
      : included.filter((c) => c.callBetter);
  const needsReview = preflightAttention?.needs_review || [];
  const duplicates = preflightAttention?.duplicates || [];
  const sendNames =
    sendPreviewNames && sendPreviewNames.length > 0
      ? sendPreviewNames
      : included.filter((c) => c.email && !c.missingEmail).map((c) => c.name);

  return (
    <div className="compass-work-block">
      <h2 className="compass-work-title">Final review</h2>
      <p>{roleSummary}</p>
      <p className="compass-muted">
        Searched: {searched} · Sending: &lt;{sendingAccount}&gt;
        <br />
        Research: {researchMode || "—"} · External facts used: {usedFacts} (approved)
      </p>

      <div className="compass-attention">
        <h3>⚠ Needs attention</h3>
        <ul>
          {missingEmail ? (
            <li>
              Missing email ({"name" in missingEmail ? missingEmail.name : (missingEmail as { name: string }).name}) —{" "}
              <button type="button" className="compass-text-link" onClick={onDropMissingEmail}>
                Drop
              </button>
            </li>
          ) : null}
          {recent.length > 0 ? (
            <li>
              Recently contacted: {recent.map((c) => ("name" in c ? c.name : "")).join(", ")}
            </li>
          ) : null}
          {callBetter.length > 0 ? (
            <li>
              Call may land better: {callBetter.map((c) => ("name" in c ? c.name : "")).join(", ")}
            </li>
          ) : null}
          {needsReview.length > 0 ? (
            <li>
              Drafts needing review: {needsReview.map((c) => c.name).join(", ")}
            </li>
          ) : null}
          {duplicates.length > 0 ? (
            <li>Duplicates: {duplicates.map((c) => c.name).join(", ")}</li>
          ) : null}
          {!missingEmail &&
          recent.length === 0 &&
          callBetter.length === 0 &&
          needsReview.length === 0 &&
          duplicates.length === 0 ? (
            <li className="compass-muted">None</li>
          ) : null}
        </ul>
      </div>

      <div className="compass-work-actions sticky-actions">
        <button type="button" className="button" onClick={onSave}>
          Save drafts to mailbox
        </button>
        <button type="button" className="button" onClick={onSchedule}>
          Schedule
        </button>
        <button type="button" className="button primary" onClick={onSend}>
          Authorize send ({sendableCount})
        </button>
        <button type="button" className="button secondary" onClick={onCancelCampaign}>
          Cancel campaign
        </button>
      </div>

      {sendConfirmOpen ? (
        <div className="compass-send-confirm">
          <p>
            Sending {sendableCount} message(s) from &lt;{sendingAccount}&gt; to:{" "}
            <strong>{sendNames.join(", ") || "(none)"}</strong>. Click <strong>Send</strong> to
            authorize — this is the step that actually emails people.
          </p>
          <div className="compass-work-actions">
            <button type="button" className="button primary" onClick={onAuthorizeSend}>
              Send
            </button>
            <button type="button" className="button" onClick={onCancelSend}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
