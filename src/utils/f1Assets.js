/**
 * F1 Asset Resolver & Intelligent Fallback Utility
 * Strictly maps verified driver full names, team names, and specific circuit venues to local static assets.
 */

import { getDriverCode, getTeamColor } from "./teamColors";

export const DEFAULT_DRIVER_SILHOUETTE = "/assets/common/siluet-man.png";
export const DEFAULT_CAR_SILHOUETTE = "/assets/common/car-siluet.png";

// Exact known local driver headshot codes in /assets/drivers/ (fallback archive)
export const AVAILABLE_DRIVER_HEADSHOTS = new Set([
  "AIT", "ALB", "ALO", "ANT", "BEA", "BOR", "BOT", "COL", "DEV", "DOO",
  "FIT", "GAS", "GIO", "GRO", "HAD", "HAM", "HUL", "KUB", "KVY", "LAT",
  "LAW", "LEC", "MAG", "MAZ", "MSC", "NOR", "OCO", "PER", "PIA", "RAI",
  "RIC", "RUS", "SAI", "SAR", "STR", "TSU", "VER", "VET", "ZHO",
]);

// Per-season driver portrait folders in /assets/drivers/{year}/ (2019 - 2026)
export const AVAILABLE_SEASON_DRIVERS = {
  2019: new Set([
    "ALB", "BOT", "GAS", "GIO", "GRO", "HAM", "HUL", "KUB", "KVY", "LEC",
    "MAG", "NOR", "PER", "RAI", "RIC", "RUS", "SAI", "STR", "VER", "VET",
  ]),
  2020: new Set([
    "AIT", "ALB", "BOT", "FIT", "GAS", "GIO", "GRO", "HAM", "HUL", "KVY",
    "LAT", "LEC", "MAG", "NOR", "OCO", "PER", "RAI", "RIC", "RUS", "SAI",
    "STR", "VER", "VET",
  ]),
  2021: new Set([
    "ALO", "BOT", "GAS", "GIO", "HAM", "KUB", "LAT", "LEC", "MAZ", "MSC",
    "NOR", "OCO", "PER", "RAI", "RIC", "RUS", "SAI", "STR", "TSU", "VER", "VET",
  ]),
  2022: new Set([
    "ALB", "ALO", "BOT", "DEV", "GAS", "HAM", "LAT", "LEC", "MAG", "MSC",
    "NOR", "OCO", "PER", "RIC", "RUS", "SAI", "STR", "TSU", "VER", "VET", "ZHO",
  ]),
  2023: new Set([
    "ALB", "ALO", "BOT", "DEV", "GAS", "HAM", "HUL", "LEC", "MAG", "NOR",
    "OCO", "PER", "PIA", "RIC", "RUS", "SAI", "SAR", "STR", "TSU", "VER", "ZHO",
  ]),
  2024: new Set([
    "ALB", "ALO", "BEA", "BOT", "COL", "GAS", "HAM", "HUL", "LAW", "LEC",
    "MAG", "NOR", "OCO", "PER", "PIA", "RIC", "RUS", "SAI", "SAR", "STR",
    "TSU", "VER", "ZHO",
  ]),
  2025: new Set([
    "ALB", "ALO", "ANT", "BEA", "BOR", "COL", "DOO", "GAS", "HAD", "HAM",
    "HUL", "LAW", "LEC", "NOR", "OCO", "PIA", "RUS", "SAI", "STR", "TSU", "VER",
  ]),
  2026: new Set([
    "ALB", "ALO", "ANT", "BEA", "BOR", "BOT", "CAM", "COL", "GAS", "HAD",
    "HAM", "HIR", "HUL", "LAW", "LEC", "LIN", "NOR", "OCO", "PER", "PIA",
    "RUS", "SAI", "STR", "TSU", "VER",
  ]),
};

export const AVAILABLE_2026_DRIVERS = AVAILABLE_SEASON_DRIVERS[2026];

