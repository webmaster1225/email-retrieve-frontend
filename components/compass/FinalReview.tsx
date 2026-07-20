"use client";

import type { CampaignCandidateView } from "@/lib/compass/types";

type Props = {
  roleSummary: string;
  searched: string;
  sendingAccount: string;
  usedFacts: number;
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
};

export function FinalReview({
  roleSummary,
  searched,
  sendingAccount,
  usedFacts,
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
}: Props) {
  const included = candidates.filter((c) => approvedIds.includes(c.id));
  const missingEmail = included.find((c) => c.missingEmail);
  const recent = included.filter((c) => c.recentContact);
  const callBetter = included.filter((c) => c.callBetter);
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
        External facts used: {usedFacts} (approved)
      </p>

      <div className="compass-attention">
        <h3>⚠ Needs attention</h3>
        <ul>
          {missingEmail ? (
            <li>
              Missing email ({missingEmail.name}) —{" "}
              <button type="button" className="compass-text-link" onClick={onDropMissingEmail}>
                Drop
              </button>
            </li>
          ) : null}
          {recent.length > 0 ? (
            <li>Recently contacted: {recent.map((c) => c.name).join(", ")}</li>
          ) : null}
          {callBetter.length > 0 ? (
            <li>Call may land better: {callBetter.map((c) => c.name).join(", ")}</li>
          ) : null}
          {!missingEmail && recent.length === 0 && callBetter.length === 0 ? (
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
