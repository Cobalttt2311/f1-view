import React, { useState } from "react";

export const NATIONALITY_AND_COUNTRY_TO_ISO = {
  british: "gb",
  english: "gb",
  scottish: "gb",
  welsh: "gb",
  uk: "gb",
  "great britain": "gb",
  dutch: "nl",
  netherlands: "nl",
  monégasque: "mc",
  monegasque: "mc",
  monaco: "mc",
  spanish: "es",
  spain: "es",
  mexican: "mx",
  mexico: "mx",
  australian: "au",
  australia: "au",
  german: "de",
  germany: "de",
  french: "fr",
  france: "fr",
  canadian: "ca",
  canada: "ca",
  japanese: "jp",
  japan: "jp",
  finnish: "fi",
  finland: "fi",
  danish: "dk",
  denmark: "dk",
  thai: "th",
  thailand: "th",
  chinese: "cn",
  china: "cn",
  american: "us",
  usa: "us",
  "united states": "us",
  brazilian: "br",
  brazil: "br",
  austrian: "at",
  austria: "at",
  swiss: "ch",
  switzerland: "ch",
  "new zealander": "nz",
  "new zealand": "nz",
  kiwi: "nz",
  belgian: "be",
  belgium: "be",
  "south african": "za",
  "south africa": "za",
  argentine: "ar",
  argentinian: "ar",
  argentina: "ar",
  polish: "pl",
  poland: "pl",
  swedish: "se",
  sweden: "se",
  russian: "ru",
  russia: "ru",
  indian: "in",
  india: "in",
  irish: "ie",
  ireland: "ie",
  colombian: "co",
  colombia: "co",
  venezuelan: "ve",
  venezuela: "ve",
  portuguese: "pt",
  portugal: "pt",
  hungarian: "hu",
  hungary: "hu",
  indonesian: "id",
  indonesia: "id",
  malaysian: "my",
  malaysia: "my",
  italian: "it",
  italy: "it",
  bahrain: "bh",
  bahraini: "bh",
  "saudi arabia": "sa",
  saudi: "sa",
  qatar: "qa",
  qatari: "qa",
  uae: "ae",
  "united arab emirates": "ae",
  emirati: "ae",
  azerbaijan: "az",
  azerbaijani: "az",
  singapore: "sg",
  singaporean: "sg",
  turkey: "tr",
  turkish: "tr",
  vietnam: "vn",
  vietnamese: "vn",
  morocco: "ma",
  moroccan: "ma",
  korea: "kr",
  "south korea": "kr",
  korean: "kr",
};

const ISO_TO_THREE_LETTER = {
  gb: "GBR",
  nl: "NED",
  mc: "MON",
  es: "ESP",
  mx: "MEX",
  au: "AUS",
  de: "GER",
  fr: "FRA",
  ca: "CAN",
  jp: "JPN",
  fi: "FIN",
  dk: "DEN",
  th: "THA",
  cn: "CHN",
  us: "USA",
  br: "BRA",
  at: "AUT",
  ch: "SUI",
  nz: "NZL",
  be: "BEL",
  za: "RSA",
  ar: "ARG",
  pl: "POL",
  se: "SWE",
  ru: "RUS",
  in: "IND",
  ie: "IRL",
  co: "COL",
  ve: "VEN",
  pt: "POR",
  hu: "HUN",
  id: "INA",
  my: "MAS",
  it: "ITA",
  bh: "BHR",
  sa: "KSA",
  qa: "QAT",
  ae: "UAE",
  az: "AZE",
  sg: "SGP",
  tr: "TUR",
};

const LOCAL_FLAGS = new Set([
  "nl", "gb", "mc", "es", "au", "mx", "de", "fr", "th", "ca",
  "us", "ar", "fi", "jp", "nz", "cn", "dk", "it", "be", "at",
  "hu", "sg", "az", "qa", "sa", "ae", "br", "bh", "pt", "tr", "ru",
]);

export function getCountryIso(countryOrNationality = "") {
  if (!countryOrNationality) return null;
  const clean = String(countryOrNationality)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "");

  if (NATIONALITY_AND_COUNTRY_TO_ISO[clean]) {
    return NATIONALITY_AND_COUNTRY_TO_ISO[clean];
  }

  for (const [key, iso] of Object.entries(NATIONALITY_AND_COUNTRY_TO_ISO)) {
    if (clean.includes(key) || key.includes(clean)) {
      return iso;
    }
  }

  return null;
}

export function getCountryThreeLetterCode(countryOrNationality = "") {
  const iso = getCountryIso(countryOrNationality);
  if (iso && ISO_TO_THREE_LETTER[iso]) return ISO_TO_THREE_LETTER[iso];
  if (!countryOrNationality) return "-";
  return String(countryOrNationality).substring(0, 3).toUpperCase();
}

export function CountryFlag({
  name = "",
  className = "",
  circle = true,
  size = 18,
  style = {},
}) {
  const iso = getCountryIso(name);
  const [failedLocal, setFailedLocal] = useState(false);
  const [failedAll, setFailedAll] = useState(false);

  if (!iso || failedAll) return null;

  const useLocal = LOCAL_FLAGS.has(iso) && !failedLocal;
  const src = useLocal
    ? `/assets/flags/${iso}.svg`
    : `https://flagcdn.com/w40/${iso}.png`;

  return (
    <img
      src={src}
      width={size}
      height={circle ? size : Math.round(size * 0.68)}
      alt={name || iso}
      className={`country-flag-icon ${circle ? "flag-circle" : ""} ${className}`}
      style={{
        width: `${size}px`,
        height: circle ? `${size}px` : `${Math.round(size * 0.68)}px`,
        borderRadius: circle ? "50%" : "2px",
        objectFit: "cover",
        verticalAlign: "middle",
        marginRight: "8px",
        display: "inline-block",
        flexShrink: 0,
        border: "1px solid rgba(255, 255, 255, 0.14)",
        ...style,
      }}
      onError={() => {
        if (useLocal) {
          setFailedLocal(true);
        } else {
          setFailedAll(true);
        }
      }}
    />
  );
}

export default CountryFlag;
