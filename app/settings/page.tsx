"use client";

import { useCallback, useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { api, MailboxAccount } from "@/lib/api";

const ACCOUNTS_UI =
  process.env.NEXT_PUBLIC_ACCOUNTS_UI === "true" ||
  process.env.NEXT_PUBLIC_ACCOUNTS_UI === "1";

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<MailboxAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await api.listAccounts();
      setAccounts(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ACCOUNTS_UI) load();
    else setLoading(false);
  }, [load]);

  const connect = async (account: MailboxAccount) => {
    setBusyId(account.id);
    setMessage(null);
    try {
      // Edge: use the proven Contacts OAuth callback already registered in Azure
      if (account.id === "edge") {
        window.location.href = api.loginUrl();
        return;
      }
      // Galaxy / Careers / Northwyn: browser login for that mailbox
      const login = await api.accountLogin(account.id);
      if (login.login_url) {
        window.location.href = login.login_url;
        return;
      }
      setError(login.error || "Connect failed — check Azure/Google app registration");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connect failed");
    } finally {
      setBusyId(null);
    }
  };

  const disconnect = async (account: MailboxAccount) => {
    const ok = window.confirm(
      `Disconnect ${account.display_name}?\n\nSynced data for this mailbox stays until you delete it. Other mailboxes are unaffected.`,
    );
    if (!ok) return;
    setBusyId(account.id);
    try {
      const result = await api.disconnectAccount(account.id);
      setMessage(result.consequences);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Disconnect failed");
    } finally {
      setBusyId(null);
    }
  };

  const sync = async (account: MailboxAccount) => {
    setBusyId(account.id);
    setMessage(null);
    try {
      await api.syncAccount(account.id);
      setMessage(`Started sync for ${account.display_name}.`);
      for (let i = 0; i < 12; i++) {
        await new Promise((r) => setTimeout(r, 500));
        await load();
        const latest = (await api.listAccounts()).find((a) => a.id === account.id);
        if (latest && latest.status !== "syncing") break;
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setBusyId(null);
    }
  };

  if (!ACCOUNTS_UI) {
    return (
      <div className="page">
        <div className="topbar">
          <div>
            <h1>Settings</h1>
            <p className="subtitle">Multi-mailbox accounts</p>
          </div>
          <Nav />
        </div>
        <div className="panel">
          <p>
            Set <code>NEXT_PUBLIC_ACCOUNTS_UI=true</code> in <code>frontend/.env</code> and ensure
            backend <code>FEATURE_ACCOUNTS_UI=true</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <h1>Settings &amp; Data Sources</h1>
          <p className="subtitle">Account connections · sync freshness · permissions</p>
        </div>
        <Nav />
      </div>

      {error ? <div className="banner error">{error}</div> : null}
      {message ? <div className="banner success">{message}</div> : null}

      <section className="panel settings-accounts">
        <h2>Email accounts</h2>
        <p className="subtitle">
          Connect opens a Microsoft or Google sign-in page in your browser — enter that
          mailbox&apos;s email and password there. Careers is a recruiting mailbox (off by default).
        </p>
        <div className="banner settings-oauth-help">
          <strong>Galaxy / Careers:</strong> your Azure app is currently Edge-tenant only, which
          blocks other Microsoft orgs. In{" "}
          <a
            href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
            target="_blank"
            rel="noreferrer"
          >
            Azure Portal → App registrations
          </a>{" "}
          open this app → <em>Authentication</em> → Supported account types →{" "}
          <strong>Accounts in any organizational directory (Multitenant)</strong>, then add redirect
          URIs:
          <ul>
            <li>
              <code>http://localhost:8000/api/v1/accounts/galaxy/oauth/callback</code>
            </li>
            <li>
              <code>http://localhost:8000/api/v1/accounts/careers/oauth/callback</code>
            </li>
          </ul>
          Restart the backend after saving. Then Connect again and sign in as the Galaxy/Careers
          user.
        </div>

        {loading ? <p>Loading accounts…</p> : null}

        <div className="settings-account-list">
          {accounts.map((account) => (
            <article
              key={account.id}
              className={`settings-account-card${account.is_functional ? " is-functional" : ""}`}
            >
              <header>
                <h3>
                  {account.status === "connected" || account.status === "syncing" ? "✓" : "○"}{" "}
                  {account.display_name}
                  {account.is_functional ? (
                    <span className="settings-functional-badge">Functional</span>
                  ) : null}
                </h3>
                <p className="settings-email">&lt;{account.email}&gt;</p>
              </header>
              <p>{account.blurb}</p>
              <p className="settings-status-line">
                Status: <strong>{account.plain_message || account.status}</strong>
                {account.last_sync_plain ? (
                  <>
                    {" "}
                    · Synced: {account.last_sync_plain.replace("up to date ", "")}
                  </>
                ) : null}
              </p>
              <div className="settings-perms">
                {(["read_mail", "send", "calendar", "drafts"] as const).map((key) => (
                  <span
                    key={key}
                    className={`settings-perm${account.permissions?.[key] ? " on" : ""}`}
                  >
                    {key.replace("_", " ")}
                  </span>
                ))}
              </div>
              {account.partial_permissions ? (
                <p className="settings-warn">Can draft, can&apos;t send — reconnect after adding Mail.Send.</p>
              ) : null}
              <div className="settings-actions">
                {!account.connected || account.status === "reconnect_needed" ? (
                  <button
                    type="button"
                    className="button primary"
                    disabled={busyId === account.id}
                    onClick={() => connect(account)}
                  >
                    {account.status === "reconnect_needed" ? "Reconnect" : "Connect"}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="button"
                      disabled={busyId === account.id}
                      onClick={() => sync(account)}
                    >
                      Refresh now
                    </button>
                    <button
                      type="button"
                      className="button secondary"
                      disabled={busyId === account.id}
                      onClick={() => disconnect(account)}
                    >
                      Disconnect
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel settings-later">
        <h2>Later phases</h2>
        <ul className="settings-disabled-list">
          <li>Research defaults — coming later</li>
          <li>Privacy &amp; data deletion — coming later</li>
          <li>Exports — still on Contacts for now</li>
          <li>Audit log — coming later</li>
          <li>Diagnostics — coming later</li>
        </ul>
      </section>
    </div>
  );
}
