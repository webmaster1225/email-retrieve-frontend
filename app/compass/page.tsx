"use client";

import { useMemo } from "react";
import { Nav } from "@/components/Nav";
import { CompassNav } from "@/components/compass/CompassNav";
import { CompassHome } from "@/components/compass/CompassHome";
import { CampaignWorkspace } from "@/components/compass/CampaignWorkspace";
import { useCompassPrototype } from "@/lib/compass/useCompassPrototype";
import { isWorkspaceStage } from "@/lib/compass/stages";

const PROTOTYPE_ENABLED =
  process.env.NEXT_PUBLIC_COMPASS_PROTOTYPE === "true" ||
  process.env.NEXT_PUBLIC_COMPASS_PROTOTYPE === "1";

export default function CompassPage() {
  const proto = useCompassPrototype();

  const enabled = useMemo(() => PROTOTYPE_ENABLED, []);

  if (!enabled) {
    return (
      <div className="page">
        <div className="topbar">
          <div>
            <h1>Compass prototype</h1>
            <p className="subtitle">Phase 1 UX prototype is disabled</p>
          </div>
          <Nav />
        </div>
        <div className="panel">
          <p>
            Set <code>NEXT_PUBLIC_COMPASS_PROTOTYPE=true</code> in{" "}
            <code>frontend/.env</code> and restart the Next.js dev server to enable the
            Northwyn walkthrough.
          </p>
          <p>
            <a href="/">Back to Contacts</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="compass-page">
      <CompassNav
        showLegacyLink
        onStub={(label) => proto.showToast(`${label} — coming in a later phase`)}
      />
      {proto.toast ? <div className="compass-toast">{proto.toast}</div> : null}

      {proto.stage === "home" ? (
        <CompassHome
          objective={proto.objective}
          onObjectiveChange={proto.setObjective}
          includedAccounts={proto.includedAccounts}
          onToggleAccount={proto.toggleAccount}
          onStart={proto.startCampaign}
          onStub={(label) => proto.showToast(`${label} — coming in a later phase`)}
        />
      ) : isWorkspaceStage(proto.stage) ? (
        <CampaignWorkspace proto={proto} />
      ) : null}
    </div>
  );
}