// Strict full-name dictionary (normalized without accents) for modern drivers with local headshots.
// Never match historical drivers (like David Hampshire or Paul Russo) by 3-letter surname prefixes.
export const DRIVER_NAME_TO_CODE = {
  "max verstappen": "VER",
  "lando norris": "NOR",
  "charles leclerc": "LEC",
  "oscar piastri": "PIA",
  "carlos sainz": "SAI",
  "carlos sainz jr.": "SAI",
  "carlos sainz jr": "SAI",
  "george russell": "RUS",
  "lewis hamilton": "HAM",
  "sergio perez": "PER",
  "fernando alonso": "ALO",
  "pierre gasly": "GAS",
  "nico hulkenberg": "HUL",
  "yuki tsunoda": "TSU",
  "lance stroll": "STR",
  "esteban ocon": "OCO",
  "kevin magnussen": "MAG",
  "alexander albon": "ALB",
  "alex albon": "ALB",
  "daniel ricciardo": "RIC",
  "oliver bearman": "BEA",
  "ollie bearman": "BEA",
  "franco colapinto": "COL",
  "liam lawson": "LAW",
  "zhou guanyu": "ZHO",
  "guanyu zhou": "ZHO",
  "logan sargeant": "SAR",
  "valtteri bottas": "BOT",
  "nyck de vries": "DEV",
  "kimi antonelli": "ANT",
  "andrea kimi antonelli": "ANT",
  "gabriel bortoleto": "BOR",
  "isack hadjar": "HAD",
  "jack doohan": "DOO",
  "arvid lindblad": "LIN",
  "ryo hirakawa": "HIR",
  "rafael camara": "CAM",
  "sebastian vettel": "VET",
  "mick schumacher": "MSC",
  "kimi raikkonen": "RAI",
  "antonio giovinazzi": "GIO",
  "nikita mazepin": "MAZ",
  "romain grosjean": "GRO",
  "daniil kvyat": "KVY",
  "robert kubica": "KUB",
  "pietro fittipaldi": "FIT",
  "jack aitken": "AIT",
  "nicholas latifi": "LAT",
};

// Verified permanent racing numbers for modern drivers (fallback when database has \N)
export const VERIFIED_DRIVER_NUMBERS = {
  "max verstappen": 33,
  "lando norris": 4,
  "charles leclerc": 16,
  "oscar piastri": 81,
  "carlos sainz": 55,
  "carlos sainz jr.": 55,
  "carlos sainz jr": 55,
  "george russell": 63,
  "lewis hamilton": 44,
  "sergio perez": 11,
  "fernando alonso": 14,
  "pierre gasly": 10,
  "nico hulkenberg": 27,
  "yuki tsunoda": 22,
  "lance stroll": 18,
  "esteban ocon": 31,
  "kevin magnussen": 20,
  "alexander albon": 23,
  "alex albon": 23,
  "daniel ricciardo": 3,
  "oliver bearman": 87,
  "ollie bearman": 87,
  "franco colapinto": 43,
  "liam lawson": 30,
  "zhou guanyu": 24,
  "guanyu zhou": 24,
  "logan sargeant": 2,
  "valtteri bottas": 77,
  "nyck de vries": 21,
  "kimi antonelli": 12,
  "andrea kimi antonelli": 12,
  "gabriel bortoleto": 5,
  "isack hadjar": 6,
  "jack doohan": 7,
  "arvid lindblad": 40,
  "sebastian vettel": 5,
  "mick schumacher": 47,
  "kimi raikkonen": 7,
  "antonio giovinazzi": 99,
  "nikita mazepin": 9,
  "romain grosjean": 8,
  "daniil kvyat": 26,
  "robert kubica": 88,
  "pietro fittipaldi": 51,
  "jack aitken": 89,
  "nicholas latifi": 6,
};

