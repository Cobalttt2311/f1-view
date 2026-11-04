import React from "react";
import { getDriverColor, getDriverCode } from "../../utils/teamColors";
import WikiLink from "./WikiLink";

export default function DriverBadge({
  name = "",
  code = "",
  team = "",
  season = 2026,
  wikiUrl = "",
  showFullName = true,
  isHistorical = false,
}) {
  const driverCode = getDriverCode(name, code);
  const color = isHistorical
    ? "#C5A059"
    : getDriverColor(driverCode, team, season);

  const isLightColor = (() => {
    const hex = color.replace("#", "");

    const fullHex =
      hex.length === 3
        ? hex
            .split("")
            .map((char) => char + char)
            .join("")
        : hex;

    const r = parseInt(fullHex.substring(0, 2), 16) / 255;
    const g = parseInt(fullHex.substring(2, 4), 16) / 255;
    const b = parseInt(fullHex.substring(4, 6), 16) / 255;

    const toLinear = (value) =>
      value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);

    const luminance =
      0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

    return luminance > 0.179;
  })();

  return (
    <span
      className="driver-tag"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
      }}
    >
      <span
        className="driver-code-pill"
        style={{
          backgroundColor: color,
          color: isLightColor ? "#000000" : "#ffffff",
          fontFamily: "var(--font-mono)",
          fontWeight: 800,
          fontSize: "11px",
          padding: "2px 6px",
          borderRadius: "3px",
          letterSpacing: "0.5px",
          lineHeight: 1.2,
          display: "inline-block",
          textShadow: isLightColor ? "none" : "0 1px 2px rgba(0,0,0,0.5)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
        title={team || name}
      >
        {driverCode}
      </span>
      {showFullName && (
        <span className="driver-name-text">
          {wikiUrl ? (
            <WikiLink text={name} url={wikiUrl} />
          ) : (
            <strong>{name}</strong>
          )}
        </span>
      )}
    </span>
  );
}
