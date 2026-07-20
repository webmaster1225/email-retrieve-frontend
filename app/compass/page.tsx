"use client";

import { useCompassLive } from "@/lib/compass/useCompassLive";
import { CompassHome } from "@/components/compass/CompassHome";
import { CampaignWorkspace } from "@/components/compass/CampaignWorkspace";
import { CompassNav } from "@/components/compass/CompassNav";
import { Nav } from "@/components/Nav";
import { isWorkspaceStage } from "@/lib/compass/stages";

const LIVE_ENABLED =
  process.env.NEXT_PUBLIC_COMPASS_LIVE === "true" ||
  process.env.NEXT_PUBLIC_COMPASS_LIVE === "1";

export default function CompassPage() {
  if (!LIVE_ENABLED) {
    return (
      <div className="page">
        <div className="topbar">
          <div>
            <h1>Compass</h1>
            <p className="subtitle">Compass is disabled</p>
          </div>
          <Nav />
        </div>
        <div className="panel">
          <p>
            Set <code>NEXT_PUBLIC_COMPASS_LIVE=true</code> in <code>frontend/.env</code>, connect
            mailboxes in Settings, and restart the Next.js dev server.
          </p>
          <p>
            <a href="/">Back to Contacts</a>
          </p>
        </div>
      </div>
    );
  }

  return <CompassApp />;
}

function CompassApp() {
  const compass = useCompassLive();

  return (
    <div className="compass-page">
      <CompassNav
        showLegacyLink
        onStub={(label) => compass.showToast(`${label} — coming in a later phase`)}
        onCampaigns={() => compass.openCampaignsList()}
      />
      {compass.toast ? <div className="compass-toast">{compass.toast}</div> : null}
      <p className="compass-live-banner subtitle" style={{ padding: "0 1.25rem", margin: 0 }}>
        Live campaigns — candidates, drafts, and sends come from your synced mailboxes.
      </p>

      {compass.stage === "home" ? (
        <CompassHome
          objective={compass.objective}
          onObjectiveChange={compass.setObjective}
          includedAccounts={compass.includedAccounts}
          onToggleAccount={compass.toggleAccount}
          onStart={compass.startCampaign}
          onStub={(label) => compass.showToast(`${label} — coming in a later phase`)}
          onLiveAccountsLoaded={compass.applyLiveAccountDefaults}
          onOpenCampaign={(id) => compass.openCampaignFromList(id)}
        />
      ) : isWorkspaceStage(compass.stage) ? (
        <CampaignWorkspace compass={compass} />
      ) : null}
    </div>
  );
}
