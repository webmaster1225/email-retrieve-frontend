"use client";

type Props = {
  onStub?: (label: string) => void;
  showLegacyLink?: boolean;
};

export function CompassNav({ onStub, showLegacyLink }: Props) {
  return (
    <header className="compass-header">
      <div className="compass-header-brand">
        <span className="compass-logo">Compass</span>
        <span className="compass-tagline">your relationship agent</span>
      </div>
      <div className="compass-header-actions">
        <button
          type="button"
          className="compass-link-btn"
          onClick={() => onStub?.("Campaigns")}
        >
          Campaigns
        </button>
        <button
          type="button"
          className="compass-link-btn"
          onClick={() => onStub?.("Settings")}
          aria-label="Settings"
        >
          ⚙
        </button>
        {showLegacyLink ? (
          <a href="/" className="compass-link-btn compass-legacy">
            Legacy CRM
          </a>
        ) : null}
      </div>
    </header>
  );
}
