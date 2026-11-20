import React, { useState } from "react";
import { getTeamColor } from "../../utils/teamColors";
import { getTeamLogo } from "../../utils/f1Assets";
import WikiLink from "./WikiLink";

export default function TeamBadge({
  name = "",
  season = null,
  wikiUrl = "",
  size = 24,
  showName = true,
}) {
  const logoUrl = getTeamLogo(name, season);
  const [imgFailed, setImgFailed] = useState(false);
  const teamColor = getTeamColor(name);

  if (!name) return <span>-</span>;

  const showLogo = Boolean(logoUrl) && !imgFailed;

  return (
    <span className="f1-team-badge-inline">
      {showLogo && (
        <span
          className="team-logo-circle"
          style={{
            width: `${size}px`,
            height: `${size}px`,
          }}
          title={name}
        >
          <img
            src={logoUrl}
            alt={name}
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        </span>
      )}

      {(showName || !showLogo) && (
        <span className="team-name-label">
          {wikiUrl ? <WikiLink text={name} url={wikiUrl} /> : name}
        </span>
      )}
    </span>
  );
}