function normalizeDriverName(name = "") {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function getVerifiedDriverNumber(name = "") {
  const cleanName = normalizeDriverName(name);
  if (cleanName && Object.hasOwn(VERIFIED_DRIVER_NUMBERS, cleanName)) {
    return VERIFIED_DRIVER_NUMBERS[cleanName];
  }
  return null;
}

/**
 * Matches a driver's full name strictly against the 28 modern drivers who have local headshots.
 * Returns the 3-letter asset code ONLY if it is genuinely that modern driver.
 */
export function resolveVerifiedModernDriverCode(name = "", explicitCode = "") {
  const cleanName = normalizeDriverName(name);

  if (cleanName) {
    if (Object.hasOwn(DRIVER_NAME_TO_CODE, cleanName)) {
      return DRIVER_NAME_TO_CODE[cleanName];
    }
    return null;
  }

  // Only if no name was supplied at all, check explicit 3-letter code
  const cleanCode = String(explicitCode || "").toUpperCase().trim();
  if (
    cleanCode &&
    cleanCode !== "\\N" &&
    (AVAILABLE_DRIVER_HEADSHOTS.has(cleanCode) ||
      AVAILABLE_2026_DRIVERS.has(cleanCode))
  ) {
    return cleanCode;
  }
  return null;
}

export function resolveDriverCode(name = "", code = "") {
  const verified = resolveVerifiedModernDriverCode(name, code);
  if (verified) return verified;
  return getDriverCode(name, code);
}

export function hasDriverHeadshot(name = "", code = "", season = null) {
  const verifiedCode = resolveVerifiedModernDriverCode(name, code);
  if (!verifiedCode) return false;

  if (season !== null && season !== undefined && season !== "") {
    const numSeason = Number(season);
    if (!isNaN(numSeason) && numSeason < 2019) {
      return false;
    }
    if (numSeason >= 2019) {
      const yr = Math.min(numSeason, 2026);
      return Boolean(AVAILABLE_SEASON_DRIVERS[yr]?.has(verifiedCode));
    }
  }
  return (
    AVAILABLE_2026_DRIVERS.has(verifiedCode) ||
    AVAILABLE_DRIVER_HEADSHOTS.has(verifiedCode)
  );
}

export function getDriverHeadshot(name = "", explicitCode = "", season = null) {
  const verifiedCode = resolveVerifiedModernDriverCode(name, explicitCode);
  if (!verifiedCode) return DEFAULT_DRIVER_SILHOUETTE;

  // 1. Strict per-season lookup when a specific season is provided (2019-2026)
  if (season !== null && season !== undefined && season !== "") {
    const numSeason = Number(season);
    if (!isNaN(numSeason) && numSeason < 2019) {
      return DEFAULT_DRIVER_SILHOUETTE;
    }
    if (numSeason >= 2019) {
      const yr = Math.min(numSeason, 2026);
      if (AVAILABLE_SEASON_DRIVERS[yr]?.has(verifiedCode)) {
        return `/assets/drivers/${yr}/${verifiedCode}.png`;
      }
      return DEFAULT_DRIVER_SILHOUETTE;
    }
  }

  // 2. Global / All-Time views: always use the latest available portrait (2026 -> 2025 -> base)
  if (AVAILABLE_2026_DRIVERS.has(verifiedCode)) {
    return `/assets/drivers/2026/${verifiedCode}.png`;
  }
  if (AVAILABLE_SEASON_DRIVERS[2025]?.has(verifiedCode)) {
    return `/assets/drivers/2025/${verifiedCode}.png`;
  }
  if (AVAILABLE_DRIVER_HEADSHOTS.has(verifiedCode)) {
    return `/assets/drivers/${verifiedCode}.png`;
  }
  return DEFAULT_DRIVER_SILHOUETTE;
}

// Team Slug Resolver for /assets/teams/ and /assets/car-liveries/{year}/
export function resolveTeamSlug(teamName = "") {
  if (!teamName) return null;
  const t = String(teamName).toLowerCase().trim();
  if (t.includes("red bull") || t.includes("red_bull") || t.includes("redbull"))
    return "red-bull";
  if (t.includes("ferrari")) return "ferrari";
  if (t.includes("mercedes")) return "mercedes";
  if (t.includes("mclaren")) return "mclaren";
  if (t.includes("aston martin") || t.includes("aston_martin"))
    return "aston-martin";
  if (t.includes("alpine")) return "alpine";
  if (t.includes("williams")) return "williams";
  if (t.includes("haas")) return "haas";
  if (
    t.includes("kick sauber") ||
    t === "sauber" ||
    t.includes("stake f1")
  )
    return "kick-sauber";
  if (t.includes("alfa romeo") || t.includes("alfa_romeo"))
    return "alfa-romeo";
  if (t.includes("alphatauri") || t.includes("alpha tauri"))
    return "alphatauri";
  if (t.includes("audi")) return "audi";
  if (t.includes("cadillac")) return "cadillac";
  if (t.includes("renault")) return "renault";
  if (t.includes("racing point") || t.includes("racing_point"))
    return "racing-point";
  if (t.includes("toro rosso") || t.includes("toro_rosso"))
    return "toro-rosso";
  if (
    t === "rb" ||
    t.includes("racing bulls") ||
    t.includes("rb f1") ||
    t.includes("visa cash app")
  ) {
    return "rb";
  }
  return null;
}

function resolveTeamFileSlugForYear(slug, yr) {
  let fileSlug = slug;
  if (yr === 2019) {
    if (slug === "alpine") fileSlug = "renault";
    if (slug === "aston-martin") fileSlug = "racing-point";
    if (slug === "alphatauri" || slug === "rb") fileSlug = "toro-rosso";
    if (slug === "kick-sauber" || slug === "audi") fileSlug = "alfa-romeo";
    if (slug === "cadillac") return null;
  } else if (yr === 2020) {
    if (slug === "alpine") fileSlug = "renault";
    if (slug === "aston-martin") fileSlug = "racing-point";
    if (slug === "toro-rosso" || slug === "rb") fileSlug = "alphatauri";
    if (slug === "kick-sauber" || slug === "audi") fileSlug = "alfa-romeo";
    if (slug === "cadillac") return null;
  } else if (yr === 2021 || yr === 2022 || yr === 2023) {
    if (slug === "renault") fileSlug = "alpine";
    if (slug === "racing-point") fileSlug = "aston-martin";
    if (slug === "toro-rosso" || slug === "rb") fileSlug = "alphatauri";
    if (slug === "kick-sauber" || slug === "audi") fileSlug = "alfa-romeo";
    if (slug === "cadillac") return null;
  } else if (yr === 2024 || yr === 2025) {
    if (slug === "alfa-romeo" || slug === "audi") fileSlug = "kick-sauber";
    if (slug === "alphatauri" || slug === "toro-rosso") fileSlug = "rb";
    if (slug === "renault") fileSlug = "alpine";
    if (slug === "racing-point") fileSlug = "aston-martin";
    if (slug === "cadillac") return null;
  } else if (yr === 2026) {
    if (slug === "alfa-romeo" || slug === "kick-sauber") fileSlug = "audi";
    if (slug === "alphatauri" || slug === "toro-rosso") fileSlug = "rb";
    if (slug === "renault") fileSlug = "alpine";
    if (slug === "racing-point") fileSlug = "aston-martin";
  }
  return fileSlug;
}

export function getTeamLogo(teamName = "", season = null) {
  const slug = resolveTeamSlug(teamName);
  if (!slug) return null;

  if (season !== null && season !== undefined && season !== "") {
    const numSeason = Number(season);
    if (!isNaN(numSeason) && numSeason < 2019) {
      return null;
    }
    if (numSeason >= 2019) {
      const yr = Math.min(numSeason, 2026);
      const fileSlug = resolveTeamFileSlugForYear(slug, yr);
      if (fileSlug) return `/assets/teams/${fileSlug}.png`;
    }
  }

  return `/assets/teams/${slug}.png`;
}

export function getCarLivery(season = 2024, teamName = "") {
  const slug = resolveTeamSlug(teamName);
  const numSeason = Number(season) || 2024;
  // Historical seasons before 2019 or teams without an official livery use the car silhouette
  if (!slug || numSeason < 2019) return DEFAULT_CAR_SILHOUETTE;
  const yr = Math.min(Math.max(numSeason, 2019), 2026);
  const fileSlug = resolveTeamFileSlugForYear(slug, yr);
  if (!fileSlug) return DEFAULT_CAR_SILHOUETTE;
  return `/assets/car-liveries/${yr}/${fileSlug}.png`;
}

/**
 * Venue-Specific Circuit Matchers (81 Official White-Outline Track SVGs)
 * Matches specific track names or venue cities so circuits in the same country never collide.
 */
const CIRCUIT_MATCHERS = [
  {
    keywords: ["bahrain international", "sakhir", "bahrain"],
    exclude: ["outer", "malaysia", "sepang", "kuala lumpur"],
    svg: "bahrain",
    hero: "bahrain",
  },
  {
    keywords: ["sepang", "kuala lumpur", "malaysia"],
    svg: "sepang",
    hero: "sepang",
  },
  {
    keywords: ["jeddah corniche", "jeddah", "saudi arabia"],
    svg: "jeddah",
    hero: "jeddah",
  },
  {
    keywords: ["albert park", "melbourne"],
    svg: "melbourne",
    hero: "melbourne",
  },
  {
    keywords: ["adelaide"],
    svg: "adelaide",
    hero: "australia",
  },
  {
    keywords: ["suzuka"],
    svg: "suzuka",
    hero: "suzuka",
  },
  {
    keywords: ["fuji speedway", "fuji", "oyama"],
    svg: "fuji",
    hero: "japan",
  },
  {
    keywords: ["ti circuit", "aida", "okayama", "pacific"],
    svg: "aida",
    hero: "japan",
  },
  {
    keywords: ["shanghai international", "shanghai", "chinese", "china"],
    svg: "shanghai",
    hero: "shanghai",
  },
  {
    keywords: ["miami international", "miami"],
    svg: "miami",
    hero: "miami",
  },
  {
    keywords: ["enzo e dino ferrari", "imola", "emilia romagna"],
    svg: "imola",
    hero: "imola",
  },
  {
    keywords: ["mugello", "scarperia", "tuscan"],
    svg: "mugello",
    hero: "italy",
  },
  {
    keywords: ["pescara"],
    svg: "pescara",
    hero: "italy",
  },
  {
    keywords: ["circuit de monaco", "monte-carlo", "monte carlo", "monaco"],
    svg: "monaco",
    hero: "monaco",
  },
  {
    keywords: ["gilles villeneuve", "montreal", "montréal"],
    svg: "montreal",
    hero: "montreal",
  },
  {
    keywords: ["mosport", "bowmanville"],
    svg: "mosport",
    hero: "canada",
  },
  {
    keywords: ["mont-tremblant", "tremblant", "st. jovite"],
    svg: "mont-tremblant",
    hero: "canada",
  },
  {
    keywords: ["madring", "ifema", "madrid"],
    exclude: ["jarama"],
    svg: "madring",
    hero: "madring",
  },
  {
    keywords: ["jarama"],
    svg: "jarama",
    hero: "spain",
  },
  {
    keywords: ["montjuïc", "montjuic"],
    svg: "montjuic",
    hero: "spain",
  },
  {
    keywords: ["pedralbes"],
    svg: "pedralbes",
    hero: "spain",
  },
  {
    keywords: ["jerez"],
    svg: "jerez",
    hero: "spain",
  },
  {
    keywords: ["valencia street", "valencia"],
    svg: "valencia",
    hero: "spain",
  },
  {
    keywords: [
      "barcelona-catalunya",
      "catalunya",
      "montmeló",
      "montmelo",
      "barcelona",
    ],
    exclude: ["montjuïc", "montjuic", "pedralbes", "madring", "madrid"],
    svg: "catalunya",
    hero: "barcelona",
  },
  {
    keywords: [
      "red bull ring",
      "spielberg",
      "a1-ring",
      "ostereichring",
      "österreichring",
    ],
    svg: "spielberg",
    hero: "austria",
  },
  {
    keywords: ["zeltweg"],
    svg: "zeltweg",
    hero: "austria",
  },
  {
    keywords: ["silverstone"],
    svg: "silverstone",
    hero: "silverstone",
  },
  {
    keywords: ["brands hatch", "kent"],
    svg: "brands-hatch",
    hero: "great_britain",
  },
  {
    keywords: ["donington"],
    svg: "donington",
    hero: "great_britain",
  },
  {
    keywords: ["aintree", "liverpool"],
    svg: "aintree",
    hero: "great_britain",
  },
  {
    keywords: [
      "hungaroring",
      "mogyoród",
      "mogyorod",
      "budapest",
      "hungarian",
      "hungary",
    ],
    svg: "hungaroring",
    hero: "hungaroring",
  },
  {
    keywords: ["spa-francorchamps", "francorchamps", "stavelot", "spa"],
    svg: "spa-francorchamps",
    hero: "spa",
  },
  {
    keywords: ["zolder", "heusden-zolder"],
    svg: "zolder",
    hero: "belgium",
  },
  {
    keywords: ["nivelles-baulers", "nivelles", "brussels"],
    svg: "nivelles",
    hero: "belgium",
  },
  {
    keywords: ["zandvoort", "netherlands", "dutch"],
    svg: "zandvoort",
    hero: "zandvoort",
  },
  {
    keywords: ["autodromo nazionale di monza", "monza"],
    svg: "monza",
    hero: "monza",
  },
  {
    keywords: ["baku city", "baku", "azerbaijan"],
    svg: "baku",
    hero: "baku",
  },
  {
    keywords: ["marina bay", "singapore"],
    svg: "marina-bay",
    hero: "singapore",
  },
  {
    keywords: ["circuit of the americas", "austin", "cota"],
    svg: "austin",
    hero: "austin",
  },
  {
    keywords: ["indianapolis"],
    svg: "indianapolis",
    hero: "united_states",
  },
  {
    keywords: ["watkins glen"],
    svg: "watkins-glen",
    hero: "united_states",
  },
  {
    keywords: ["long beach"],
    svg: "long-beach",
    hero: "united_states",
  },
  {
    keywords: ["detroit"],
    svg: "detroit",
    hero: "united_states",
  },
  {
    keywords: ["dallas", "fair park"],
    svg: "dallas",
    hero: "united_states",
  },
  {
    keywords: ["phoenix"],
    svg: "phoenix",
    hero: "united_states",
  },
  {
    keywords: ["sebring"],
    svg: "sebring",
    hero: "united_states",
  },
  {
    keywords: ["riverside"],
    svg: "riverside",
    hero: "united_states",
  },
  {
    keywords: ["caesars palace", "caesar"],
    svg: "caesars-palace",
    hero: "las_vegas",
  },
  {
    keywords: ["las vegas strip", "las vegas"],
    exclude: ["caesar", "caesars"],
    svg: "las-vegas",
    hero: "las_vegas",
  },
  {
    keywords: ["hermanos rodríguez", "hermanos rodriguez", "mexico city", "mexico"],
    svg: "mexico-city",
    hero: "mexico",
  },
  {
    keywords: ["josé carlos pace", "jose carlos pace", "interlagos", "são paulo", "sao paulo"],
    svg: "interlagos",
    hero: "interlagos",
  },
  {
    keywords: ["jacarepaguá", "jacarepagua", "rio de janeiro"],
    svg: "jacarepagua",
    hero: "brazil",
  },
  {
    keywords: ["lusail", "losail", "al daayen", "qatar"],
    svg: "lusail",
    hero: "lusail",
  },
  {
    keywords: ["yas marina", "abu dhabi"],
    svg: "yas-marina",
    hero: "yas_marina",
  },
  {
    keywords: ["paul ricard", "le castellet"],
    svg: "paul-ricard",
    hero: "paul_ricard",
  },
  {
    keywords: ["magny-cours", "nevers"],
    svg: "magny-cours",
    hero: "magny_cours",
  },
  {
    keywords: ["dijon-prenois", "dijon"],
    svg: "dijon",
    hero: "dijon",
  },
  {
    keywords: ["charade", "clermont-ferrand"],
    svg: "clermont-ferrand",
    hero: "clermont_ferrand",
  },
  {
    keywords: ["rouen-les-essarts", "rouen"],
    svg: "rouen",
    hero: "rouen",
  },
  {
    keywords: ["reims-gueux", "reims"],
    svg: "reims",
    hero: "reims",
  },
  {
    keywords: ["bugatti", "le mans"],
    svg: "bugatti",
    hero: "lemans",
  },
  {
    keywords: ["hockenheimring", "hockenheim"],
    svg: "hockenheimring",
    hero: "hockenheimring",
  },
  {
    keywords: ["nürburgring", "nurburgring", "nürburg", "nurburg"],
    svg: "nurburgring",
    hero: "nurburgring",
  },
  {
    keywords: ["avus", "berlin"],
    svg: "avus",
    hero: "avus",
  },
  {
    keywords: ["algarve", "portimão", "portimao"],
    svg: "portimao",
    hero: "portimao",
  },
  {
    keywords: ["estoril"],
    svg: "estoril",
    hero: "estoril",
  },
  {
    keywords: ["boavista", "porto", "oport"],
    svg: "porto",
    hero: "porto",
  },
  {
    keywords: ["monsanto", "lisbon"],
    svg: "monsanto",
    hero: "monsanto",
  },
  {
    keywords: ["sochi autodrom", "sochi"],
    svg: "sochi",
    hero: "sochi",
  },
  {
    keywords: ["istanbul park", "istanbul", "turkey"],
    svg: "istanbul",
    hero: "istanbul",
  },
  {
    keywords: ["kyalami", "midrand"],
    svg: "kyalami",
    hero: "kyalami",
  },
  {
    keywords: ["prince george", "east london"],
    svg: "east-london",
    hero: null,
  },
  {
    keywords: ["oscar galvez", "gálvez", "buenos aires", "argentina"],
    svg: "buenos-aires",
    hero: "buenos_aires",
  },
  {
    keywords: ["buddh", "greater noida", "india"],
    svg: "buddh",
    hero: "buddh",
  },
  {
    keywords: ["korean international", "yeongam", "korea"],
    svg: "yeongam",
    hero: "yeongam",
  },
  {
    keywords: ["scandinavian raceway", "anderstorp", "sweden"],
    svg: "anderstorp",
    hero: "anderstorp",
  },
  {
    keywords: ["bremgarten", "bern", "switzerland"],
    svg: "bremgarten",
    hero: "bremgarten",
  },
  {
    keywords: ["ain diab", "casablanca", "morocco"],
    svg: "ain-diab",
    hero: null,
  },
];

export function resolveCircuitAssets(...queries) {
  const combined = queries
    .filter(Boolean)
    .map((q) => String(q).toLowerCase())
    .join(" ");

  if (!combined) {
    return { svgUrl: null, heroUrl: "/assets/hero/dashboard_hero.jpg" };
  }

  for (const m of CIRCUIT_MATCHERS) {
    if (m.exclude && m.exclude.some((ex) => combined.includes(ex))) {
      continue;
    }
    if (m.keywords.some((kw) => combined.includes(kw))) {
      return {
        svgUrl: m.svg ? `/assets/circuits/${m.svg}.svg` : null,
        heroUrl: m.hero
          ? `/assets/hero/${m.hero}.jpg`
          : "/assets/hero/dashboard_hero.jpg",
      };
    }
  }

  return { svgUrl: null, heroUrl: "/assets/hero/dashboard_hero.jpg" };
}

export function getCircuitTrackMap(...queries) {
  return resolveCircuitAssets(...queries).svgUrl;
}

export function getHeroImage(...queries) {
  return resolveCircuitAssets(...queries).heroUrl;
}

export function getTyreIcon(compound = "soft") {
  const c = String(compound || "soft").toLowerCase();
  return `/assets/tyres/${c}.svg`;
}

export function getCountryFlag(countryCode = "") {
  if (!countryCode) return null;
  return `/assets/flags/${String(countryCode).toLowerCase()}.svg`;
}

export function getTeamCardGradient(teamName = "") {
  const color = getTeamColor(teamName);
  return {
    baseColor: color,
    gradient: `linear-gradient(110deg, ${color}38 0%, ${color}95 45%, ${color}E6 100%), #0d0e14`,
    subtleGradient: `linear-gradient(135deg, ${color}24 0%, #0d0e14 85%)`,
  };
}
