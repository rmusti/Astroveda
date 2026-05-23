/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Astrological Calculation Utilities (Sidereal / Vedic Astrology) ---

export interface PlanetPosition {
  name: string;
  tropicalLongitude: number;
  longitude: number; // Sidereal Longitude after Ayanamsa subtraction
  formattedLongitude: string; // e.g. 14° 24' 12"
  rashi: string; // Sign name
  rashiIndex: number; // 0 = Aries, 1 = Taurus...
  rashiDegree: number; // Degree within the sign (0 - 30)
  nakshatra: string;
  nakshatraIndex: number;
  nakshatraPada: number;
  house: number; // 1 to 12 based on Lagna
  navamshaRashi: string; // D9 Navamsha Sign
  navamshaRashiIndex: number;
  isRetrograde: boolean;
}

export interface KundliData {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone: number;
  julianDate: number;
  ayanamsa: number;
  lagna: {
    longitude: number;
    formattedLongitude: string;
    rashi: string;
    rashiIndex: number;
    rashiDegree: number;
    nakshatra: string;
    nakshatraPada: number;
  };
  planets: Record<string, PlanetPosition>;
  houses: { houseNumber: number; rashiIndex: number; rashiName: string }[];
  aspects: string[]; // List of planetary aspects (Drishti)
}

// Zodiac Signs List
export const RASHIS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

// Zodiac Rulers (Traditional Planetary Rulers)
export const RASHI_RULERS: Record<string, string> = {
  "Aries": "Mars",
  "Taurus": "Venus",
  "Gemini": "Mercury",
  "Cancer": "Moon",
  "Leo": "Sun",
  "Virgo": "Mercury",
  "Libra": "Venus",
  "Scorpio": "Mars",
  "Sagittarius": "Jupiter",
  "Capricorn": "Saturn",
  "Aquarius": "Saturn",
  "Pisces": "Jupiter"
};

// Sanskrit / Traditional Names of Rashis
export const RASHI_SANSKRIT = [
  "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
  "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"
];

// Sanskrit / Traditional Names of Planets
export const PLANET_SANSKRIT: Record<string, string> = {
  "Sun": "Surya",
  "Moon": "Chandra",
  "Mars": "Mangal",
  "Mercury": "Budha",
  "Jupiter": "Guru",
  "Venus": "Shukra",
  "Saturn": "Shani",
  "Rahu": "Rahu",
  "Ketu": "Ketu"
};

// Nakshatras List
export const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Moola", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

// Helper: Degree to Radians
const degToRad = (deg: number) => (deg * Math.PI) / 180.0;
// Helper: Radians to Degrees
const radToDeg = (rad: number) => (rad * 180.0) / Math.PI;

// Helper: Normalize degrees to 0 - 360
export function normalizeDegrees(deg: number): number {
  let value = deg % 360;
  if (value < 0) value += 360;
  return value;
}

// Format longitude as 14° 24' 12"
export function formatDegree(deg: number): string {
  const normalized = normalizeDegrees(deg);
  const d = Math.floor(normalized);
  const mDouble = (normalized - d) * 60;
  const m = Math.floor(mDouble);
  const s = Math.round((mDouble - m) * 60);
  return `${d}° ${m}' ${s}"`;
}

// Calculate Julian Date from Date and Time
export function calculateJulianDate(year: number, month: number, day: number, hour: number, minute: number, tzOffset: number): number {
  // Convert local time to UTC decimal hours
  let utcHour = hour + minute / 60.0 - tzOffset;
  let utcDay = day;
  let utcMonth = month;
  let utcYear = year;

  if (utcHour >= 24) {
    utcHour -= 24;
    utcDay += 1;
  } else if (utcHour < 0) {
    utcHour += 24;
    utcDay -= 1;
  }

  // Adjust date if day went out of month bounds (simplified, standard JS Date handles boundaries easily)
  const tempDate = new Date(Date.UTC(utcYear, utcMonth - 1, utcDay, Math.floor(utcHour), Math.round((utcHour % 1) * 60)));
  utcYear = tempDate.getUTCFullYear();
  utcMonth = tempDate.getUTCMonth() + 1;
  utcDay = tempDate.getUTCDate();
  const decimalUTCHour = tempDate.getUTCHours() + tempDate.getUTCMinutes() / 60.0 + tempDate.getUTCSeconds() / 3600.0;

  let y = utcYear;
  let m = utcMonth;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + utcDay + (decimalUTCHour / 24.0) + B - 1524.5;
  return jd;
}

