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

export interface PratyantardashaPeriod {
  planet: string;
  code: string; // e.g., "MER", "KET", "VEN"
  startDate: Date;
  endDate: Date;
  formattedEndDate: string; // e.g., "1/ 3/91"
}

export interface AntardashaPeriod {
  mahadashaPlanet: string;
  mahadashaCode: string; // e.g., "RAH"
  antardashaPlanet: string;
  antardashaCode: string; // e.g., "MER"
  startDate: Date;
  endDate: Date;
  formattedStartDate: string; // e.g., "6/11/90"
  formattedEndDate: string;   // e.g., "7/ 5/93"
  pratyantardashas: PratyantardashaPeriod[];
}

export interface MahadashaPeriod {
  planet: string;
  code: string;
  years: number;
  startDate: Date;
  endDate: Date;
  formattedStartDate: string;
  formattedEndDate: string;
  antardashas: AntardashaPeriod[];
}

export interface VimshottariDashaData {
  birthNakshatraLord: string;
  birthNakshatraCode: string;
  balanceYears: number;
  balanceText: string; // e.g., "6Y 5M 29D"
  mahadashas: MahadashaPeriod[];
  allAntardashas: AntardashaPeriod[];
}

export type YogaDoshaCategory =
  | "Mahapurusha"
  | "Raja Yoga"
  | "Dhana Yoga"
  | "Lunar & Solar"
  | "Jnana & Special"
  | "Vargottama & Nabhasa"
  | "Dosha";

export type YogaDoshaStrength = "High" | "Moderate" | "Cancelled / Mitigated";

export interface YogaDoshaItem {
  id: string;
  name: string;
  sanskritName: string;
  type: "YOGA" | "DOSHA";
  category: YogaDoshaCategory;
  strength: YogaDoshaStrength;
  isCancelled?: boolean;
  cancellationReason?: string;
  involvedPlanets: string[];
  involvedHouses: number[];
  conditionMet: string;
  effects: string;
  remedy?: string;
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
  vimshottariDasha: VimshottariDashaData;
  yogasAndDoshas: YogaDoshaItem[];
}

// Vimshottari Dasha Sequence & Durations (120-Year Cycle)
export const VIMSHOTTARI_SEQUENCE: { planet: string; code: string; years: number }[] = [
  { planet: "Ketu", code: "KET", years: 7 },
  { planet: "Venus", code: "VEN", years: 20 },
  { planet: "Sun", code: "SUN", years: 6 },
  { planet: "Moon", code: "MON", years: 10 },
  { planet: "Mars", code: "MAR", years: 7 },
  { planet: "Rahu", code: "RAH", years: 18 },
  { planet: "Jupiter", code: "JUP", years: 16 },
  { planet: "Saturn", code: "SAT", years: 19 },
  { planet: "Mercury", code: "MER", years: 17 }
];

// Format date in classic horoscope printout format: D/ M/YY (e.g., "6/11/90", "7/ 5/93", "25/ 5/94")
export function formatDashaDate(date: Date): string {
  const d = date.getUTCDate();
  const m = date.getUTCMonth() + 1;
  const yy = String(date.getUTCFullYear() % 100).padStart(2, "0");
  const mStr = m < 10 ? ` ${m}` : `${m}`;
  return `${d}/${mStr}/${yy}`;
}

// High-precision Jean Meeus Chapter 47 tropical Moon longitude (for Vimshottari Dasha ephemeris accuracy)
function getMeeusMoonTropical(jdUT: number): number {
  const jdTT = jdUT + 57.5 / 86400.0;
  const T = (jdTT - 2451545.0) / 36525.0;

  const L_prime = normalizeDegrees(
    218.3164477 +
      481267.88123421 * T -
      0.0015786 * T * T +
      (T * T * T) / 538841 -
      (T * T * T * T) / 65194000
  );
  const D = normalizeDegrees(
    297.8501921 +
      445267.1114034 * T -
      0.0018819 * T * T +
      (T * T * T) / 545868 -
      (T * T * T * T) / 113065000
  );
  const M = normalizeDegrees(
    357.5291092 +
      35999.0502909 * T -
      0.0001536 * T * T +
      (T * T * T) / 24490000
  );
  const M_prime = normalizeDegrees(
    134.9633964 +
      477198.8675055 * T +
      0.0087414 * T * T +
      (T * T * T) / 69699 -
      (T * T * T * T) / 14712000
  );
  const F = normalizeDegrees(
    93.272095 +
      483202.0175233 * T -
      0.0036539 * T * T -
      (T * T * T) / 3526000 +
      (T * T * T * T) / 863310000
  );

  const Dr = degToRad(D);
  const Mr = degToRad(M);
  const Mpr = degToRad(M_prime);
  const Fr = degToRad(F);
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;

  let sumL = 0;
  sumL += 6288774 * Math.sin(Mpr);
  sumL += 1274027 * Math.sin(2 * Dr - Mpr);
  sumL += 658314 * Math.sin(2 * Dr);
  sumL += 213618 * Math.sin(2 * Mpr);
  sumL += -185116 * E * Math.sin(Mr);
  sumL += -114332 * Math.sin(2 * Fr);
  sumL += 58793 * Math.sin(2 * Dr - 2 * Mpr);
  sumL += 57066 * E * Math.sin(2 * Dr - Mr - Mpr);
  sumL += 53322 * Math.sin(2 * Dr + Mpr);
  sumL += 45758 * E * Math.sin(2 * Dr - Mr);
  sumL += -40923 * E * Math.sin(Mr - Mpr);
  sumL += -34720 * Math.sin(Dr);
  sumL += -30383 * E * Math.sin(Mr + Mpr);
  sumL += 15327 * Math.sin(2 * Dr - 2 * Fr);
  sumL += -12528 * Math.sin(Mpr + 2 * Fr);
  sumL += 10980 * Math.sin(Mpr - 2 * Fr);
  sumL += 10675 * Math.sin(4 * Dr - Mpr);
  sumL += 10034 * Math.sin(3 * Mpr);
  sumL += 8548 * Math.sin(4 * Dr - 2 * Mpr);
  sumL += -7888 * E * Math.sin(2 * Dr + Mr - Mpr);
  sumL += -6766 * E * Math.sin(2 * Dr + Mr);
  sumL += -5163 * Math.sin(Dr - Mpr);
  sumL += 4987 * E * Math.sin(Dr + Mr);
  sumL += 4036 * E * Math.sin(2 * Dr - Mr + Mpr);
  sumL += 3994 * Math.sin(2 * Dr + 2 * Mpr);
  sumL += 3861 * Math.sin(4 * Dr);
  sumL += 3665 * Math.sin(2 * Dr - 3 * Mpr);
  sumL += -2689 * E * Math.sin(Mr - 2 * Mpr);
  sumL += -2602 * Math.sin(2 * Dr - Mpr + 2 * Fr);
  sumL += 2390 * E * Math.sin(2 * Dr - Mr - 2 * Mpr);
  sumL += -2348 * Math.sin(Dr + Mpr);
  sumL += 2236 * E * E * Math.sin(2 * Dr - 2 * Mr);
  sumL += -2120 * E * Math.sin(Mr + 2 * Mpr);
  sumL += -2069 * E * E * Math.sin(2 * Mr);
  sumL += 2048 * E * E * Math.sin(2 * Dr - 2 * Mr - Mpr);
  sumL += -1773 * Math.sin(2 * Dr + Mpr - 2 * Fr);
  sumL += -1595 * Math.sin(2 * Dr + 2 * Fr);
  sumL += 1215 * E * Math.sin(4 * Dr - Mr - Mpr);
  sumL += -1110 * Math.sin(2 * Mpr + 2 * Fr);
  sumL += -892 * Math.sin(3 * Dr - Mpr);
  sumL += -810 * E * Math.sin(2 * Dr + Mr + Mpr);
  sumL += 759 * E * Math.sin(4 * Dr - Mr - 2 * Mpr);
  sumL += -713 * E * E * Math.sin(2 * Mr - Mpr);
  sumL += -700 * E * E * Math.sin(2 * Dr + 2 * Mr - Mpr);
  sumL += 691 * E * Math.sin(2 * Dr + Mr - 2 * Mpr);
  sumL += 596 * E * Math.sin(2 * Dr - Mr - 2 * Fr);
  sumL += 549 * Math.sin(4 * Dr + Mpr);
  sumL += 537 * Math.sin(4 * Mpr);
  sumL += 520 * E * Math.sin(4 * Dr - Mr);
  sumL += -487 * Math.sin(Dr - 2 * Mpr);
  sumL += -399 * E * Math.sin(2 * Dr + Mr - 2 * Fr);
  sumL += -381 * Math.sin(2 * Mpr - 2 * Fr);
  sumL += 351 * E * Math.sin(Dr + Mr + Mpr);
  sumL += -340 * Math.sin(3 * Dr - 2 * Mpr);
  sumL += 330 * Math.sin(4 * Dr - 3 * Mpr);
  sumL += 327 * E * Math.sin(2 * Dr - Mr + 2 * Mpr);
  sumL += -323 * E * E * Math.sin(2 * Mr + Mpr);
  sumL += 299 * E * Math.sin(Dr + Mr - Mpr);
  sumL += 294 * Math.sin(2 * Dr + 3 * Mpr);

  const A1 = degToRad(normalizeDegrees(119.75 + 131.849 * T));
  const A2 = degToRad(normalizeDegrees(53.09 + 479264.29 * T));
  sumL +=
    3958 * Math.sin(A1) +
    1962 * Math.sin(degToRad(L_prime - F)) +
    318 * Math.sin(A2);

  return normalizeDegrees(L_prime + sumL / 1000000);
}

// Compute daily-interpolated sidereal Moon longitude at local birth date/time (standard Lahiri ephemeris interpolation)
function computeDashaMoonSidereal(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  birthHour: number,
  birthMinute: number,
  tzOffset: number = 5.5
): number {
  const jd0 =
    Date.UTC(birthYear, birthMonth - 1, birthDay, 0, 0, 0) / 86400000 +
    2440587.5 -
    tzOffset / 24.0;
  const jd1 = jd0 + 1.0;
  const dayFraction = (birthHour + birthMinute / 60.0) / 24.0;

  const m0 = getMeeusMoonTropical(jd0);
  let m1 = getMeeusMoonTropical(jd1);
  if (m1 < m0) m1 += 360.0;
  const tropMoon = normalizeDegrees(m0 + dayFraction * (m1 - m0));

  const jdBirth = jd0 + dayFraction;
  const T = (jdBirth - 2451545.0) / 36525.0;
  const ayanamsa = normalizeDegrees(23.84695 + 1.396 * T + 0.000308 * T * T);
  return normalizeDegrees(tropMoon - ayanamsa);
}

// Convert classical 360-day Savana calendar value (12 months * 30 days) to a UTC Date
function days360ToDate(val360: number): Date {
  const whole = Math.floor(val360 + 1e-9);
  const y = Math.floor(whole / 360);
  const rem = whole - y * 360;
  const m = Math.floor(rem / 30) + 1;
  const d = (rem % 30) + 1;
  return new Date(Date.UTC(y, m - 1, d));
}

