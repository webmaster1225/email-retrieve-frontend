"use client";

import type { AccountView } from "@/lib/compass/types";

type Props = {
  account: AccountView;
  included: boolean;
  onToggle: () => void;
  onDetails?: () => void;
  liveStatus?: string;
  connected?: boolean;
  compact?: boolean;
};

export function AccountCard({
  account,
  included,
  onToggle,
  onDetails,
  liveStatus,
  connected,
  compact = false,
}: Props) {
  const statusLine = liveStatus
    ? liveStatus
    : account.recruiting && !included
      ? "Recruiting — off by default"
      : included
        ? `Included · ${account.synced}`
        : connected === false
          ? "Not connected"
          : "Connected";

  if (compact) {
    return (
      <div
        className={`compass-account-card compass-account-card--compact${
          included ? " is-included" : ""
        }${account.recruiting ? " is-recruiting" : ""}${
          connected === false ? " is-offline" : ""
        }`}
      >
        <div className="compass-account-compact-main">
          <span
            className={`compass-account-indicator${included ? " is-on" : ""}`}
            aria-hidden
          />
          <div className="compass-account-compact-text">
            <strong className="compass-account-name">{account.name}</strong>
            <span className="compass-account-email">&lt;{account.email}&gt;</span>
            <span
              className={`compass-account-synced${
                connected === false ? " compass-warn" : ""
              }`}
            >
              {statusLine}
            </span>
          </div>
        </div>
        <button
          type="button"
          className={`button small${included ? " primary" : ""}`}
          onClick={onToggle}
          disabled={connected === false}
        >
          {included ? "Included" : "Include"}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`compass-account-card${included ? " is-included" : ""}${
        account.recruiting ? " is-recruiting" : ""
      }`}
    >
      <div className="compass-account-top">
        <span className="compass-account-status">
          {included ? "✓" : "○"} {account.name} ·{" "}
          <span className={included || connected ? "compass-dot-on" : "compass-dot-off"}>
            {statusLine}
          </span>
        </span>
      </div>
      <div className="compass-account-email">&lt;{account.email}&gt;</div>
      <p className="compass-account-blurb">{account.blurb}</p>
      <p className="compass-muted compass-account-synced">
        {liveStatus ? `Status: ${liveStatus}` : `Synced: ${account.synced}`}
      </p>
      {account.recruiting ? (
        <p className="compass-muted">Recruiting mailbox — functional, off by default</p>
      ) : null}
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