// Calculate Lahiri Ayanamsa (Degrees)
export function calculateLahiriAyanamsa(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0; // Julian Centuries from J2000
  // Standard Lahiri Ayanamsa formulation
  // Highly accurate calculation: Base value in 2000 is 23.85306 degrees, changing by 50.27" per year
  return normalizeDegrees(23.85306 + 1.396 * T + 0.000308 * T * T);
}

// Solve Kepler's Equation: E - e * sin(E) = M
function solveKepler(M: number, e: number): number {
  let E = M;
  const tolerance = 1e-6;
  for (let i = 0; i < 15; i++) {
    const error = E - e * Math.sin(E) - M;
    if (Math.abs(error) < tolerance) break;
    E = E - error / (1 - e * Math.cos(E));
  }
  return E;
}

// Structure to hold Heliocentric elements (J2000 values, rate of change per century)
interface OrbitalElements {
  a0: number; ad: number; // semi-major axis (AU)
  e0: number; ed: number; // eccentricity
  i0: number; id: number; // inclination (deg)
  L0: number; Ld: number; // mean longitude (deg)
  w0: number; wd: number; // longitude of perihelion (deg)
  o0: number; od: number; // longitude of ascending node (deg)
}

const ORBITAL_DATABASE: Record<string, OrbitalElements> = {
  Mercury: {
    a0: 0.38709893, ad: 0.0,
    e0: 0.20563069, ed: 0.00002040,
    i0: 7.00487, id: -0.00594,
    L0: 252.25084, Ld: 149472.67411,
    w0: 77.45645, wd: 0.15901,
    o0: 48.33167, od: -0.12537
  },
  Venus: {
    a0: 0.72333199, ad: 0.0,
    e0: 0.00677323, ed: -0.00004776,
    i0: 3.39471, id: -0.00078,
    L0: 181.97973, Ld: 58517.81538,
    w0: 131.53298, wd: 0.00201,
    o0: 76.68069, od: -0.27769
  },
  Earth: {
    a0: 1.00000011, ad: 0.0,
    e0: 0.01671022, ed: -0.00003804,
    i0: 0.0, id: 0.0,
    L0: 100.46435, Ld: 35999.37287,
    w0: 102.94719, wd: 0.32327,
    o0: 0.0, od: 0.0
  },
  Mars: {
    a0: 1.52366231, ad: 0.0,
    e0: 0.09341233, ed: 0.00011902,
    i0: 1.85061, id: -0.00724,
    L0: 355.45332, Ld: 19140.30268,
    w0: 336.04084, wd: 0.44388,
    o0: 49.57854, od: -0.29257
  },
  Jupiter: {
    a0: 5.20336301, ad: 0.0,
    e0: 0.04839266, ed: -0.00012880,
    i0: 1.30530, id: -0.00415,
    L0: 34.40438, Ld: 3034.74612,
    w0: 14.75385, wd: 0.19111,
    o0: 100.55615, od: 0.20399
  },
  Saturn: {
    a0: 9.53707032, ad: 0.0,
    e0: 0.05415060, ed: -0.00036762,
    i0: 2.48446, id: 0.00193,
    L0: 49.94432, Ld: 1222.11379,
    w0: 92.43194, wd: -0.41897,
    o0: 113.71504, od: -0.28867
  }
};

interface Vector3D { x: number; y: number; z: number }