// Calculate full 120-year Vimshottari Dasha periods from Moon's sidereal longitude & birth date/time
export function calculateVimshottariDasha(
  moonSiderealLongitude: number,
  birthDateString: string, // YYYY-MM-DD
  birthTimeString: string, // HH:MM
  timezone: number = 5.5
): VimshottariDashaData {
  const [yearStr, monthStr, dayStr] = birthDateString.split("-");
  const [hourStr, minuteStr] = (birthTimeString || "12:00").split(":");
  const birthYear = parseInt(yearStr, 10) || 1990;
  const birthMonth = parseInt(monthStr, 10) || 1;
  const birthDay = parseInt(dayStr, 10) || 1;
  const birthHour = parseInt(hourStr, 10) || 0;
  const birthMinute = parseInt(minuteStr, 10) || 0;

  // Use high-precision daily-interpolated Moon longitude when birth date/time are provided
  const accurateMoonSidereal = birthDateString
    ? computeDashaMoonSidereal(
        birthYear,
        birthMonth,
        birthDay,
        birthHour,
        birthMinute,
        timezone
      )
    : moonSiderealLongitude;

  const nakshatraSpan = 360 / 27; // 13.333333333333334 degrees
  const normalizedMoon = normalizeDegrees(accurateMoonSidereal);
  const nakshatraIndex = Math.floor(normalizedMoon / nakshatraSpan);
  const degreeInNakshatra = normalizedMoon % nakshatraSpan;
  const elapsedFraction = degreeInNakshatra / nakshatraSpan;
  const remainingFraction = 1 - elapsedFraction;

  const startLordIndex = nakshatraIndex % 9;
  const startLord = VIMSHOTTARI_SEQUENCE[startLordIndex];
  const balanceYears = startLord.years * remainingFraction;

  // Format human-readable balance text in 360-day (12m x 30d) Savana units
  const balWholeYears = Math.floor(balanceYears);
  const balRemMonths = (balanceYears - balWholeYears) * 12;
  const balWholeMonths = Math.floor(balRemMonths);
  const balDays = Math.floor((balRemMonths - balWholeMonths) * 30);
  const balanceText = `${balWholeYears}Y ${balWholeMonths}M ${balDays}D`;

  // Classical 360-day Savana calendar timestamp at birth
  const birth360 =
    birthYear * 360 +
    (birthMonth - 1) * 30 +
    (birthDay - 1) +
    (birthHour + birthMinute / 60.0) / 24.0;

  // Theoretical start of the birth Mahadasha (before birth) in 360-day units
  const elapsedYears = startLord.years * elapsedFraction;
  let currentMahaStart360 = birth360 - elapsedYears * 360;

  const mahadashas: MahadashaPeriod[] = [];
  const allAntardashas: AntardashaPeriod[] = [];

  for (let mOffset = 0; mOffset < 9; mOffset++) {
    const mahaIdx = (startLordIndex + mOffset) % 9;
    const mahaInfo = VIMSHOTTARI_SEQUENCE[mahaIdx];
    const mahaStart360 = currentMahaStart360;
    const mahaEnd360 = mahaStart360 + mahaInfo.years * 360;

    let currentAntarStart360 = mahaStart360;
    const antardashas: AntardashaPeriod[] = [];

    for (let aOffset = 0; aOffset < 9; aOffset++) {
      const antarIdx = (mahaIdx + aOffset) % 9;
      const antarInfo = VIMSHOTTARI_SEQUENCE[antarIdx];
      const antarYears = (mahaInfo.years * antarInfo.years) / 120.0;
      const antarStart360 = currentAntarStart360;
      const antarEnd360 = antarStart360 + antarYears * 360;

      // Only include Antardashas that end after birth
      if (antarEnd360 > birth360) {
        const effectiveAntarStart360 = Math.max(antarStart360, birth360);
        let currentPratyantarStart360 = antarStart360;
        const pratyantardashas: PratyantardashaPeriod[] = [];

        for (let pOffset = 0; pOffset < 9; pOffset++) {
          const pratyantarIdx = (antarIdx + pOffset) % 9;
          const pratyantarInfo = VIMSHOTTARI_SEQUENCE[pratyantarIdx];
          const pratyantarYears = (antarYears * pratyantarInfo.years) / 120.0;
          const pratyantarStart360 = currentPratyantarStart360;
          const pratyantarEnd360 = pratyantarStart360 + pratyantarYears * 360;

          if (pratyantarEnd360 > birth360) {
            const effectivePratyantarStart = days360ToDate(
              Math.max(pratyantarStart360, birth360)
            );
            const pratyantarEnd = days360ToDate(pratyantarEnd360);
            pratyantardashas.push({
              planet: pratyantarInfo.planet,
              code: pratyantarInfo.code,
              startDate: effectivePratyantarStart,
              endDate: pratyantarEnd,
              formattedEndDate: formatDashaDate(pratyantarEnd)
            });
          }

          currentPratyantarStart360 = pratyantarEnd360;
        }

        const effectiveStart = days360ToDate(effectiveAntarStart360);
        const effectiveEnd = days360ToDate(antarEnd360);
        const antarPeriod: AntardashaPeriod = {
          mahadashaPlanet: mahaInfo.planet,
          mahadashaCode: mahaInfo.code,
          antardashaPlanet: antarInfo.planet,
          antardashaCode: antarInfo.code,
          startDate: effectiveStart,
          endDate: effectiveEnd,
          formattedStartDate: formatDashaDate(effectiveStart),
          formattedEndDate: formatDashaDate(effectiveEnd),
          pratyantardashas
        };

        antardashas.push(antarPeriod);
        allAntardashas.push(antarPeriod);
      }

      currentAntarStart360 = antarEnd360;
    }

    const effectiveMahaStart = days360ToDate(Math.max(mahaStart360, birth360));
    const effectiveMahaEnd = days360ToDate(mahaEnd360);
    mahadashas.push({
      planet: mahaInfo.planet,
      code: mahaInfo.code,
      years: mahaInfo.years,
      startDate: effectiveMahaStart,
      endDate: effectiveMahaEnd,
      formattedStartDate: formatDashaDate(effectiveMahaStart),
      formattedEndDate: formatDashaDate(effectiveMahaEnd),
      antardashas
    });

    currentMahaStart360 = mahaEnd360;
  }

  return {
    birthNakshatraLord: startLord.planet,
    birthNakshatraCode: startLord.code,
    balanceYears,
    balanceText,
    mahadashas,
    allAntardashas
  };
}

// Zodiac Signs List (Hindi/Vedic Rasi names in English script)
export const RASHIS = [
  "Mesha", "Vrushabha", "Mithuna", "Karka", "Simha", "Kanya",
  "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"
];

// Zodiac Rulers (Traditional Planetary Rulers)
export const RASHI_RULERS: Record<string, string> = {
  "Mesha": "Mars",
  "Vrushabha": "Venus",
  "Mithuna": "Mercury",
  "Karka": "Moon",
  "Simha": "Sun",
  "Kanya": "Mercury",
  "Tula": "Venus",
  "Vrishchika": "Mars",
  "Dhanu": "Jupiter",
  "Makara": "Saturn",
  "Kumbha": "Saturn",
  "Meena": "Jupiter"
};

// Sanskrit / Traditional Names of Rashis
export const RASHI_SANSKRIT = [
  "Mesha", "Vrushabha", "Mithuna", "Karka", "Simha", "Kanya",
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

  // Tan(Lagna) = cos(θ) / (-sin(θ)*cos(ε) - tan(φ)*sin(ε))
  const num = Math.cos(θ);
  const den = -Math.sin(θ) * Math.cos(epsilon) - Math.tan(φ) * Math.sin(epsilon);

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

  // 5. Calculate Vimshottari Dasha
  const vimshottariDasha = calculateVimshottariDasha(
    planets.Moon.longitude,
    dateString,
    timeString,
    timezone
  );

  // 6. Calculate Classical Vedic Yogas & Doshas
  const lagnaNavamsha = calculateNavamshaRashi(siderealLagna);
  const yogasAndDoshas = calculateYogasAndDoshas(
    lagnaRashiIndex,
    lagnaDegree,
    lagnaNavamsha.index,
    planets,
    houses,
    hour
  );

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
    aspects,
    vimshottariDasha,
    yogasAndDoshas
  };
}

// --- Planetary Dignities & Classical Yoga/Dosha Engine ---

const OWN_SIGNS: Record<string, string[]> = {
  Sun: ["Leo"],
  Moon: ["Cancer"],
  Mars: ["Aries", "Scorpio"],
  Mercury: ["Gemini", "Virgo"],
  Jupiter: ["Sagittarius", "Pisces"],
  Venus: ["Taurus", "Libra"],
  Saturn: ["Capricorn", "Aquarius"],
  Rahu: ["Aquarius"],
  Ketu: ["Scorpio"]
};

const EXALTED_SIGNS: Record<string, string> = {
  Sun: "Aries",
  Moon: "Taurus",
  Mars: "Capricorn",
  Mercury: "Virgo",
  Jupiter: "Cancer",
  Venus: "Pisces",
  Saturn: "Libra",
  Rahu: "Taurus",
  Ketu: "Scorpio"
};

const DEBILITATED_SIGNS: Record<string, string> = {
  Sun: "Libra",
  Moon: "Scorpio",
  Mars: "Cancer",
  Mercury: "Pisces",
  Jupiter: "Capricorn",
  Venus: "Virgo",
  Saturn: "Aries",
  Rahu: "Scorpio",
  Ketu: "Taurus"
};

// Planet that gets exalted in a given Rashi (used for Neecha Bhanga Raja Yoga)
const EXALTATION_LORD_OF_SIGN: Record<string, string> = {
  Aries: "Sun",
  Taurus: "Moon",
  Cancer: "Jupiter",
  Virgo: "Mercury",
  Libra: "Saturn",
  Capricorn: "Mars",
  Pisces: "Venus"
};

const NATURAL_BENEFICS = ["Jupiter", "Venus", "Mercury", "Moon"];
const PURE_BENEFICS = ["Jupiter", "Venus", "Mercury"];
const NATURAL_MALEFICS = ["Saturn", "Mars", "Rahu", "Ketu", "Sun"];

function isOwnOrExalted(planet: PlanetPosition): boolean {
  const own = OWN_SIGNS[planet.name]?.includes(planet.rashi) ?? false;
  const exalted = EXALTED_SIGNS[planet.name] === planet.rashi;
  return own || exalted;
}

function isDebilitated(planet: PlanetPosition): boolean {
  return DEBILITATED_SIGNS[planet.name] === planet.rashi;
}

// Relative house from baseHouse (1-indexed: 1 means same house, 7 means opposite)
function getRelativeHouse(fromHouse: number, toHouse: number): number {
  return ((toHouse - fromHouse + 12) % 12) + 1;
}

// Check if planet A casts a Parashari Drishti (aspect) on targetHouse
function doesPlanetAspectHouse(planet: PlanetPosition, targetHouse: number): boolean {
  const rel = getRelativeHouse(planet.house, targetHouse);
  if (rel === 7) return true;
  if (planet.name === "Mars" && (rel === 4 || rel === 8)) return true;
  if (planet.name === "Jupiter" && (rel === 5 || rel === 9)) return true;
  if (planet.name === "Saturn" && (rel === 3 || rel === 10)) return true;
  if ((planet.name === "Rahu" || planet.name === "Ketu") && (rel === 5 || rel === 9)) return true;
  return false;
}

// Check if two planets are connected by conjunction, mutual aspect, or sign exchange (Parivartana)
function checkPlanetaryConnection(
  p1: PlanetPosition,
  p2: PlanetPosition
): { connected: boolean; relationType: string } {
  if (p1.name === p2.name) return { connected: false, relationType: "" };
  if (p1.house === p2.house) {
    return { connected: true, relationType: `conjunct in House ${p1.house} (${p1.rashi})` };
  }
  if (RASHI_RULERS[p1.rashi] === p2.name && RASHI_RULERS[p2.rashi] === p1.name) {
    return { connected: true, relationType: `in Parivartana (mutual sign exchange between ${p1.rashi} and ${p2.rashi})` };
  }
  if (doesPlanetAspectHouse(p1, p2.house) && doesPlanetAspectHouse(p2, p1.house)) {
    return { connected: true, relationType: `in mutual Drishti aspect across Houses ${p1.house} and ${p2.house}` };
  }
  return { connected: false, relationType: "" };
}

