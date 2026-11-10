export const COUNTRY_CODES = {
  Australia: "AUS",
  China: "CHN",
  Japan: "JPN",
  Bahrain: "BHR",
  "Saudi Arabia": "KSA",
  USA: "USA",
  "United States": "USA",
  Miami: "USA",
  "Las Vegas": "USA",
  Austin: "USA",
  Italy: "ITA",
  Monaco: "MCO",
  Spain: "ESP",
  Canada: "CAN",
  Austria: "AUT",
  UK: "GBR",
  "Great Britain": "GBR",
  Hungary: "HUN",
  Belgium: "BEL",
  Netherlands: "NLD",
  Azerbaijan: "AZE",
  Singapore: "SGP",
  Mexico: "MEX",
  Brazil: "BRA",
  Qatar: "QAT",
  UAE: "UAE",
  "United Arab Emirates": "UAE",
  "Abu Dhabi": "UAE",
  France: "FRA",
  Germany: "GER",
  Portugal: "PRT",
  Russia: "RUS",
  Turkey: "TUR",
  Malaysia: "MYS",
};
export function getCountryCode(countryName) {
  if (!countryName) return "F1";
  return (
    COUNTRY_CODES[countryName] || countryName.substring(0, 3).toUpperCase()
  );
}
export function formatGapTime(gap) {
  if (!gap) return "-";
  if (typeof gap === "string" && gap.startsWith("+")) return gap;
  return `+${gap}`;
}
export function formatLapTime(millis) {
  if (!millis) return "-";
  const minutes = Math.floor(millis / 60000);
  const seconds = ((millis % 60000) / 1000).toFixed(3);
  return `${minutes}:${seconds.padStart(6, "0")}`;
}
