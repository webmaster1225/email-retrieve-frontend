"use client";

import type { AccountFixture } from "@/lib/compass/northwynScenario";

type Props = {
  account: AccountFixture;
  included: boolean;
  onToggle: () => void;
  onDetails?: () => void;
};

export function AccountCard({ account, included, onToggle, onDetails }: Props) {
  return (
    <div
      className={`compass-account-card${included ? " is-included" : ""}${
        account.recruiting ? " is-recruiting" : ""
      }`}
    >
      <div className="compass-account-top">
        <span className="compass-account-status">
          {included ? "✓" : "○"} {account.name} ·{" "}
          <span className={included ? "compass-dot-on" : "compass-dot-off"}>
            {account.recruiting && !included
              ? "recruiting mailbox - off by default"
              : included
                ? `Connected · up to date ${account.synced.replace("today ", "")}`
                : "Connected"}
          </span>
        </span>
      </div>
      <div className="compass-account-email">&lt;{account.email}&gt;</div>
      <p className="compass-account-blurb">{account.blurb}</p>
      <p className="compass-muted compass-account-synced">Synced: {account.synced}</p>
      <div className="compass-account-actions">
        <button type="button" className="button small" onClick={onToggle}>
          {included ? "Include in this search ✓" : "Include in this search"}
        </button>
        <button type="button" className="button small secondary" onClick={onDetails}>
          Details
        </button>
      </div>
    </div>
  );
}