// Compute Heliocentric Coordinates for a given planet
function getHeliocentricVector(name: string, T: number): Vector3D {
  const elem = ORBITAL_DATABASE[name];
  if (!elem) return { x: 0, y: 0, z: 0 };

  const a = elem.a0 + elem.ad * T;
  const e = elem.e0 + elem.ed * T;
  const i = degToRad(elem.i0 + elem.id * T);
  const L = degToRad(normalizeDegrees(elem.L0 + elem.Ld * T));
  const w = degToRad(normalizeDegrees(elem.w0 + elem.wd * T));
  const omega = degToRad(normalizeDegrees(elem.o0 + elem.od * T));

  const argPeri = w - omega; // argument of perihelion
  const M = L - w; // mean anomaly

  const E = solveKepler(M, e);

  // Position in orbital plane
  const x_plane = a * (Math.cos(E) - e);
  const y_plane = a * Math.sqrt(1 - e * e) * Math.sin(E);

  // Convert to heliocentric ecliptic coordinates
  const cosOmega = Math.cos(omega);
  const sinOmega = Math.sin(omega);
  const cosArg = Math.cos(argPeri);
  const sinArg = Math.sin(argPeri);
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);

  const x = x_plane * (cosOmega * cosArg - sinOmega * sinArg * cosI) - y_plane * (cosOmega * sinArg + sinOmega * cosArg * cosI);
  const y = x_plane * (sinOmega * cosArg + cosOmega * sinArg * cosI) - y_plane * (sinOmega * sinArg - cosOmega * cosArg * cosI);
  const z = x_plane * (sinArg * sinI) + y_plane * (cosArg * sinI);

  return { x, y, z };
}

// Calculate the Geocentric Ecliptic Longitude (Tropical) of high accuracy
export function getTropicalPlanetLongitude(name: string, T: number): number {
  if (name === "Sun") {
    // Sun position = Earth position + 180 degrees
    const earth = getHeliocentricVector("Earth", T);
    const long = radToDeg(Math.atan2(-earth.y, -earth.x));
    return normalizeDegrees(long);
  }

  if (name === "Moon") {
    // Moon uses specific Lunar Theory (simplified Brown's or ELP2000)
    // Mean Longitude
    const L = normalizeDegrees(218.3164477 + 481267.88123421 * T);
    // Mean Anomaly of Moon
    const M_prime = degToRad(normalizeDegrees(134.9633964 + 477198.8675055 * T));
    // Mean Elongation of Moon
    const D = degToRad(normalizeDegrees(297.8501921 + 445267.1114034 * T));
    // Latitudinal argument
    const F = degToRad(normalizeDegrees(93.2720950 + 483202.0175381 * T));
    // Mean Anomaly of Sun
    const M = degToRad(normalizeDegrees(357.52911 + 35999.05029 * T));

    // Perturbations terms
    let moonLong = L +
      6.289 * Math.sin(M_prime) -
      1.274 * Math.sin(M_prime - 2 * D) +
      0.658 * Math.sin(2 * D) +
      0.214 * Math.sin(2 * M_prime) -
      0.186 * Math.sin(M) -
      0.114 * Math.sin(2 * F) +
      0.058 * Math.sin(2 * M_prime - 2 * D) +
      0.057 * Math.sin(M_prime - 2 * D + M) +
      0.053 * Math.sin(M_prime + 2 * D) +
      0.046 * Math.sin(2 * D - M);

    return normalizeDegrees(moonLong);
  }

  if (name === "Rahu") {
    // Ascending Node of Lunar Orbit (Retrogresses ~19.34 degrees/year)
    // Mean Rahu
    const node = 125.044522 - 1934.136261 * T + 0.002078 * T * T;
    return normalizeDegrees(node);
  }

  if (name === "Ketu") {
    // Ketu is always exactly 180 degrees opposite of Rahu
    const rahu = getTropicalPlanetLongitude("Rahu", T);
    return normalizeDegrees(rahu + 180.0);
  }

  // Geocentric position for Mercury, Venus, Mars, Jupiter, Saturn
  const planetHeliocentric = getHeliocentricVector(name, T);
  const earthHeliocentric = getHeliocentricVector("Earth", T);

  // Vector from Earth to Planet
  const X = planetHeliocentric.x - earthHeliocentric.x;
  const Y = planetHeliocentric.y - earthHeliocentric.y;
  const Z = planetHeliocentric.z - earthHeliocentric.z;

  const long = radToDeg(Math.atan2(Y, X));
  return normalizeDegrees(long);
}

