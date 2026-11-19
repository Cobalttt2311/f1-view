export const NAME = {
  APP_NAME: "TIFOSI",
  SUB_NAME: "Telemetry & Information for Formula One Statistics & Insights",
};

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function cleanDateStr(val) {
  if (!val) return null;
  const s = String(val).trim();
  if (!s || s === "-" || s.includes("\\N") || s.toLowerCase() === "null") {
    return null;
  }
  return s;
}

function parseShortDate(dateStr) {
  if (!dateStr) return null;
  const parts = String(dateStr).trim().split("-");
  if (parts.length !== 3) return null;
  const mIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(mIdx) || isNaN(day) || mIdx < 0 || mIdx > 11) return null;
  return { day, month: SHORT_MONTHS[mIdx] };
}

export function formatWeekendRange(race) {
  if (!race) return "-";
  const endStr = cleanDateStr(race.race_date);
  const startStr =
    cleanDateStr(race.fp1_date) ||
    cleanDateStr(race.fp2_date) ||
    cleanDateStr(race.fp3_date) ||
    cleanDateStr(race.sprint_date) ||
    cleanDateStr(race.quali_date);

  const s = parseShortDate(startStr);
  const e = parseShortDate(endStr);

  if (s && e) {
    const sDay = String(s.day).padStart(2, "0");
    const eDay = String(e.day).padStart(2, "0");
    if (s.month === e.month) {
      if (s.day === e.day) return `${eDay} ${e.month}`;
      return `${sDay} - ${eDay} ${e.month}`;
    }
    return `${sDay} ${s.month} - ${eDay} ${e.month}`;
  }
  if (e) return `${String(e.day).padStart(2, "0")} ${e.month}`;
  if (s) return `${String(s.day).padStart(2, "0")} ${s.month}`;
  return endStr || "-";
}