export function calculateYogasAndDoshas(
  lagnaRashiIndex: number,
  lagnaDegree: number,
  lagnaNavamshaIndex: number,
  planets: Record<string, PlanetPosition>,
  houses: { houseNumber: number; rashiIndex: number; rashiName: string }[],
  birthHour: number = 12
): YogaDoshaItem[] {
  const results: YogaDoshaItem[] = [];
  const kendras = [1, 4, 7, 10];
  const trikonas = [1, 5, 9];
  const dusthanas = [6, 8, 12];
  const upachayas = [3, 6, 10, 11];

  // Map house number (1..12) to its ruling planet name
  const houseLords: Record<number, string> = {};
  houses.forEach((h) => {
    houseLords[h.houseNumber] = RASHI_RULERS[h.rashiName];
  });

  const sun = planets.Sun;
  const moon = planets.Moon;
  const mars = planets.Mars;
  const mercury = planets.Mercury;
  const jupiter = planets.Jupiter;
  const venus = planets.Venus;
  const saturn = planets.Saturn;
  const rahu = planets.Rahu;
  const ketu = planets.Ketu;

  const classicalSeven = [sun, moon, mars, mercury, jupiter, venus, saturn];

  // ============================================================================
  // CATEGORY A: PANCHA MAHAPURUSHA YOGAS (5 Great Person Yogas)
  // ============================================================================
  const mahapurushaSpecs: {
    planet: PlanetPosition;
    name: string;
    sanskrit: string;
    effects: string;
  }[] = [
    {
      planet: mars,
      name: "Ruchaka Mahapurusha Yoga",
      sanskrit: "रुचक महापुरुष योग",
      effects: "Bestows extraordinary courage, physical vitality, executive command, and victory over competitors. Indicates leadership in engineering, defense, real estate, or entrepreneurship."
    },
    {
      planet: mercury,
      name: "Bhadra Mahapurusha Yoga",
      sanskrit: "भद्र महापुरुष योग",
      effects: "Grants razor-sharp intellect, eloquence, analytical mastery, and commercial acumen. Favors excellence in finance, writing, technology, diplomacy, and scholarship."
    },
    {
      planet: jupiter,
      name: "Hamsa Mahapurusha Yoga",
      sanskrit: "हंस महापुरुष योग",
      effects: "Confers spiritual wisdom, righteous authority, moral integrity, and universal respect. Brings grace, higher learning, and prosperity through ethical leadership."
    },
    {
      planet: venus,
      name: "Malavya Mahapurusha Yoga",
      sanskrit: "मालव्य महापुरुष योग",
      effects: "Brings artistic brilliance, charisma, material luxury, harmonious relationships, and refined Vehicles/comforts. Elevates fortune through creativity and estética."
    },
    {
      planet: saturn,
      name: "Shasha Mahapurusha Yoga",
      sanskrit: "शश महापुरुष योग",
      effects: "Grants organizational mastery, political/institutional authority, discipline, and command over large populations or industries through perseverance."
    }
  ];

  mahapurushaSpecs.forEach((spec) => {
    if (kendras.includes(spec.planet.house) && isOwnOrExalted(spec.planet)) {
      const dignity = EXALTED_SIGNS[spec.planet.name] === spec.planet.rashi ? "exalted" : "in its own sign";
      results.push({
        id: `mahapurusha-${spec.planet.name.toLowerCase()}`,
        name: spec.name,
        sanskritName: spec.sanskrit,
        type: "YOGA",
        category: "Mahapurusha",
        strength: "High",
        involvedPlanets: [spec.planet.name],
        involvedHouses: [spec.planet.house],
        conditionMet: `${spec.planet.name} is ${dignity} (${spec.planet.rashi}) in Kendra House ${spec.planet.house}.`,
        effects: spec.effects
      });
    }
  });

  // ============================================================================
  // CATEGORY B: CHANDRA (LUNAR) YOGAS (10 Yogas)
  // ============================================================================

  // 6. Gajakesari Yoga
  const jupRelMoon = getRelativeHouse(moon.house, jupiter.house);
  if (kendras.includes(jupRelMoon)) {
    const isStrong = isOwnOrExalted(jupiter) || isOwnOrExalted(moon);
    results.push({
      id: "gajakesari-yoga",
      name: "Gajakesari Yoga",
      sanskritName: "गजकेसरी योग",
      type: "YOGA",
      category: "Lunar & Solar",
      strength: isStrong ? "High" : "Moderate",
      involvedPlanets: ["Moon", "Jupiter"],
      involvedHouses: Array.from(new Set([moon.house, jupiter.house])),
      conditionMet: `Jupiter in House ${jupiter.house} (${jupiter.rashi}) is in the ${jupRelMoon}${jupRelMoon === 1 ? "st" : jupRelMoon === 4 ? "th" : jupRelMoon === 7 ? "th" : "th"} Kendra from Moon in House ${moon.house} (${moon.rashi}).`,
      effects: "Bestows lasting reputation, noble intelligence, emotional resilience, and protective grace. Like the lion and elephant, it grants dignity, wisdom, and prosperity that endures."
    });
  }

  // 7. Chandra-Mangala Yoga
  const marsRelMoon = getRelativeHouse(moon.house, mars.house);
  if (marsRelMoon === 1 || marsRelMoon === 7) {
    results.push({
      id: "chandra-mangala-yoga",
      name: "Chandra-Mangala Yoga",
      sanskritName: "चन्द्र-मङ्गल योग",
      type: "YOGA",
      category: "Dhana Yoga",
      strength: isOwnOrExalted(moon) || isOwnOrExalted(mars) ? "High" : "Moderate",
      involvedPlanets: ["Moon", "Mars"],
      involvedHouses: Array.from(new Set([moon.house, mars.house])),
      conditionMet:
        marsRelMoon === 1
          ? `Moon and Mars are conjunct in House ${moon.house} (${moon.rashi}).`
          : `Moon (House ${moon.house}) and Mars (House ${mars.house}) are in mutual 7th aspect.`,
      effects: "Powerful financial combination that energizes business enterprise, quick decision-making, and self-earned wealth. Combines emotional drive with practical ambition."
    });
  }

  // 8, 9, 10. Sunapha, Anapha, Durudhara Yogas (Planets in 2nd and/or 12th from Moon, excluding Sun, Rahu, Ketu)
  const lunarFlankCandidates = [mars, mercury, jupiter, venus, saturn];
  const in2ndFromMoon = lunarFlankCandidates.filter((p) => getRelativeHouse(moon.house, p.house) === 2);
  const in12thFromMoon = lunarFlankCandidates.filter((p) => getRelativeHouse(moon.house, p.house) === 12);

  if (in2ndFromMoon.length > 0 && in12thFromMoon.length > 0) {
    const names = [...in2ndFromMoon, ...in12thFromMoon].map((p) => p.name);
    results.push({
      id: "durudhara-yoga",
      name: "Durudhara Yoga",
      sanskritName: "दुरुधरा योग",
      type: "YOGA",
      category: "Lunar & Solar",
      strength: "High",
      involvedPlanets: ["Moon", ...names],
      involvedHouses: Array.from(new Set([moon.house, ...in2ndFromMoon.map((p) => p.house), ...in12thFromMoon.map((p) => p.house)])),
      conditionMet: `Moon (House ${moon.house}) is flanked on both sides by ${in2ndFromMoon.map((p) => p.name).join(", ")} in the 2nd and ${in12thFromMoon.map((p) => p.name).join(", ")} in the 12th from Moon.`,
      effects: "Indicates balanced emotional support, abundant wealth, vehicles, and generous nature. The native enjoys both material earnings and meaningful enjoyment of resources."
    });
  } else if (in2ndFromMoon.length > 0) {
    const names = in2ndFromMoon.map((p) => p.name);
    results.push({
      id: "sunapha-yoga",
      name: "Sunapha Yoga",
      sanskritName: "सुनफा योग",
      type: "YOGA",
      category: "Lunar & Solar",
      strength: "Moderate",
      involvedPlanets: ["Moon", ...names],
      involvedHouses: [moon.house, in2ndFromMoon[0].house],
      conditionMet: `${names.join(", ")} placed in the 2nd house (House ${in2ndFromMoon[0].house}) from Natal Moon (House ${moon.house}).`,
      effects: "Conducive to self-acquired wealth, sharp intelligence, and good reputation. Gives strong financial foresight and refined speech."
    });
  } else if (in12thFromMoon.length > 0) {
    const names = in12thFromMoon.map((p) => p.name);
    results.push({
      id: "anapha-yoga",
      name: "Anapha Yoga",
      sanskritName: "अनफा योग",
      type: "YOGA",
      category: "Lunar & Solar",
      strength: "Moderate",
      involvedPlanets: ["Moon", ...names],
      involvedHouses: [moon.house, in12thFromMoon[0].house],
      conditionMet: `${names.join(", ")} placed in the 12th house (House ${in12thFromMoon[0].house}) from Natal Moon (House ${moon.house}).`,
      effects: "Bestows magnetic personality, strong health, spiritual inclination, and dignified bearing with comfort in worldly life."
    });
  }

  // 11. Chandra Adhi Yoga (Benefics Mercury, Jupiter, Venus in 6th, 7th, 8th from Moon)
  const beneficsIn678FromMoon = PURE_BENEFICS.map((bName) => planets[bName]).filter((p) => {
    const rel = getRelativeHouse(moon.house, p.house);
    return rel === 6 || rel === 7 || rel === 8;
  });
  if (beneficsIn678FromMoon.length >= 2) {
    results.push({
      id: "chandra-adhi-yoga",
      name: "Chandra Adhi Yoga",
      sanskritName: "चन्द्र अधियोग",
      type: "YOGA",
      category: "Lunar & Solar",
      strength: beneficsIn678FromMoon.length === 3 ? "High" : "Moderate",
      involvedPlanets: ["Moon", ...beneficsIn678FromMoon.map((p) => p.name)],
      involvedHouses: Array.from(new Set([moon.house, ...beneficsIn678FromMoon.map((p) => p.house)])),
      conditionMet: `Natural benefics (${beneficsIn678FromMoon.map((p) => `${p.name} in H${p.house}`).join(", ")}) occupy the 6th/7th/8th houses from Moon (House ${moon.house}).`,
      effects: "Confers trustworthiness, leadership command, victory over adversaries, and a long, prosperous, and healthier life."
    });
  }

  // 12. Vasumati Yoga (Natural benefics in Upachaya 3, 6, 10, 11 from Moon or Lagna)
  const beneficsUpachayaFromMoon = PURE_BENEFICS.map((bName) => planets[bName]).filter((p) =>
    upachayas.includes(getRelativeHouse(moon.house, p.house))
  );
  const beneficsUpachayaFromLagna = PURE_BENEFICS.map((bName) => planets[bName]).filter((p) =>
    upachayas.includes(p.house)
  );
  if (beneficsUpachayaFromMoon.length === 3 || beneficsUpachayaFromLagna.length === 3) {
    const fromRef = beneficsUpachayaFromLagna.length === 3 ? "Lagna" : "Moon";
    results.push({
      id: "vasumati-yoga",
      name: "Vasumati Yoga",
      sanskritName: "वसुमती योग",
      type: "YOGA",
      category: "Dhana Yoga",
      strength: "High",
      involvedPlanets: ["Jupiter", "Venus", "Mercury"],
      involvedHouses: Array.from(new Set([jupiter.house, venus.house, mercury.house])),
      conditionMet: `All three natural benefics (Jupiter, Venus, Mercury) occupy Upachaya (growth) houses (3, 6, 10, 11) from ${fromRef}.`,
      effects: "Grants steadily expanding wealth, independent enterprise, and abundance of material resources throughout life."
    });
  }

  // 13. Gauri Yoga
  if (
    isOwnOrExalted(moon) &&
    (kendras.includes(moon.house) || trikonas.includes(moon.house)) &&
    (doesPlanetAspectHouse(jupiter, moon.house) || jupiter.house === moon.house)
  ) {
    results.push({
      id: "gauri-yoga",
      name: "Gauri Yoga",
      sanskritName: "गौरी योग",
      type: "YOGA",
      category: "Lunar & Solar",
      strength: "High",
      involvedPlanets: ["Moon", "Jupiter"],
      involvedHouses: Array.from(new Set([moon.house, jupiter.house])),
      conditionMet: `Moon is ${moon.rashi === "Taurus" ? "exalted in Taurus" : "in own sign Cancer"} in House ${moon.house} and blessed by Jupiter's aspect/conjunction.`,
      effects: "Bestows pure character, domestic happiness, noble lineage, and divine protection during challenging periods."
    });
  }

  // 14. Chandra-Shukra Yoga
  const venRelMoon = getRelativeHouse(moon.house, venus.house);
  if (venRelMoon === 1 || venRelMoon === 7) {
    results.push({
      id: "chandra-shukra-yoga",
      name: "Chandra-Shukra Prosperity Yoga",
      sanskritName: "चन्द्र-शुक्र योग",
      type: "YOGA",
      category: "Dhana Yoga",
      strength: isOwnOrExalted(moon) || isOwnOrExalted(venus) ? "High" : "Moderate",
      involvedPlanets: ["Moon", "Venus"],
      involvedHouses: Array.from(new Set([moon.house, venus.house])),
      conditionMet:
        venRelMoon === 1
          ? `Moon and Venus are conjunct in House ${moon.house} (${moon.rashi}).`
          : `Moon (House ${moon.house}) and Venus (House ${venus.house}) aspect each other across the 1/7 axis.`,
      effects: "Brings aesthetic refinement, artistic talent, diplomatic charm, and material luxury with strong social magnetism."
    });
  }

  // 15. Amala (Kirti) Yoga
  const planetsIn10thLagna = Object.values(planets).filter((p) => p.house === 10);
  const planetsIn10thMoon = Object.values(planets).filter((p) => getRelativeHouse(moon.house, p.house) === 10);
  const pureIn10Lagna =
    planetsIn10thLagna.length > 0 && planetsIn10thLagna.every((p) => PURE_BENEFICS.includes(p.name));
  const pureIn10Moon =
    planetsIn10thMoon.length > 0 && planetsIn10thMoon.every((p) => PURE_BENEFICS.includes(p.name));
  if (pureIn10Lagna || pureIn10Moon) {
    const activePlanets = pureIn10Lagna ? planetsIn10thLagna : planetsIn10thMoon;
    results.push({
      id: "amala-yoga",
      name: "Amala (Kirti) Yoga",
      sanskritName: "अमला कीर्ति योग",
      type: "YOGA",
      category: "Jnana & Special",
      strength: "High",
      involvedPlanets: activePlanets.map((p) => p.name),
      involvedHouses: [activePlanets[0].house],
      conditionMet: `Benefic ${activePlanets.map((p) => p.name).join(", ")} exclusively occupies the 10th house from ${pureIn10Lagna ? "Lagna" : "Moon"} (House ${activePlanets[0].house}).`,
      effects: "Creates spotless reputation, ethical career leadership, charitable deeds, and lasting honor in society."
    });
  }

  // ============================================================================
  // CATEGORY C: SURYA (SOLAR) YOGAS (4 Yogas)
  // ============================================================================

  // 16. Budhaditya (Nipuna) Yoga
  if (sun.house === mercury.house) {
    const degDiff = Math.abs(sun.longitude - mercury.longitude);
    const normalizedDiff = degDiff > 180 ? 360 - degDiff : degDiff;
    const isStrong = isOwnOrExalted(sun) || isOwnOrExalted(mercury) || normalizedDiff > 10;
    results.push({
      id: "budhaditya-yoga",
      name: "Budhaditya (Nipuna) Yoga",
      sanskritName: "बुधादित्य योग",
      type: "YOGA",
      category: "Lunar & Solar",
      strength: isStrong ? "High" : "Moderate",
      involvedPlanets: ["Sun", "Mercury"],
      involvedHouses: [sun.house],
      conditionMet: `Sun and Mercury are conjunct in House ${sun.house} (${sun.rashi}).`,
      effects: "Grants keen intelligence, skill in administration and calculation, authoritative communication, and scholarly respect."
    });
  }

  // 17, 18, 19. Vesi, Vasi, Ubhayachari Yogas (Planets in 2nd/12th from Sun, excluding Moon, Rahu, Ketu)
  const solarFlankCandidates = [mars, mercury, jupiter, venus, saturn];
  const in2ndFromSun = solarFlankCandidates.filter((p) => getRelativeHouse(sun.house, p.house) === 2);
  const in12thFromSun = solarFlankCandidates.filter((p) => getRelativeHouse(sun.house, p.house) === 12);

  if (in2ndFromSun.length > 0 && in12thFromSun.length > 0) {
    const names = [...in2ndFromSun, ...in12thFromSun].map((p) => p.name);
    results.push({
      id: "ubhayachari-yoga",
      name: "Ubhayachari Solar Yoga",
      sanskritName: "उभयचारी योग",
      type: "YOGA",
      category: "Lunar & Solar",
      strength: "High",
      involvedPlanets: ["Sun", ...names],
      involvedHouses: Array.from(new Set([sun.house, ...in2ndFromSun.map((p) => p.house), ...in12thFromSun.map((p) => p.house)])),
      conditionMet: `Sun (House ${sun.house}) is flanked by ${in2ndFromSun.map((p) => p.name).join(", ")} in the 2nd and ${in12thFromSun.map((p) => p.name).join(", ")} in the 12th from Sun.`,
      effects: "Provides royal bearing, balanced leadership, resilience under pressure, and strong support from peers and superiors."
    });
  } else if (in2ndFromSun.length > 0) {
    const names = in2ndFromSun.map((p) => p.name);
    results.push({
      id: "vesi-yoga",
      name: "Vesi Solar Yoga",
      sanskritName: "वेशि योग",
      type: "YOGA",
      category: "Lunar & Solar",
      strength: "Moderate",
      involvedPlanets: ["Sun", ...names],
      involvedHouses: [sun.house, in2ndFromSun[0].house],
      conditionMet: `${names.join(", ")} placed in the 2nd house (House ${in2ndFromSun[0].house}) from Sun (House ${sun.house}).`,
      effects: "Bestows truthfulness, poised speech, balanced outlook, and steady accumulation of authority."
    });
  } else if (in12thFromSun.length > 0) {
    const names = in12thFromSun.map((p) => p.name);
    results.push({
      id: "vasi-yoga",
      name: "Vasi Solar Yoga",
      sanskritName: "वाशि योग",
      type: "YOGA",
      category: "Lunar & Solar",
      strength: "Moderate",
      involvedPlanets: ["Sun", ...names],
      involvedHouses: [sun.house, in12thFromSun[0].house],
      conditionMet: `${names.join(", ")} placed in the 12th house (House ${in12thFromSun[0].house}) from Sun (House ${sun.house}).`,
      effects: "Indicates wisdom, organizational skill, inner contentment, and favor from influential circles."
    });
  }

  // ============================================================================
  // CATEGORY D: RAJA YOGAS (Power, Status & Royal Authority — 12 Yogas)
  // ============================================================================

  // 20. Dharma-Karmadhipati Raja Yoga (9th Lord & 10th Lord connection)
  const lord9Name = houseLords[9];
  const lord10Name = houseLords[10];
  const lord9 = planets[lord9Name];
  const lord10 = planets[lord10Name];
  if (lord9 && lord10) {
    const conn = checkPlanetaryConnection(lord9, lord10);
    if (conn.connected) {
      results.push({
        id: "dharma-karmadhipati-raja-yoga",
        name: "Dharma-Karmadhipati Raja Yoga",
        sanskritName: "धर्म-कर्माधिपति राजयोग",
        type: "YOGA",
        category: "Raja Yoga",
        strength: "High",
        involvedPlanets: [lord9Name, lord10Name],
        involvedHouses: Array.from(new Set([lord9.house, lord10.house, 9, 10])),
        conditionMet: `9th Lord (${lord9Name}) and 10th Lord (${lord10Name}) are ${conn.relationType}.`,
        effects: "Supreme Raja Yoga uniting higher destiny (9th) with career action (10th). Confers high professional stature, leadership success, and purposeful achievement."
      });
    }
  }

  // 21. Yoga Karaka Raja Yoga (Single planet ruling both a Kendra 4/7/10 and a Trikona 5/9)
  const angularHouses = [4, 7, 10];
  const trinalHouses = [5, 9];
  classicalSeven.forEach((p) => {
    const ruledAngular = angularHouses.filter((h) => houseLords[h] === p.name);
    const ruledTrinal = trinalHouses.filter((h) => houseLords[h] === p.name);
    if (ruledAngular.length > 0 && ruledTrinal.length > 0) {
      if (kendras.includes(p.house) || trikonas.includes(p.house) || isOwnOrExalted(p)) {
        results.push({
          id: `yogakaraka-${p.name.toLowerCase()}`,
          name: `Yoga Karaka Raja Yoga (${p.name})`,
          sanskritName: "योगकारक राजयोग",
          type: "YOGA",
          category: "Raja Yoga",
          strength: "High",
          involvedPlanets: [p.name],
          involvedHouses: Array.from(new Set([p.house, ...ruledAngular, ...ruledTrinal])),
          conditionMet: `${p.name} simultaneously rules Kendra House ${ruledAngular[0]} and Trikona House ${ruledTrinal[0]}, and is strongly placed in House ${p.house} (${p.rashi}).`,
          effects: "Makes the planet the premier bestower of fortune for this Lagna, elevating status, career authority, and material success during its periods."
        });
      }
    }
  });

  // 22. Kendra-Trikona Raja Yogas (Other Kendra 1,4,7,10 & Trikona 1,5,9 Lord connections)
  const kendraLordsMap = kendras.map((h) => ({ house: h, lord: houseLords[h] }));
  const trikonaLordsMap = [5, 9].map((h) => ({ house: h, lord: houseLords[h] }));
  const seenKendraTrikonaPairs = new Set<string>();

  kendraLordsMap.forEach((k) => {
    trikonaLordsMap.forEach((t) => {
      if (k.lord === t.lord) return;
      if ((k.house === 10 && t.house === 9) || (k.house === 9 && t.house === 10)) return; // Already handled by Dharma-Karmadhipati
      const pairKey = [k.lord, t.lord].sort().join("-");
      if (seenKendraTrikonaPairs.has(pairKey)) return;

      const pK = planets[k.lord];
      const pT = planets[t.lord];
      if (pK && pT) {
        const conn = checkPlanetaryConnection(pK, pT);
        if (conn.connected) {
          seenKendraTrikonaPairs.add(pairKey);
          results.push({
            id: `kendra-trikona-${pairKey.toLowerCase()}`,
            name: `Kendra-Trikona Raja Yoga (${k.lord}-${t.lord})`,
            sanskritName: "केन्द्र-त्रिकोण राजयोग",
            type: "YOGA",
            category: "Raja Yoga",
            strength: !dusthanas.includes(pK.house) && !dusthanas.includes(pT.house) ? "High" : "Moderate",
            involvedPlanets: [k.lord, t.lord],
            involvedHouses: Array.from(new Set([pK.house, pT.house, k.house, t.house])),
            conditionMet: `Kendra House ${k.house} Lord (${k.lord}) and Trikona House ${t.house} Lord (${t.lord}) are ${conn.relationType}.`,
            effects: "Combines foundational strength (Kendra) with past-life merit and luck (Trikona), bringing recognition, upward mobility, and auspicious achievements."
          });
        }
      }
    });
  });

  // 23 & 24. Maha Parivartana & Kahala Parivartana Raja Yogas (Mutual Sign Exchange)
  const mahaHouses = [1, 2, 4, 5, 7, 9, 10, 11];
  const seenParivartana = new Set<string>();
  for (let h1 = 1; h1 <= 12; h1++) {
    for (let h2 = h1 + 1; h2 <= 12; h2++) {
      const l1 = houseLords[h1];
      const l2 = houseLords[h2];
      if (!l1 || !l2 || l1 === l2) continue;
      const p1 = planets[l1];
      const p2 = planets[l2];
      if (p1 && p2 && p1.house === h2 && p2.house === h1) {
        const key = `${Math.min(h1, h2)}-${Math.max(h1, h2)}`;
        if (seenParivartana.has(key)) continue;
        seenParivartana.add(key);

        if (mahaHouses.includes(h1) && mahaHouses.includes(h2)) {
          results.push({
            id: `maha-parivartana-${key}`,
            name: `Maha Parivartana Raja Yoga (H${h1} ↔ H${h2})`,
            sanskritName: "महा परिवर्तन राजयोग",
            type: "YOGA",
            category: "Raja Yoga",
            strength: "High",
            involvedPlanets: [l1, l2],
            involvedHouses: [h1, h2],
            conditionMet: `House ${h1} Lord (${l1}) sits in House ${h2} while House ${h2} Lord (${l2}) sits in House ${h1}.`,
            effects: "Mutual reception between two auspicious houses interlinks their domains, granting prominence, wealth, and authoritative status."
          });
        } else if ((h1 === 3 && mahaHouses.includes(h2)) || (h2 === 3 && mahaHouses.includes(h1))) {
          results.push({
            id: `kahala-parivartana-${key}`,
            name: `Kahala Parivartana Yoga (H${h1} ↔ H${h2})`,
            sanskritName: "काहल परिवर्तन योग",
            type: "YOGA",
            category: "Raja Yoga",
            strength: "Moderate",
            involvedPlanets: [l1, l2],
            involvedHouses: [h1, h2],
            conditionMet: `3rd House Lord exchanges signs with auspicious House ${h1 === 3 ? h2 : h1} Lord (${l1} ↔ ${l2}).`,
            effects: "Rewards bold initiative, self-made enterprise, communication leadership, and gains through personal courage."
          });
        }
      }
    }
  }

  // 25. Neecha Bhanga Raja Yoga (Cancellation of Debilitation)
  classicalSeven.forEach((p) => {
    if (isDebilitated(p)) {
      const signDispositorName = RASHI_RULERS[p.rashi];
      const exaltLordName = EXALTATION_LORD_OF_SIGN[p.rashi];
      const dispositor = planets[signDispositorName];
      const exaltLord = exaltLordName ? planets[exaltLordName] : undefined;

      const reasons: string[] = [];
      if (dispositor && (kendras.includes(dispositor.house) || kendras.includes(getRelativeHouse(moon.house, dispositor.house)))) {
        reasons.push(`sign dispositor ${signDispositorName} is in Kendra (House ${dispositor.house})`);
      }
      if (exaltLord && (kendras.includes(exaltLord.house) || kendras.includes(getRelativeHouse(moon.house, exaltLord.house)))) {
        reasons.push(`exaltation lord ${exaltLordName} is in Kendra (House ${exaltLord.house})`);
      }
      if (dispositor && (dispositor.house === p.house || doesPlanetAspectHouse(dispositor, p.house))) {
        reasons.push(`dispositor ${signDispositorName} aspects/conjoins ${p.name}`);
      }
      if (OWN_SIGNS[p.name]?.includes(p.navamshaRashi) || EXALTED_SIGNS[p.name] === p.navamshaRashi) {
        reasons.push(`${p.name} gains dignity in Navamsha (${p.navamshaRashi})`);
      }

      if (reasons.length > 0) {
        results.push({
          id: `neecha-bhanga-${p.name.toLowerCase()}`,
          name: `Neecha Bhanga Raja Yoga (${p.name})`,
          sanskritName: "नीचभङ्ग राजयोग",
          type: "YOGA",
          category: "Raja Yoga",
          strength: reasons.length >= 2 ? "High" : "Moderate",
          involvedPlanets: Array.from(new Set([p.name, signDispositorName])),
          involvedHouses: [p.house],
          conditionMet: `${p.name} is debilitated in ${p.rashi} (House ${p.house}), but cancelled because ${reasons.join(" and ")}.`,
          effects: "Transforms initial struggle or vulnerability into extraordinary resilience and rise to prominence through lived mastery."
        });
      }
    }
  });

  // 26, 27, 28. Vipareeta Raja Yogas (Harsha, Sarala, Vimala)
  const vipareetaSpecs: { house: number; name: string; sanskrit: string; effects: string }[] = [
    {
      house: 6,
      name: "Harsha Vipareeta Raja Yoga",
      sanskrit: "हर्ष विपरीत राजयोग",
      effects: "Turns obstacles and competition into stepping stones; grants strong immunity, victory over opponents, and leadership in crisis."
    },
    {
      house: 8,
      name: "Sarala Vipareeta Raja Yoga",
      sanskrit: "सरल विपरीत राजयोग",
      effects: "Confers fearlessness, longevity, deep research/occult insight, and unexpected breakthroughs out of transformative situations."
    },
    {
      house: 12,
      name: "Vimala Vipareeta Raja Yoga",
      sanskrit: "विमल विपरीत राजयोग",
      effects: "Brings ethical independence, protection from heavy losses, success in foreign lands, and spiritual contentment."
    }
  ];

  vipareetaSpecs.forEach((v) => {
    const lordName = houseLords[v.house];
    const lordPlanet = planets[lordName];
    if (lordPlanet && dusthanas.includes(lordPlanet.house)) {
      results.push({
        id: `vipareeta-${v.house}`,
        name: v.name,
        sanskritName: v.sanskrit,
        type: "YOGA",
        category: "Raja Yoga",
        strength: lordPlanet.house === v.house ? "High" : "Moderate",
        involvedPlanets: [lordName],
        involvedHouses: Array.from(new Set([v.house, lordPlanet.house])),
        conditionMet: `Lord of Dusthana House ${v.house} (${lordName}) is placed in Dusthana House ${lordPlanet.house} (${lordPlanet.rashi}).`,
        effects: v.effects
      });
    }
  });

  // 29. Lagna Adhi Yoga
  const beneficsIn678Lagna = PURE_BENEFICS.map((bName) => planets[bName]).filter(
    (p) => p.house === 6 || p.house === 7 || p.house === 8
  );
  if (beneficsIn678Lagna.length >= 2) {
    results.push({
      id: "lagna-adhi-yoga",
      name: "Lagna Adhi Yoga",
      sanskritName: "लग्न अधियोग",
      type: "YOGA",
      category: "Raja Yoga",
      strength: beneficsIn678Lagna.length === 3 ? "High" : "Moderate",
      involvedPlanets: beneficsIn678Lagna.map((p) => p.name),
      involvedHouses: Array.from(new Set(beneficsIn678Lagna.map((p) => p.house))),
      conditionMet: `Benefics (${beneficsIn678Lagna.map((p) => `${p.name} in H${p.house}`).join(", ")}) occupy the 6th/7th/8th houses from Lagna.`,
      effects: "Bestows executive authority, diplomatic grace, harmonious partnerships, and protection from hidden adversaries."
    });
  }

  // 30. Akhanda Samrajya Yoga
  const jupRules2511 = [2, 5, 11].some((h) => houseLords[h] === "Jupiter");
  const lords2911InMoonKendra = [2, 9, 11].some((h) => {
    const l = planets[houseLords[h]];
    return l && kendras.includes(getRelativeHouse(moon.house, l.house));
  });
  if (jupRules2511 && lords2911InMoonKendra) {
    results.push({
      id: "akhanda-samrajya-yoga",
      name: "Akhanda Samrajya Yoga",
      sanskritName: "अखण्ड साम्राज्य योग",
      type: "YOGA",
      category: "Raja Yoga",
      strength: "High",
      involvedPlanets: Array.from(new Set(["Jupiter", houseLords[2], houseLords[9], houseLords[11]])),
      involvedHouses: [jupiter.house, 2, 9, 11],
      conditionMet: `Jupiter rules one of Houses 2/5/11 while a lord of House 2, 9, or 11 sits in a Kendra from the Moon.`,
      effects: "Rare imperial combination conferring enduring authority, broad influence, and long-term material sovereignty."
    });
  }

  // 31. Mahabhagya Yoga
  const isDayBirth = birthHour >= 6 && birthHour < 18;
  const lagnaIsOdd = lagnaRashiIndex % 2 === 0; // 0=Aries (Odd), 1=Taurus (Even)...
  const sunIsOdd = sun.rashiIndex % 2 === 0;
  const moonIsOdd = moon.rashiIndex % 2 === 0;
  if ((isDayBirth && lagnaIsOdd && sunIsOdd && moonIsOdd) || (!isDayBirth && !lagnaIsOdd && !sunIsOdd && !moonIsOdd)) {
    results.push({
      id: "mahabhagya-yoga",
      name: "Mahabhagya Yoga",
      sanskritName: "महाभाग्य योग",
      type: "YOGA",
      category: "Raja Yoga",
      strength: "High",
      involvedPlanets: ["Sun", "Moon"],
      involvedHouses: Array.from(new Set([1, sun.house, moon.house])),
      conditionMet: `${isDayBirth ? "Daytime" : "Nighttime"} birth with Lagna (${RASHIS[lagnaRashiIndex]}), Sun (${sun.rashi}), and Moon (${moon.rashi}) all in ${isDayBirth ? "Odd (Masculine)" : "Even (Feminine)"} signs.`,
      effects: "Signifies extraordinary fortune, magnetism, generosity, and natural grace that attracts support at key milestones in life."
    });
  }

  // ============================================================================
  // CATEGORY E: DHANA & PROSPERITY YOGAS (7 Yogas)
  // ============================================================================

  // 32. Maha Dhana Yoga (Connections among 2nd, 5th, 9th, 11th Lords)
  const dhanaHouses = [2, 5, 9, 11];
  const seenDhanaPairs = new Set<string>();
  for (let i = 0; i < dhanaHouses.length; i++) {
    for (let j = i + 1; j < dhanaHouses.length; j++) {
      const hA = dhanaHouses[i];
      const hB = dhanaHouses[j];
      const lA = houseLords[hA];
      const lB = houseLords[hB];
      if (!lA || !lB || lA === lB) continue;
      const pairKey = [lA, lB].sort().join("-");
      if (seenDhanaPairs.has(pairKey)) continue;

      const pA = planets[lA];
      const pB = planets[lB];
      if (pA && pB) {
        const conn = checkPlanetaryConnection(pA, pB);
        if (conn.connected) {
          seenDhanaPairs.add(pairKey);
          results.push({
            id: `dhana-yoga-${pairKey.toLowerCase()}`,
            name: `Dhana Yoga (H${hA} & H${hB} Lords)`,
            sanskritName: "धन योग",
            type: "YOGA",
            category: "Dhana Yoga",
            strength: !dusthanas.includes(pA.house) && !dusthanas.includes(pB.house) ? "High" : "Moderate",
            involvedPlanets: [lA, lB],
            involvedHouses: Array.from(new Set([pA.house, pB.house, hA, hB])),
            conditionMet: `House ${hA} Lord (${lA}) and House ${hB} Lord (${lB}) are ${conn.relationType}.`,
            effects: "Links the primary wealth-generating houses of assets (2nd), investments/intellect (5th), fortune (9th), and gains (11th) for strong financial prosperity."
          });
        }
      }
    }
  }

  // 33. Lakshmi Yoga
  const lagnaLord = planets[houseLords[1]];
  if (
    lord9 &&
    lagnaLord &&
    isOwnOrExalted(lord9) &&
    (kendras.includes(lord9.house) || trikonas.includes(lord9.house)) &&
    (kendras.includes(lagnaLord.house) || trikonas.includes(lagnaLord.house) || isOwnOrExalted(lagnaLord))
  ) {
    results.push({
      id: "lakshmi-yoga",
      name: "Lakshmi Yoga",
      sanskritName: "लक्ष्मी योग",
      type: "YOGA",
      category: "Dhana Yoga",
      strength: "High",
      involvedPlanets: Array.from(new Set([houseLords[1], houseLords[9]])),
      involvedHouses: Array.from(new Set([1, 9, lagnaLord.house, lord9.house])),
      conditionMet: `9th Lord (${houseLords[9]}) is in own/exalted sign in House ${lord9.house} while Lagna Lord (${houseLords[1]}) is strongly placed in House ${lagnaLord.house}.`,
      effects: "Bestows abundant wealth, noble fortune, high social standing, and the grace of Goddess Lakshmi."
    });
  }

  // 34. Guru-Mangala Yoga
  const jupMarsRel = getRelativeHouse(jupiter.house, mars.house);
  if (jupMarsRel === 1 || jupMarsRel === 7) {
    results.push({
      id: "guru-mangala-yoga",
      name: "Guru-Mangala Yoga",
      sanskritName: "गुरु-मङ्गल योग",
      type: "YOGA",
      category: "Dhana Yoga",
      strength: isOwnOrExalted(jupiter) || isOwnOrExalted(mars) ? "High" : "Moderate",
      involvedPlanets: ["Jupiter", "Mars"],
      involvedHouses: Array.from(new Set([jupiter.house, mars.house])),
      conditionMet:
        jupMarsRel === 1
          ? `Jupiter and Mars are conjunct in House ${jupiter.house} (${jupiter.rashi}).`
          : `Jupiter (House ${jupiter.house}) and Mars (House ${mars.house}) are in mutual 7th aspect.`,
      effects: "Unites strategic wisdom (Jupiter) with decisive execution (Mars). Excellent for property ownership, principled leadership, and engineering/management success."
    });
  }

  // 35. Lakshmi-Narayana (Shukra-Budha) Yoga
  if (venus.house === mercury.house && (kendras.includes(venus.house) || trikonas.includes(venus.house) || venus.house === 2 || venus.house === 11)) {
    results.push({
      id: "lakshmi-narayana-yoga",
      name: "Lakshmi-Narayana (Shukra-Budha) Yoga",
      sanskritName: "लक्ष्मी-नारायण योग",
      type: "YOGA",
      category: "Dhana Yoga",
      strength: isOwnOrExalted(venus) || isOwnOrExalted(mercury) ? "High" : "Moderate",
      involvedPlanets: ["Venus", "Mercury"],
      involvedHouses: [venus.house],
      conditionMet: `Venus and Mercury are conjunct in auspicious House ${venus.house} (${venus.rashi}).`,
      effects: "Blends commercial intelligence (Mercury) with artistic refinement and fortune (Venus), bringing financial affluence and harmonious alliances."
    });
  }

  // 36. Kalanidhi / Kubera Yoga
  if (
    (jupiter.house === 2 || jupiter.house === 5) &&
    (mercury.house === jupiter.house || venus.house === jupiter.house || doesPlanetAspectHouse(mercury, jupiter.house) || doesPlanetAspectHouse(venus, jupiter.house))
  ) {
    results.push({
      id: "kalanidhi-yoga",
      name: "Kalanidhi Yoga",
      sanskritName: "कलानिधि योग",
      type: "YOGA",
      category: "Dhana Yoga",
      strength: "High",
      involvedPlanets: ["Jupiter", "Mercury", "Venus"],
      involvedHouses: [jupiter.house],
      conditionMet: `Jupiter occupies House ${jupiter.house} (${jupiter.rashi}) and is conjoined or aspected by Mercury/Venus.`,
      effects: "Grants mastery over arts and sciences, respect from authorities, robust health, and multifaceted prosperity."
    });
  }

  // ============================================================================
  // CATEGORY F: JNANA, SARASWATI & SPECIAL CLASSICAL YOGAS (9 Yogas)
  // ============================================================================

  // 37. Saraswati Yoga
  const saraswatiHouses = [1, 2, 4, 5, 7, 9, 10];
  if (
    saraswatiHouses.includes(jupiter.house) &&
    saraswatiHouses.includes(venus.house) &&
    saraswatiHouses.includes(mercury.house)
  ) {
    results.push({
      id: "saraswati-yoga",
      name: "Saraswati Yoga",
      sanskritName: "सरस्वती योग",
      type: "YOGA",
      category: "Jnana & Special",
      strength: isOwnOrExalted(jupiter) ? "High" : "Moderate",
      involvedPlanets: ["Jupiter", "Venus", "Mercury"],
      involvedHouses: Array.from(new Set([jupiter.house, venus.house, mercury.house])),
      conditionMet: `Jupiter (H${jupiter.house}), Venus (H${venus.house}), and Mercury (H${mercury.house}) all occupy Kendra, Trikona, or 2nd houses.`,
      effects: "Blesses the native with supreme learning, creative brilliance, eloquence, academic honors, and wisdom revered by scholars."
    });
  }

  // 38. Parvata Yoga
  const beneficsInKendras = PURE_BENEFICS.map((b) => planets[b]).filter((p) => kendras.includes(p.house));
  const maleficsIn6Or8 = NATURAL_MALEFICS.map((m) => planets[m]).filter((p) => p.house === 6 || p.house === 8);
  if (beneficsInKendras.length >= 2 && maleficsIn6Or8.length === 0) {
    results.push({
      id: "parvata-yoga",
      name: "Parvata Yoga",
      sanskritName: "पर्वत योग",
      type: "YOGA",
      category: "Jnana & Special",
      strength: "High",
      involvedPlanets: beneficsInKendras.map((p) => p.name),
      involvedHouses: Array.from(new Set(beneficsInKendras.map((p) => p.house))),
      conditionMet: `Benefics (${beneficsInKendras.map((p) => p.name).join(", ")}) occupy Kendras while the 6th and 8th houses are free of malefics.`,
      effects: "Bestows mountain-like stability, lasting fame, charitable leadership, and immovable wealth."
    });
  }

  // 39. Kahala Yoga
  const lord4 = planets[houseLords[4]];
  if (lord4 && kendras.includes(getRelativeHouse(lord4.house, jupiter.house)) && lagnaLord && (isOwnOrExalted(lagnaLord) || kendras.includes(lagnaLord.house))) {
    results.push({
      id: "kahala-yoga",
      name: "Kahala Yoga",
      sanskritName: "काहल योग",
      type: "YOGA",
      category: "Jnana & Special",
      strength: "Moderate",
      involvedPlanets: Array.from(new Set([houseLords[4], "Jupiter", houseLords[1]])),
      involvedHouses: Array.from(new Set([lord4.house, jupiter.house, lagnaLord.house])),
      conditionMet: `4th Lord (${houseLords[4]}) and Jupiter are in mutual Kendras while Lagna Lord (${houseLords[1]}) is strong in House ${lagnaLord.house}.`,
      effects: "Confers enterprising courage, administrative authority, and the ability to lead teams or organizations effectively."
    });
  }

  // 40. Chamara Yoga
  const beneficsInChamaraHouses = PURE_BENEFICS.map((b) => planets[b]).filter((p) => [1, 7, 9, 10].includes(p.house));
  if (
    (lagnaLord && EXALTED_SIGNS[lagnaLord.name] === lagnaLord.rashi && kendras.includes(lagnaLord.house) && doesPlanetAspectHouse(jupiter, lagnaLord.house)) ||
    beneficsInChamaraHouses.length >= 2
  ) {
    results.push({
      id: "chamara-yoga",
      name: "Chamara Yoga",
      sanskritName: "चामर योग",
      type: "YOGA",
      category: "Jnana & Special",
      strength: "High",
      involvedPlanets: beneficsInChamaraHouses.length >= 2 ? beneficsInChamaraHouses.map((p) => p.name) : [houseLords[1], "Jupiter"],
      involvedHouses: beneficsInChamaraHouses.length >= 2 ? Array.from(new Set(beneficsInChamaraHouses.map((p) => p.house))) : [lagnaLord.house],
      conditionMet:
        beneficsInChamaraHouses.length >= 2
          ? `Multiple natural benefics (${beneficsInChamaraHouses.map((p) => `${p.name} in H${p.house}`).join(", ")}) occupy Houses 1, 7, 9, or 10.`
          : `Lagna Lord (${houseLords[1]}) is exalted in Kendra House ${lagnaLord.house} and aspected by Jupiter.`,
      effects: "Indicates eloquence, scholarly authority, long life, and rising prestige in public or intellectual spheres."
    });
  }

  // 41. Shankha Yoga
  const lord5 = planets[houseLords[5]];
  const lord6 = planets[houseLords[6]];
  if (lord5 && lord6 && kendras.includes(getRelativeHouse(lord5.house, lord6.house)) && lagnaLord && (kendras.includes(lagnaLord.house) || trikonas.includes(lagnaLord.house))) {
    results.push({
      id: "shankha-yoga",
      name: "Shankha Yoga",
      sanskritName: "शङ्ख योग",
      type: "YOGA",
      category: "Jnana & Special",
      strength: "Moderate",
      involvedPlanets: Array.from(new Set([houseLords[5], houseLords[6], houseLords[1]])),
      involvedHouses: Array.from(new Set([lord5.house, lord6.house, lagnaLord.house])),
      conditionMet: `5th Lord (${houseLords[5]}) and 6th Lord (${houseLords[6]}) are in mutual Kendras while Lagna Lord (${houseLords[1]}) is strong in House ${lagnaLord.house}.`,
      effects: "Blends intelligence (5th) with disciplined service/problem-solving (6th), bestowing ethical living, land/property, and scholarly merit."
    });
  }

  // 42. Bheri Yoga
  if (
    lagnaLord &&
    lord9 &&
    kendras.includes(getRelativeHouse(venus.house, jupiter.house)) &&
    kendras.includes(getRelativeHouse(venus.house, lagnaLord.house)) &&
    (kendras.includes(lord9.house) || trikonas.includes(lord9.house) || isOwnOrExalted(lord9))
  ) {
    results.push({
      id: "bheri-yoga",
      name: "Bheri Yoga",
      sanskritName: "भेरी योग",
      type: "YOGA",
      category: "Jnana & Special",
      strength: "High",
      involvedPlanets: Array.from(new Set(["Venus", "Jupiter", houseLords[1], houseLords[9]])),
      involvedHouses: Array.from(new Set([venus.house, jupiter.house, lagnaLord.house, lord9.house])),
      conditionMet: `Venus, Jupiter, and Lagna Lord (${houseLords[1]}) are in mutual Kendras while 9th Lord (${houseLords[9]}) is strongly placed.`,
      effects: "Confers robust health, family harmony, noble character, and multi-generational prosperity."
    });
  }

  // 43. Tapasvi / Pravrajya Yoga (Spiritual Mastery)
  const houseCounts: Record<number, PlanetPosition[]> = {};
  Object.values(planets).forEach((p) => {
    houseCounts[p.house] = houseCounts[p.house] || [];
    houseCounts[p.house].push(p);
  });
  const clusteredHouseEntry = Object.entries(houseCounts).find(([, list]) => list.length >= 4);
  const satKetuVen = saturn.house === ketu.house && (venus.house === saturn.house || moon.house === saturn.house);
  if (clusteredHouseEntry || satKetuVen) {
    const hNum = clusteredHouseEntry ? Number(clusteredHouseEntry[0]) : saturn.house;
    const inv = clusteredHouseEntry ? clusteredHouseEntry[1].map((p) => p.name) : ["Saturn", "Ketu", venus.house === saturn.house ? "Venus" : "Moon"];
    results.push({
      id: "tapasvi-pravrajya-yoga",
      name: "Tapasvi / Pravrajya Spiritual Yoga",
      sanskritName: "तपस्वी / प्रव्रज्या योग",
      type: "YOGA",
      category: "Jnana & Special",
      strength: "High",
      involvedPlanets: inv,
      involvedHouses: [hNum],
      conditionMet: clusteredHouseEntry
        ? `${inv.length} planets (${inv.join(", ")}) converge in House ${hNum}.`
        : `Saturn, Ketu, and ${venus.house === saturn.house ? "Venus" : "Moon"} conjoin in House ${hNum}.`,
      effects: "Produces intense single-pointed dedication (Tapasya), philosophical depth, and spiritual detachment that leads to mastery in a chosen calling."
    });
  }

  // 44. Shubha Kartari Yoga (Lagna or Moon hemmed between natural benefics in 2nd and 12th)
  const beneficsIn2ndLagna = PURE_BENEFICS.filter((b) => planets[b].house === 2);
  const beneficsIn12thLagna = PURE_BENEFICS.filter((b) => planets[b].house === 12);
  const maleficsIn2Or12Lagna = NATURAL_MALEFICS.filter((m) => planets[m].house === 2 || planets[m].house === 12);
  if (beneficsIn2ndLagna.length > 0 && beneficsIn12thLagna.length > 0 && maleficsIn2Or12Lagna.length === 0) {
    results.push({
      id: "shubha-kartari-lagna",
      name: "Shubha Kartari Yoga (Lagna)",
      sanskritName: "शुभ कर्तरी योग",
      type: "YOGA",
      category: "Jnana & Special",
      strength: "High",
      involvedPlanets: [...beneficsIn2ndLagna, ...beneficsIn12thLagna],
      involvedHouses: [1, 2, 12],
      conditionMet: `Lagna (House 1) is hemmed between natural benefics in House 2 (${beneficsIn2ndLagna.join(", ")}) and House 12 (${beneficsIn12thLagna.join(", ")}).`,
      effects: "Creates an auspicious protective shield around the self, enhancing vitality, peace of mind, and graceful support from life circumstances."
    });
  }

  // ============================================================================
  // CATEGORY G: VARGOTTAMA & NABHASA PATTERN YOGAS
  // ============================================================================

  // 45. Vargottama Yoga (D1 Rashi === D9 Navamsha Rashi)
  const vargottamaBodies: string[] = [];
  const vargottamaHouses: number[] = [];
  if (lagnaRashiIndex === lagnaNavamshaIndex) {
    vargottamaBodies.push(`Lagna (${RASHIS[lagnaRashiIndex]})`);
    vargottamaHouses.push(1);
  }
  Object.values(planets).forEach((p) => {
    if (p.rashiIndex === p.navamshaRashiIndex) {
      vargottamaBodies.push(`${p.name} (${p.rashi})`);
      vargottamaHouses.push(p.house);
    }
  });
  if (vargottamaBodies.length > 0) {
    results.push({
      id: "vargottama-yoga",
      name: "Vargottama Dignity Yoga",
      sanskritName: "वर्गोत्तम योग",
      type: "YOGA",
      category: "Vargottama & Nabhasa",
      strength: vargottamaBodies.length >= 2 ? "High" : "Moderate",
      involvedPlanets: Object.values(planets)
        .filter((p) => p.rashiIndex === p.navamshaRashiIndex)
        .map((p) => p.name),
      involvedHouses: Array.from(new Set(vargottamaHouses)),
      conditionMet: `${vargottamaBodies.join(", ")} occupy the exact same Zodiac sign in both the Natal (D1) and Navamsha (D9) charts.`,
      effects: "Aligns outer action (D1) with inner soul potential (D9), empowering the Vargottama placements with remarkable resilience and inner conviction."
    });
  }

  // 46, 47, 48. Nabhasa Ashraya Yogas (Rajju, Musala, Nala)
  const allModalities = classicalSeven.map((p) => p.rashiIndex % 3); // 0=Movable, 1=Fixed, 2=Dual
  if (allModalities.every((m) => m === 0)) {
    results.push({
      id: "nabhasa-rajju",
      name: "Rajju Nabhasa Yoga",
      sanskritName: "रज्जु नाभस योग",
      type: "YOGA",
      category: "Vargottama & Nabhasa",
      strength: "High",
      involvedPlanets: classicalSeven.map((p) => p.name),
      involvedHouses: Array.from(new Set(classicalSeven.map((p) => p.house))),
      conditionMet: "All 7 classical planets occupy Movable (Chara) signs (Aries, Cancer, Libra, Capricorn).",
      effects: "Bestows dynamic ambition, love of travel and exploration, adaptability, and success away from the birthplace."
    });
  } else if (allModalities.every((m) => m === 1)) {
    results.push({
      id: "nabhasa-musala",
      name: "Musala Nabhasa Yoga",
      sanskritName: "मुसल नाभस योग",
      type: "YOGA",
      category: "Vargottama & Nabhasa",
      strength: "High",
      involvedPlanets: classicalSeven.map((p) => p.name),
      involvedHouses: Array.from(new Set(classicalSeven.map((p) => p.house))),
      conditionMet: "All 7 classical planets occupy Fixed (Sthira) signs (Taurus, Leo, Scorpio, Aquarius).",
      effects: "Grants unwavering determination, durable wealth, loyalty, and the ability to build lasting institutions."
    });
  } else if (allModalities.every((m) => m === 2)) {
    results.push({
      id: "nabhasa-nala",
      name: "Nala Nabhasa Yoga",
      sanskritName: "नल नाभस योग",
      type: "YOGA",
      category: "Vargottama & Nabhasa",
      strength: "High",
      involvedPlanets: classicalSeven.map((p) => p.name),
      involvedHouses: Array.from(new Set(classicalSeven.map((p) => p.house))),
      conditionMet: "All 7 classical planets occupy Dual (Dwiswabhava) signs (Gemini, Virgo, Sagittarius, Pisces).",
      effects: "Confers intellectual versatility, diplomatic skill, multi-disciplinary talents, and resourcefulness."
    });
  }

  // 49. Nabhasa Sankhya Yogas (Based on number of distinct signs occupied by the 7 classical planets)
  const distinctHouses7 = Array.from(new Set(classicalSeven.map((p) => p.house)));
  const sankhyaSpecs: Record<number, { name: string; sanskrit: string; effects: string }> = {
    1: {
      name: "Gola Sankhya Nabhasa Yoga",
      sanskrit: "गोल नाभस योग",
      effects: "All 7 classical planets concentrated in a single house, creating intense singular life focus and extraordinary specialization."
    },
    2: {
      name: "Yuga Sankhya Nabhasa Yoga",
      sanskrit: "युग नाभस योग",
      effects: "All 7 classical planets concentrated in 2 houses, producing unconventional philosophy and deep spiritual/intellectual intensity."
    },
    3: {
      name: "Shoola Sankhya Nabhasa Yoga",
      sanskrit: "शूल नाभस योग",
      effects: "All 7 classical planets distributed across 3 houses, bestowing sharp determination, courage, and decisive focus on core life goals."
    },
    4: {
      name: "Kedara Sankhya Nabhasa Yoga",
      sanskrit: "केदार नाभस योग",
      effects: "All 7 classical planets distributed across 4 houses, granting agricultural/real-estate prosperity, helpfulness to others, and truthful living."
    },
    5: {
      name: "Pasha Sankhya Nabhasa Yoga",
      sanskrit: "पाश नाभस योग",
      effects: "All 7 classical planets distributed across 5 houses, bestowing practical resourcefulness, large networks, and strong organizational bonds."
    },
    6: {
      name: "Dami (Damini) Sankhya Nabhasa Yoga",
      sanskrit: "दामिनी नाभस योग",
      effects: "All 7 classical planets distributed across 6 houses, conferring generosity, public spiritedness, and wide-ranging intellectual curiosity."
    },
    7: {
      name: "Veena (Vallaki) Sankhya Nabhasa Yoga",
      sanskrit: "वीणा नाभस योग",
      effects: "All 7 classical planets spread across 7 distinct houses, granting love of music and arts, harmonious versatility, and leadership among peers."
    }
  };
  const sankhyaSpec = sankhyaSpecs[distinctHouses7.length];
  if (sankhyaSpec) {
    results.push({
      id: `nabhasa-sankhya-${distinctHouses7.length}`,
      name: sankhyaSpec.name,
      sanskritName: sankhyaSpec.sanskrit,
      type: "YOGA",
      category: "Vargottama & Nabhasa",
      strength: distinctHouses7.length === 4 || distinctHouses7.length === 6 || distinctHouses7.length === 7 ? "High" : "Moderate",
      involvedPlanets: classicalSeven.map((p) => p.name),
      involvedHouses: distinctHouses7,
      conditionMet: `The 7 classical planets occupy exactly ${distinctHouses7.length} distinct houses (${distinctHouses7.map((h) => `H${h}`).join(", ")}).`,
      effects: sankhyaSpec.effects
    });
  }

  // ============================================================================
  // CATEGORY H: DOSHAS & PLANETARY AFFLICTIONS (with Classical Parihara Checks)
  // ============================================================================

  // 1. Mangal Dosha (Kuja / Manglik Dosha) + Parihara Cancellation
  const manglikHouses = [1, 2, 4, 7, 8, 12];
  const isManglikFromLagna = manglikHouses.includes(mars.house);
  const marsFromMoon = getRelativeHouse(moon.house, mars.house);
  const isManglikFromMoon = manglikHouses.includes(marsFromMoon);

  if (isManglikFromLagna || isManglikFromMoon) {
    const pariharaReasons: string[] = [];
    if (isOwnOrExalted(mars)) {
      pariharaReasons.push(`Mars is in ${mars.rashi === "Capricorn" ? "exalted sign Capricorn" : `own sign ${mars.rashi}`}`);
    }
    if (jupiter.house === mars.house || doesPlanetAspectHouse(jupiter, mars.house)) {
      pariharaReasons.push("Mars receives benefic conjunction/Drishti of Jupiter (Guru-Mangala blessing)");
    }
    if (venus.house === mars.house || moon.house === mars.house) {
      pariharaReasons.push(`Mars is softened by conjunction with ${venus.house === mars.house ? "Venus" : "Moon"}`);
    }
    if (
      (mars.house === 2 && (mars.rashi === "Gemini" || mars.rashi === "Virgo")) ||
      (mars.house === 4 && (mars.rashi === "Aries" || mars.rashi === "Scorpio")) ||
      (mars.house === 7 && (mars.rashi === "Cancer" || mars.rashi === "Capricorn")) ||
      (mars.house === 8 && (mars.rashi === "Sagittarius" || mars.rashi === "Pisces")) ||
      (mars.house === 12 && (mars.rashi === "Taurus" || mars.rashi === "Libra"))
    ) {
      pariharaReasons.push(`classical house-sign exception applies for Mars in House ${mars.house} (${mars.rashi})`);
    }
    if (houseLords[1] === "Mars" || (houseLords[4] === "Mars" && houseLords[9] === "Mars") || (houseLords[5] === "Mars" && houseLords[10] === "Mars")) {
      pariharaReasons.push("Mars acts as Lagna Lord or Yoga Karaka for this Ascendant");
    }

    const isCancelled = pariharaReasons.length > 0;
    results.push({
      id: "mangal-dosha",
      name: isCancelled ? "Mangal Dosha (Parihara / Cancelled)" : "Mangal Dosha (Kuja / Manglik Dosha)",
      sanskritName: "मङ्गल / कुज दोष",
      type: "DOSHA",
      category: "Dosha",
      strength: isCancelled ? "Cancelled / Mitigated" : isManglikFromLagna && [1, 4, 7, 8, 12].includes(mars.house) ? "High" : "Moderate",
      isCancelled,
      cancellationReason: isCancelled ? pariharaReasons.join("; ") : undefined,
      involvedPlanets: ["Mars"],
      involvedHouses: [mars.house],
      conditionMet: `Mars occupies House ${mars.house} (${mars.rashi}) from Lagna${isManglikFromMoon ? ` and House ${marsFromMoon} from Moon` : ""}.`,
      effects: isCancelled
        ? `While Mars sits in a Manglik house, classical Parihara applies (${pariharaReasons.join("; ")}), neutralizing marital friction into constructive energy.`
        : "Creates fiery intensity in partnerships, domestic life, and temperament; requires patience, conscious communication, and balanced energy in marriage.",
      remedy: "Recite Hanuman Chalisa or Mangala Stotra on Tuesdays, practice physical discipline, and cultivate patience in relationships."
    });
  }

  // 2. Kaal Sarp Dosha (with all 12 Named Variants)
  const rahuHouse = rahu.house;
  const ketuHouse = ketu.house;
  const arcRahuToKetu: number[] = [];
  const arcKetuToRahu: number[] = [];
  for (let step = 0; step <= 6; step++) {
    arcRahuToKetu.push(((rahuHouse - 1 + step) % 12) + 1);
    arcKetuToRahu.push(((ketuHouse - 1 + step) % 12) + 1);
  }
  const allInRahuToKetu = classicalSeven.every((p) => arcRahuToKetu.includes(p.house));
  const allInKetuToRahu = classicalSeven.every((p) => arcKetuToRahu.includes(p.house));

  if (allInRahuToKetu || allInKetuToRahu) {
    const kaalSarpNames: Record<number, string> = {
      1: "Anant",
      2: "Kulik",
      3: "Vasuki",
      4: "Shankhapal",
      5: "Padma",
      6: "Mahapadma",
      7: "Takshak",
      8: "Karkotak",
      9: "Shankhachud",
      10: "Ghatak",
      11: "Vishdhar",
      12: "Sheshnag"
    };
    const variantName = kaalSarpNames[rahuHouse] || "Classical";
    const planetsWithNodes = classicalSeven.filter((p) => p.house === rahuHouse || p.house === ketuHouse);
    const isPartial = planetsWithNodes.length > 0;

    results.push({
      id: "kaal-sarp-dosha",
      name: `${variantName} Kaal Sarp Dosha${isPartial ? " (Partial / Mitigated)" : ""}`,
      sanskritName: `${variantName} कालसर्प दोष`,
      type: "DOSHA",
      category: "Dosha",
      strength: isPartial ? "Cancelled / Mitigated" : "High",
      isCancelled: isPartial,
      cancellationReason: isPartial
        ? `${planetsWithNodes.map((p) => p.name).join(", ")} shares the nodal axis in House ${planetsWithNodes[0].house}, softening the hemmed pattern.`
        : undefined,
      involvedPlanets: ["Rahu", "Ketu"],
      involvedHouses: [rahuHouse, ketuHouse],
      conditionMet: `All 7 classical planets are hemmed on one side of the Rahu (House ${rahuHouse}) and Ketu (House ${ketuHouse}) nodal axis.`,
      effects: "Produces intense karmic swings, sudden transformations, and deep inner drive that pushes the native toward extraordinary self-mastery after initial hurdles.",
      remedy: "Perform Rudrabhisheka or chant Maha Mrityunjaya Mantra on Mondays and Naga Panchami."
    });
  }

  // 3. Guru Chandal Dosha
  if (jupiter.house === rahu.house || jupiter.house === ketu.house) {
    const nodeName = jupiter.house === rahu.house ? "Rahu" : "Ketu";
    const isMitigated = isOwnOrExalted(jupiter);
    results.push({
      id: "guru-chandal-dosha",
      name: "Guru Chandal Dosha",
      sanskritName: "गुरु चाण्डाल दोष",
      type: "DOSHA",
      category: "Dosha",
      strength: isMitigated ? "Cancelled / Mitigated" : "Moderate",
      isCancelled: isMitigated,
      cancellationReason: isMitigated ? `Jupiter is in ${jupiter.rashi} (own/exalted dignity), preserving wisdom and ethical clarity.` : undefined,
      involvedPlanets: ["Jupiter", nodeName],
      involvedHouses: [jupiter.house],
      conditionMet: `Jupiter is conjunct ${nodeName} in House ${jupiter.house} (${jupiter.rashi}).`,
      effects: "Challenges traditional belief systems and mentorship, urging independent philosophical inquiry while requiring care against impulsive judgment.",
      remedy: "Honor teachers and elders, chant Vishnu Sahasranama on Thursdays, and donate yellow grains or books."
    });
  }

  // 4. Surya Grahan Dosha
  if (sun.house === rahu.house || sun.house === ketu.house) {
    const nodeName = sun.house === rahu.house ? "Rahu" : "Ketu";
    results.push({
      id: "surya-grahan-dosha",
      name: "Surya Grahan (Solar Eclipse) Dosha",
      sanskritName: "सूर्य ग्रहण दोष",
      type: "DOSHA",
      category: "Dosha",
      strength: isOwnOrExalted(sun) ? "Cancelled / Mitigated" : "Moderate",
      isCancelled: isOwnOrExalted(sun),
      cancellationReason: isOwnOrExalted(sun) ? `Sun is strong in ${sun.rashi}, mitigating eclipse fluctuations.` : undefined,
      involvedPlanets: ["Sun", nodeName],
      involvedHouses: [sun.house],
      conditionMet: `Sun is conjunct ${nodeName} in House ${sun.house} (${sun.rashi}).`,
      effects: "Creates periodic tests of self-confidence, authority figures, or vitality, teaching authentic inner leadership free from ego.",
      remedy: "Offer Arghya (water) to the rising Sun and recite Aditya Hridaya Stotra on Sundays."
    });
  }

  // 5. Chandra Grahan Dosha
  if (moon.house === rahu.house || moon.house === ketu.house) {
    const nodeName = moon.house === rahu.house ? "Rahu" : "Ketu";
    results.push({
      id: "chandra-grahan-dosha",
      name: "Chandra Grahan (Lunar Eclipse) Dosha",
      sanskritName: "चन्द्र ग्रहण दोष",
      type: "DOSHA",
      category: "Dosha",
      strength: isOwnOrExalted(moon) ? "Cancelled / Mitigated" : "Moderate",
      isCancelled: isOwnOrExalted(moon),
      cancellationReason: isOwnOrExalted(moon) ? `Moon is strong in ${moon.rashi}, stabilizing emotional equanimity.` : undefined,
      involvedPlanets: ["Moon", nodeName],
      involvedHouses: [moon.house],
      conditionMet: `Moon is conjunct ${nodeName} in House ${moon.house} (${moon.rashi}).`,
      effects: "Heightens psychic sensitivity, overthinking, and emotional tides; calls for mindfulness, grounding, and emotional boundaries.",
      remedy: "Practice daily pranayama/meditation and chant 'Om Namah Shivaya' on Mondays."
    });
  }

  // 6. Angarak Dosha
  if (mars.house === rahu.house || mars.house === ketu.house) {
    const nodeName = mars.house === rahu.house ? "Rahu" : "Ketu";
    const isMitigated = doesPlanetAspectHouse(jupiter, mars.house) || jupiter.house === mars.house;
    results.push({
      id: "angarak-dosha",
      name: "Angarak Dosha",
      sanskritName: "अङ्गारक दोष",
      type: "DOSHA",
      category: "Dosha",
      strength: isMitigated ? "Cancelled / Mitigated" : "Moderate",
      isCancelled: isMitigated,
      cancellationReason: isMitigated ? "Jupiter's aspect/conjunction cools and directs the volatile Mars-Node energy constructively." : undefined,
      involvedPlanets: ["Mars", nodeName],
      involvedHouses: [mars.house],
      conditionMet: `Mars is conjunct ${nodeName} in House ${mars.house} (${mars.rashi}).`,
      effects: "Amplifies fiery drive, impatience, and sudden bursts of ambition; needs disciplined channeling to avoid rash decisions or conflicts.",
      remedy: "Chant Hanuman Chalisa and practice calm deliberation before high-stakes actions."
    });
  }

  // 7. Shrapit Dosha
  if (saturn.house === rahu.house) {
    const isMitigated = doesPlanetAspectHouse(jupiter, saturn.house) || jupiter.house === saturn.house;
    results.push({
      id: "shrapit-dosha",
      name: "Shrapit Dosha",
      sanskritName: "श्रापित दोष",
      type: "DOSHA",
      category: "Dosha",
      strength: isMitigated ? "Cancelled / Mitigated" : "Moderate",
      isCancelled: isMitigated,
      cancellationReason: isMitigated ? "Jupiter's grace aspects/conjoins the Saturn-Rahu conjunction." : undefined,
      involvedPlanets: ["Saturn", "Rahu"],
      involvedHouses: [saturn.house],
      conditionMet: `Saturn and Rahu are conjunct in House ${saturn.house} (${saturn.rashi}).`,
      effects: "Indicates deep ancestral/karmic responsibilities and delayed rewards that mature through ethical perseverance and service.",
      remedy: "Serve the elderly or underprivileged on Saturdays and light a sesame oil lamp under a Peepal tree."
    });
  }

  // 8. Vish Dosha
  if (saturn.house === moon.house) {
    const isMitigated = isOwnOrExalted(moon) || isOwnOrExalted(saturn) || doesPlanetAspectHouse(jupiter, moon.house);
    results.push({
      id: "vish-dosha",
      name: "Vish (Chandra-Shani) Dosha",
      sanskritName: "विष दोष",
      type: "DOSHA",
      category: "Dosha",
      strength: isMitigated ? "Cancelled / Mitigated" : "Moderate",
      isCancelled: isMitigated,
      cancellationReason: isMitigated ? "Planetary dignity or Jupiter's aspect turns melancholy into mature contemplative wisdom." : undefined,
      involvedPlanets: ["Moon", "Saturn"],
      involvedHouses: [moon.house],
      conditionMet: `Moon and Saturn are conjunct in House ${moon.house} (${moon.rashi}).`,
      effects: "Brings emotional seriousness, self-criticism, and heavy sense of duty early in life, maturing into deep stoic wisdom.",
      remedy: "Offer water and milk to Shiva Lingam on Mondays and avoid isolation when feeling burdened."
    });
  }

  // 9. Pitra Dosha
  const rahuKetuIn9 = rahu.house === 9 || ketu.house === 9;
  const sunWithSatOrNodes = sun.house === saturn.house || sun.house === rahu.house || sun.house === ketu.house;
  if (rahuKetuIn9 || (sunWithSatOrNodes && [1, 5, 8, 9, 12].includes(sun.house))) {
    const invPlanets = rahuKetuIn9 ? [rahu.house === 9 ? "Rahu" : "Ketu"] : ["Sun", ...(sun.house === saturn.house ? ["Saturn"] : []), ...(sun.house === rahu.house ? ["Rahu"] : []), ...(sun.house === ketu.house ? ["Ketu"] : [])];
    results.push({
      id: "pitra-dosha",
      name: "Pitra Dosha",
      sanskritName: "पितृ दोष",
      type: "DOSHA",
      category: "Dosha",
      strength: "Moderate",
      involvedPlanets: invPlanets,
      involvedHouses: [rahuKetuIn9 ? 9 : sun.house],
      conditionMet: rahuKetuIn9
        ? `${rahu.house === 9 ? "Rahu" : "Ketu"} occupies the 9th House of ancestors and Dharma (${houses[8].rashiName}).`
        : `Sun in House ${sun.house} (${sun.rashi}) is afflicted by conjunction with ${invPlanets.slice(1).join("/")}.`,
      effects: "Reflects unfinished ancestral karmic duties or lineage patterns; honoring family roots unlocks stalled blessings and career progress.",
      remedy: "Perform Pitru Tarpan during Pitru Paksha/Amavasya, feed crows/cows, and honor elders."
    });
  }

  // 10. Kemadruma Dosha (with Kemadruma Bhanga cancellation)
  if (in2ndFromMoon.length === 0 && in12thFromMoon.length === 0) {
    const planetsWithMoon = lunarFlankCandidates.filter((p) => p.house === moon.house);
    const planetsInMoonKendra = lunarFlankCandidates.filter((p) => kendras.includes(getRelativeHouse(moon.house, p.house)));
    const planetsInLagnaKendra = lunarFlankCandidates.filter((p) => kendras.includes(p.house));

    const bhangaReasons: string[] = [];
    if (planetsWithMoon.length > 0) bhangaReasons.push(`Moon is conjoined with ${planetsWithMoon.map((p) => p.name).join(", ")}`);
    if (planetsInMoonKendra.length > 0) bhangaReasons.push(`${planetsInMoonKendra.map((p) => p.name).join(", ")} occupy Kendra from Moon`);
    if (planetsInLagnaKendra.length > 0) bhangaReasons.push(`${planetsInLagnaKendra.map((p) => p.name).join(", ")} occupy Kendra from Lagna`);

    const isCancelled = bhangaReasons.length > 0;
    results.push({
      id: "kemadruma-dosha",
      name: isCancelled ? "Kemadruma Dosha (Kemadruma Bhanga / Cancelled)" : "Kemadruma Dosha",
      sanskritName: "केमद्रुम दोष",
      type: "DOSHA",
      category: "Dosha",
      strength: isCancelled ? "Cancelled / Mitigated" : "Moderate",
      isCancelled,
      cancellationReason: isCancelled ? bhangaReasons.join("; ") : undefined,
      involvedPlanets: ["Moon"],
      involvedHouses: [moon.house],
      conditionMet: `No classical planets (excluding Sun, Rahu, Ketu) occupy the 2nd or 12th house from Natal Moon (House ${moon.house}).`,
      effects: isCancelled
        ? `Although the houses adjacent to the Moon are empty, Kemadruma Bhanga applies (${bhangaReasons.join("; ")}), providing strong support and self-reliance.`
        : "Can cause periods of emotional solitude or feeling unsupported by others, teaching deep inner self-sufficiency.",
      remedy: "Keep a silver square or worship Lord Shiva and Goddess Parvati on Mondays."
    });
  }

  // 11. Shakat Dosha (Moon in 6th, 8th, or 12th from Jupiter)
  const moonRelJup = getRelativeHouse(jupiter.house, moon.house);
  if (moonRelJup === 6 || moonRelJup === 8 || moonRelJup === 12) {
    const isCancelled = kendras.includes(moon.house) || kendras.includes(jupiter.house) || isOwnOrExalted(moon) || isOwnOrExalted(jupiter);
    results.push({
      id: "shakat-dosha",
      name: isCancelled ? "Shakat Dosha (Mukta / Cancelled)" : "Shakat Dosha",
      sanskritName: "शकट दोष",
      type: "DOSHA",
      category: "Dosha",
      strength: isCancelled ? "Cancelled / Mitigated" : "Moderate",
      isCancelled,
      cancellationReason: isCancelled ? "Moon or Jupiter sits in a Kendra or in own/exalted sign, stabilizing fortune." : undefined,
      involvedPlanets: ["Moon", "Jupiter"],
      involvedHouses: [moon.house, jupiter.house],
      conditionMet: `Moon (House ${moon.house}) sits in the ${moonRelJup}th house from Jupiter (House ${jupiter.house}).`,
      effects: isCancelled
        ? "Cyclical ups and downs of the wheel of fortune are stabilized by strong angular/dignified placement of Moon or Jupiter."
        : "Brings wheel-like fluctuations in cash flow and emotional peace, teaching prudent savings and adaptability.",
      remedy: "Offer prayers to Lord Ganesha and Guru Dakshinamurthy on Thursdays."
    });
  }

  // 12. Papa Kartari Dosha (Lagna hemmed between natural malefics in 2nd and 12th)
  const maleficsIn2ndLagna = NATURAL_MALEFICS.filter((m) => planets[m].house === 2);
  const maleficsIn12thLagna = NATURAL_MALEFICS.filter((m) => planets[m].house === 12);
  if (maleficsIn2ndLagna.length > 0 && maleficsIn12thLagna.length > 0 && beneficsIn2ndLagna.length === 0 && beneficsIn12thLagna.length === 0) {
    results.push({
      id: "papa-kartari-dosha",
      name: "Papa Kartari Dosha (Lagna)",
      sanskritName: "पाप कर्तरी दोष",
      type: "DOSHA",
      category: "Dosha",
      strength: "Moderate",
      involvedPlanets: [...maleficsIn2ndLagna, ...maleficsIn12thLagna],
      involvedHouses: [1, 2, 12],
      conditionMet: `Lagna (House 1) is hemmed between malefics in House 2 (${maleficsIn2ndLagna.join(", ")}) and House 12 (${maleficsIn12thLagna.join(", ")}).`,
      effects: "Creates external pressures or constraints that test patience and physical vitality before breakthroughs occur.",
      remedy: "Strengthen the Lagna Lord through daily mantra japa and disciplined health routines."
    });
  }

  // 13. Gandanta Dosha (Water-Fire Junction within 3°20')
  const gandantaBodies: { name: string; house: number; desc: string }[] = [];
  const checkGandanta = (rashiIdx: number, deg: number, label: string, house: number) => {
    const isWaterEnd = [3, 7, 11].includes(rashiIdx) && deg >= 26.6667;
    const isFireStart = [0, 4, 8].includes(rashiIdx) && deg <= 3.3333;
    if (isWaterEnd || isFireStart) {
      gandantaBodies.push({
        name: label,
        house,
        desc: `${label} at ${deg.toFixed(1)}° ${RASHIS[rashiIdx]}`
      });
    }
  };
  checkGandanta(lagnaRashiIndex, lagnaDegree, "Lagna", 1);
  checkGandanta(moon.rashiIndex, moon.rashiDegree, "Moon", moon.house);
  checkGandanta(sun.rashiIndex, sun.rashiDegree, "Sun", sun.house);

  if (gandantaBodies.length > 0) {
    results.push({
      id: "gandanta-dosha",
      name: "Gandanta Junction Dosha",
      sanskritName: "गण्डान्त दोष",
      type: "DOSHA",
      category: "Dosha",
      strength: gandantaBodies.some((b) => b.name === "Moon") ? "High" : "Moderate",
      involvedPlanets: gandantaBodies.filter((b) => b.name !== "Lagna").map((b) => b.name),
      involvedHouses: Array.from(new Set(gandantaBodies.map((b) => b.house))),
      conditionMet: `${gandantaBodies.map((b) => b.desc).join(", ")} falls within the 3°20' water-to-fire karmic knot (Gandanta junction).`,
      effects: "Marks a deep spiritual knot of transformation; brings intense inner awakening and the power to untangle complex life situations.",
      remedy: "Chant Maha Mrityunjaya Mantra and perform Nakshatra Shanti on the birth star day."
    });
  }

  // 14. Astangata (Planetary Combustion near Sun)
  const combustionOrbs: Record<string, number> = {
    Moon: 12,
    Mars: 17,
    Mercury: 14,
    Jupiter: 11,
    Venus: 10,
    Saturn: 15
  };
  const combustPlanets: { planet: PlanetPosition; diff: number }[] = [];
  Object.entries(combustionOrbs).forEach(([pName, maxOrb]) => {
    const p = planets[pName];
    const rawDiff = Math.abs(sun.longitude - p.longitude);
    const diff = rawDiff > 180 ? 360 - rawDiff : rawDiff;
    if (diff <= maxOrb && diff > 0.5) {
      combustPlanets.push({ planet: p, diff });
    }
  });
  if (combustPlanets.length > 0) {
    results.push({
      id: "astangata-combustion",
      name: `Astangata (Combustion of ${combustPlanets.map((c) => c.planet.name).join(", ")})`,
      sanskritName: "अस्तङ्गत दोष",
      type: "DOSHA",
      category: "Dosha",
      strength: "Moderate",
      involvedPlanets: ["Sun", ...combustPlanets.map((c) => c.planet.name)],
      involvedHouses: Array.from(new Set(combustPlanets.map((c) => c.planet.house))),
      conditionMet: `${combustPlanets.map((c) => `${c.planet.name} (${c.diff.toFixed(1)}° from Sun)`).join(", ")} within solar combustion orb in House ${sun.house}.`,
      effects: "Internalizes and purifies the significations of the combust planet through the Sun's heat; external results mature after ego-refinement.",
      remedy: "Honor the Sun at dawn and strengthen the combust planet's significations through selfless service."
    });
  }

  return results;
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
