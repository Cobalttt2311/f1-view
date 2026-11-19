import React, { useState } from "react";
import { getDriverColor } from "../../utils/teamColors";
import {
  getDriverHeadshot,
  hasDriverHeadshot,
  resolveDriverCode,
} from "../../utils/f1Assets";
import WikiLink from "./WikiLink";

export default function DriverBadge({
  name = "",
  code = "",
  team = "",
  season = null,
  wikiUrl = "",
  showFullName = true,
  isHistorical = false,
  size = 28,
}) {
  const driverCode = resolveDriverCode(name, code);
  const hasRealPhoto = hasDriverHeadshot(name, code, season);
  const headshotUrl = hasRealPhoto ? getDriverHeadshot(name, code, season) : null;
  const [imgFailed, setImgFailed] = useState(false);

  const color = isHistorical
    ? "#2c2e3e"
    : getDriverColor(driverCode, team, season);

  const showPhoto = Boolean(headshotUrl) && !imgFailed;
  const displayName = name || code || "-";

  return (
    <span className="f1-driver-badge-inline">
      {showPhoto && (
        <span
          className="driver-avatar-circle"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
          }}
          title={`${displayName}${team ? ` (${team})` : ""}`}
        >
          <img
            src={headshotUrl}
            alt={displayName}
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        </span>
      )}

      {(showFullName || !showPhoto) && (
        <span className="driver-name-label">
          {wikiUrl ? (
            <WikiLink text={displayName} url={wikiUrl} />
          ) : (
            <span className="driver-name-strong">{displayName}</span>
          )}
        </span>
      )}
    </span>
  );
}
