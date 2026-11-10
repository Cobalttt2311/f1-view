import React from "react";

export const NATIONALITY_AND_COUNTRY_TO_ISO = {
  // Nationalities
  british: "gb",
  english: "gb",
  scottish: "gb",
  welsh: "gb",
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
  uk: "gb",
  "great britain": "gb",
};

export function getCountryIso(countryOrNationality = "") {
  if (!countryOrNationality) return null;
  const clean = String(countryOrNationality)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "");

  if (NATIONALITY_AND_COUNTRY_TO_ISO[clean]) {
    return NATIONALITY_AND_COUNTRY_TO_ISO[clean];
  }

  // Partial match check
  for (const [key, iso] of Object.entries(NATIONALITY_AND_COUNTRY_TO_ISO)) {
    if (clean.includes(key) || key.includes(clean)) {
      return iso;
    }
  }

  return null;
}

export function CountryFlag({ name = "", className = "", style = {} }) {
  const iso = getCountryIso(name);
  if (!iso) return null;

  return (
    <img
      src={`https://flagcdn.com/w20/${iso}.png`}
      srcSet={`https://flagcdn.com/w40/${iso}.png 2x`}
      width="18"
      height="12"
      alt={name || iso}
      className={`country-flag-icon ${className}`}
      style={{
        verticalAlign: "middle",
        marginRight: "6px",
        borderRadius: "2px",
        objectFit: "cover",
        display: "inline-block",
        boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
        ...style,
      }}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

export default CountryFlag;