// Check if a planet is retrograde (simple numerical derivative checking change over 0.1 days)
export function checkPlanetIsRetrograde(name: string, T: number): boolean {
  if (name === "Sun" || name === "Moon" || name === "Rahu" || name === "Ketu") {
    // Lunar nodes are generally retrograde in mean calculation, Sun and Moon are never retrograde
    if (name === "Rahu" || name === "Ketu") return true;
    return false;
  }
  
  const step = 0.0001; // Representing a very small step in centuries (~3.6 days)
  const p1 = getTropicalPlanetLongitude(name, T - step);
  const p2 = getTropicalPlanetLongitude(name, T);
  
  let diff = p2 - p1;
  if (diff < -180) diff += 360;
  if (diff > 180) diff -= 360;
  
  return diff < 0;
}

// Calculate Ascendant (Lagna) Ecliptic Longitude (Tropical)
export function calculateTropicalLagna(jd: number, latitude: number, longitude: number): number {
  const T = (jd - 2451545.0) / 36525.0;

  // 1. Calculate Greenwich Mean Sidereal Time (GMST) in degrees
  // GMST formulation in degrees
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + T * T * (0.000387933 - T / 38710000.0);
  gmst = normalizeDegrees(gmst);

  // 2. Calculate Local Sidereal Time (LST) in degrees
  const lst = normalizeDegrees(gmst + longitude);

  // 3. Obliquity of reference ecliptic
  const epsilon = degToRad(23.4392911 - 0.0130042 * T);

  // 4. Calculate Lagna Ecliptic Longitude
  const θ = degToRad(lst);
  const φ = degToRad(latitude);

  // Tan(Lagna) = sin(θ) / (cos(θ)*cos(ε) - tan(φ)*sin(ε))
  const num = Math.sin(θ);
  const den = Math.cos(θ) * Math.cos(epsilon) - Math.tan(φ) * Math.sin(epsilon);

  let lagnaLong = radToDeg(Math.atan2(num, den));
  return normalizeDegrees(lagnaLong);
}

// Calculate D9 Navamsha Sign for a given Sidereal Position
// In Vedic astrology, each of the 12 signs is divided into 9 segments of 3°20' each.
// Aries starts at Aries, Taurus starts at Capricorn, Gemini starts at Libra, Cancer starts at Cancer,
// Leo starts at Aries, Virgo starts at Capricorn, Libra starts at Libra, Scorpio starts at Cancer, and so on.
export function calculateNavamshaRashi(longitude: number): { rashi: string; index: number } {
  const deg = longitude % 360;
  const currentRashiIndex = Math.floor(deg / 30);
  const degreeInRashi = deg % 30;
  
  // Segment index: 0 to 8 representing the 9 subdivisions
  const segment = Math.floor(degreeInRashi / 3.3333333);
  
  // Base sign calculation based on element of rashi
  let baseIndex = 0;
  const elementGroup = currentRashiIndex % 4; // 0 = Fire, 1 = Earth, 2 = Air, 3 = Water
  
  if (elementGroup === 0) {
    // Fire signs (Aries, Leo, Sagittarius) start from Aries (0)
    baseIndex = 0;
  } else if (elementGroup === 1) {
    // Earth signs (Taurus, Virgo, Capricorn) start from Capricorn (9)
    baseIndex = 9;
  } else if (elementGroup === 2) {
    // Air signs (Gemini, Libra, Aquarius) start from Libra (6)
    baseIndex = 6;
  } else {
    // Water signs (Cancer, Scorpio, Pisces) start from Cancer (3)
    baseIndex = 3;
  }
  
  const navamshaIndex = (baseIndex + segment) % 12;
  return {
    rashi: RASHIS[navamshaIndex],
    index: navamshaIndex
  };
}

