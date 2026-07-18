"use client";

import { CANDIDATES } from "@/lib/compass/northwynScenario";

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
  onResolvePriya: (action: "linkedin" | "drop") => void;
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
  onResolvePriya,
}: Props) {
  const included = CANDIDATES.filter((c) => approvedIds.includes(c.id));
  const priya = included.find((c) => c.missingEmail);
  const recent = included.filter((c) => c.recentContact);
  const callBetter = included.filter((c) => c.callBetter);
  const sendNames = included
    .filter((c) => c.email && !c.missingEmail)
    .map((c) => c.name);

  return (
    <div className="compass-work-block">
      <h2 className="compass-work-title">Northwyn fundraising — final review</h2>
      <p>{roleSummary}</p>
      <p className="compass-muted">
        Searched: {searched} · Sending: &lt;{sendingAccount}&gt;
        <br />
        Research: Standard · External facts used: {usedFacts} (all approved)
      </p>

      <div className="compass-attention">
        <h3>⚠ Needs attention</h3>
        <ul>
          {priya ? (
            <li>
              1 missing email address ({priya.name.split(" ")[0]} S.) — resolve or drop{" "}
              <button
                type="button"
                className="compass-text-link"
                onClick={() => onResolvePriya("linkedin")}
              >
                Use LinkedIn
              </button>{" "}
              ·{" "}
              <button
                type="button"
                className="compass-text-link"
                onClick={() => onResolvePriya("drop")}
              >
                Drop
              </button>
            </li>
          ) : null}
          {recent.length > 0 ? (
            <li>
              {recent.length} contact{recent.length > 1 ? "s" : ""} messaged within 30 days (
              {recent.map((c) => c.name.split(" ")[0]).join(", ")}) — include anyway?
            </li>
          ) : null}
          {callBetter.length > 0 ? (
            <li>
              {callBetter.length} flagged better for a personal call (
              {callBetter.map((c) => c.name.split(" ")[0]).join(", ")})
            </li>
          ) : null}
        </ul>
      </div>

      {sendConfirmOpen ? (
        <div className="compass-send-confirm">
          <p>
            Sending <strong>{sendableCount}</strong> messages now from &lt;{sendingAccount}&gt; to:{" "}
            {sendNames.join(", ")}.
          </p>
          <p>Type or click <strong>Send</strong> to authorize — this is the step that actually emails people.</p>
          <div className="compass-work-actions">
            <button type="button" className="button primary danger-ish" onClick={onAuthorizeSend}>
              Send
            </button>
            <button type="button" className="button secondary" onClick={onCancelSend}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="compass-work-actions">
          <button type="button" className="button primary" onClick={onSave}>
            Save {included.filter((c) => c.email).length} drafts to Outlook
          </button>
          <button type="button" className="button" onClick={onSchedule}>
            Schedule…
          </button>
          <button type="button" className="button" onClick={onSend}>
            Send…
          </button>
          <button type="button" className="button secondary" onClick={onCancelCampaign}>
            Cancel campaign
          </button>
        </div>
      )}
      <p className="compass-muted">Send always asks again with the recipient list.</p>
    </div>
  );
}
