import React from "react";
import { getCountryCode } from "../../utils/formatters";
import { CountryFlag } from "../../utils/flags";

export default function CountryBadge({ country, isTarget = false }) {
  const code = getCountryCode(country);
  return (
    <span
      className={`country-pill ${isTarget ? "active" : ""}`}
      title={country}
      style={{ display: "inline-flex", alignItems: "center" }}
    >
      <CountryFlag name={country} style={{ marginRight: "4px" }} />
      <span>{code}</span>
    </span>
  );
}