// Main Kundli Report Generator
export function generateKundli(
  name: string,
  birthPlace: string,
  dateString: string, // YYYY-MM-DD
  timeString: string, // HH:MM
  latitude: number,
  longitude: number,
  timezone: number // Decimal hours, e.g. IST is +5.5, EST is -5
): KundliData {
  const [yearStr, monthStr, dayStr] = dateString.split("-");
  const [hourStr, minuteStr] = timeString.split(":");
  
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);
  const day = parseInt(dayStr);
  const hour = parseInt(hourStr);
  const minute = parseInt(minuteStr);

  const jd = calculateJulianDate(year, month, day, hour, minute, timezone);
  const T = (jd - 2451545.0) / 36525.0;
  const ayanamsa = calculateLahiriAyanamsa(jd);

  // 1. Calculate Lagna (Sidereal)
  const tropicalLagna = calculateTropicalLagna(jd, latitude, longitude);
  const siderealLagna = normalizeDegrees(tropicalLagna - ayanamsa);
  const lagnaRashiIndex = Math.floor(siderealLagna / 30);
  const lagnaDegree = siderealLagna % 30;
  const lagnaNakIndex = Math.floor(siderealLagna / 13.333333);
  const lagnaNakPada = Math.floor((siderealLagna % 13.333333) / 3.333333) + 1;

  // 2. Generate Houses Array (Whole Sign Houses - Lagna Rashi is the 1st House)
  const houses: { houseNumber: number; rashiIndex: number; rashiName: string }[] = [];
  for (let h = 1; h <= 12; h++) {
    const houseRashiIndex = (lagnaRashiIndex + (h - 1)) % 12;
    houses.push({
      houseNumber: h,
      rashiIndex: houseRashiIndex,
      rashiName: RASHIS[houseRashiIndex]
    });
  }

  // 3. Calculate Planets Array
  const planetsToCalc = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
  const planets: Record<string, PlanetPosition> = {};

  planetsToCalc.forEach((pName) => {
    const tropicalLong = getTropicalPlanetLongitude(pName, T);
    const siderealLong = normalizeDegrees(tropicalLong - ayanamsa);
    
    const rashiIndex = Math.floor(siderealLong / 30);
    const rashiDegree = siderealLong % 30;
    const nakIndex = Math.floor(siderealLong / 13.333333);
    const nakPada = Math.floor((siderealLong % 13.333333) / 3.333333) + 1;
    
    // Find house placement (using whole sign)
    // House = (Planet Rashi Index - Lagna Rashi Index + 12) % 12 + 1
    const pInHouse = (rashiIndex - lagnaRashiIndex + 12) % 12 + 1;
    
    const navamsha = calculateNavamshaRashi(siderealLong);
    const retro = checkPlanetIsRetrograde(pName, T);

    planets[pName] = {
      name: pName,
      tropicalLongitude: tropicalLong,
      longitude: siderealLong,
      formattedLongitude: formatDegree(siderealLong),
      rashi: RASHIS[rashiIndex],
      rashiIndex,
      rashiDegree,
      nakshatra: NAKSHATRAS[nakIndex],
      nakshatraIndex: nakIndex,
      nakshatraPada: nakPada,
      house: pInHouse,
      navamshaRashi: navamsha.rashi,
      navamshaRashiIndex: navamsha.index,
      isRetrograde: retro
    };
  });

  // 4. Calculate Vedic Aspect Analysis (Traditional Drishti)
  const aspects: string[] = [];
  
  // Helper to add aspect message
  const makeAspect = (pName: string, pSign: string, houseNum: number, rashiNum: number, relation: string) => {
    const sanskritP = PLANET_SANSKRIT[pName] || pName;
    const houseSanskritWord = getHouseSignificance(houseNum).split(",")[0];
    return `${pName} (${sanskritP}) casts standard aspects in transit/chart onto House ${houseNum} (${RASHIS[rashiNum]}, connected to ${houseSanskritWord}) via standard ${relation} aspect.`;
  };

  // Standard Vedic aspects:
  // All planets aspect the 7th house from their placement.
  // Special aspects:
  // Mars: 4th, 7th, 8th Houses
  // Jupiter: 5th, 7th, 9th Houses
  // Saturn: 3rd, 7th, 10th Houses
  // Rahu & Ketu: 5th, 7th, 9th Houses (commonly accepted in most schools of Vedic astrology)
  Object.values(planets).forEach((p) => {
    const baseHouse = p.house; // 1 to 12
    
    const addAspect = (aspectValue: number, ruleName: string) => {
      const targetHouse = (baseHouse + (aspectValue - 1) - 1) % 12 + 1;
      const targetRashiIndex = (lagnaRashiIndex + (targetHouse - 1)) % 12;
      aspects.push(`${p.name} in House ${baseHouse} aspects House ${targetHouse} (${RASHIS[targetRashiIndex]}) with ${ruleName} aspect.`);
    };

    // Standard 7th aspect
    addAspect(7, "7th (Full Opposition)");

    // Special Aspects
    if (p.name === "Mars") {
      addAspect(4, "4th (Caturtha Drishti)");
      addAspect(8, "8th (Ashtama Drishti)");
    } else if (p.name === "Jupiter") {
      addAspect(5, "5th (Panchama Drishti)");
      addAspect(9, "9th (Navama Drishti)");
    } else if (p.name === "Saturn") {
      addAspect(3, "3rd (Tritiya Drishti)");
      addAspect(10, "10th (Dashama Drishti)");
    } else if (p.name === "Rahu" || p.name === "Ketu") {
      addAspect(5, "5th (Trine Aspect)");
      addAspect(9, "9th (Trine Aspect)");
    }
  });

  return {
    name,
    birthDate: dateString,
    birthTime: timeString,
    birthPlace,
    latitude,
    longitude,
    timezone,
    julianDate: jd,
    ayanamsa,
    lagna: {
      longitude: siderealLagna,
      formattedLongitude: formatDegree(siderealLagna),
      rashi: RASHIS[lagnaRashiIndex],
      rashiIndex: lagnaRashiIndex,
      rashiDegree: lagnaDegree,
      nakshatra: NAKSHATRAS[lagnaNakIndex],
      nakshatraPada: lagnaNakPada
    },
    planets,
    houses,
    aspects
  };
}

// Help describe houses significances in Vedic astrology
export function getHouseSignificance(houseNum: number): string {
  const significances = [
    "Lagna (Self, physical appearance, life path, health, beginnings)",
    "Dhana (Wealth, family, speech, liquid assets, food, learning)",
    "Sahaja (Siblings, courage, efforts, communication, short travels, manual skills)",
    "Bandhu (Mother, home, nested happiness, vehicle, real estate, emotional security)",
    "Putra (Children, intellect, intelligence, past dynamic karma, romance, speculation)",
    "Ari (Competitions, debts, health obstacles, service, enemies, daily routines)",
    "Yuvati (Partnership, marriage, commercial deals, foreign contracts, other people)",
    "Randhra (Longevity, transformations, sudden shifts, secret subjects, occult, unearned wealth)",
    "Dharma (Higher wisdom, luck, father, gurus, long destiny, religious practices)",
    "Karma (Profession, fame, administrative status, career milestones, outer operations)",
    "Labha (Social circles, friendships, large gains, stream of incomes, elder siblings)",
    "Vyaya (Dissolution, foreign trips, spiritual retreats, beds, isolation, expenses, moksha)"
  ];
  return significances[houseNum - 1] || "";
}
