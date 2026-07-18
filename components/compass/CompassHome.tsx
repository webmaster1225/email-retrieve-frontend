"use client";

import {
  ACCOUNTS,
  ACTIVE_CAMPAIGNS,
  OBJECTIVE_CHIPS,
  NORTHWYN_OBJECTIVE,
} from "@/lib/compass/northwynScenario";
import type { AccountId } from "@/lib/compass/northwynScenario";
import { AccountCard } from "./AccountCard";

type Props = {
  objective: string;
  onObjectiveChange: (v: string) => void;
  includedAccounts: Record<AccountId, boolean>;
  onToggleAccount: (id: AccountId) => void;
  onStart: (objective: string) => void;
  onStub?: (label: string) => void;
};

export function CompassHome({
  objective,
  onObjectiveChange,
  includedAccounts,
  onToggleAccount,
  onStart,
  onStub,
}: Props) {
  const submit = () => {
    onStart(objective.trim() || NORTHWYN_OBJECTIVE);
  };

  return (
    <div className="compass-home">
      <h1 className="compass-home-title">
        What would you like to accomplish through your relationships?
      </h1>

      <div className="compass-objective-row">
        <textarea
          className="compass-objective-input"
          rows={3}
          placeholder="e.g. Help with Northwyn's capital raise"
          value={objective}
          onChange={(e) => onObjectiveChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button type="button" className="compass-mic" disabled title="Voice — coming later">
          🎤
        </button>
      </div>

      <div className="compass-chips">
        {OBJECTIVE_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            className="compass-chip"
            onClick={() => {
              const text =
                chip === "Fundraising help" ? NORTHWYN_OBJECTIVE : chip;
              onObjectiveChange(text);
              onStart(text);
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      <button type="button" className="button primary compass-start-btn" onClick={submit}>
        Continue
      </button>

      <section className="compass-section">
        <h2 className="compass-section-label">Where should I look?</h2>
        <div className="compass-account-grid">
          {ACCOUNTS.map((acct) => (
            <AccountCard
              key={acct.id}
              account={acct}
              included={includedAccounts[acct.id]}
              onToggle={() => onToggleAccount(acct.id)}
              onDetails={() => onStub?.(`${acct.name} details`)}
            />
          ))}
        </div>
      </section>

      <section className="compass-section">
        <h2 className="compass-section-label">Active campaigns</h2>
        <ul className="compass-campaign-list">
          {ACTIVE_CAMPAIGNS.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="compass-campaign-item"
                onClick={() => onStub?.(c.title)}
              >
                <span className="compass-campaign-arrow">▸</span>
                <span>
                  <strong>{c.title}</strong>
                  <span className="compass-muted"> — {c.status}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <p className="compass-footer-note">
        🔒 Connected: 4 accounts · data stays in your tenant ·{" "}
        <button type="button" className="compass-text-link" onClick={() => onStub?.("Audit")}>
          Audit
        </button>
      </p>
    </div>
  );
}
