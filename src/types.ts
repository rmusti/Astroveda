/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KundliData } from "./utils/astrologyCalc";

export interface KundliInputs {
  name: string;
  birthPlace: string;
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:MM
  latitude: number;
  longitude: number;
  timezone: number;
  isCustomCoordinates: boolean;
}

export type ChartStyle = "NORTH_INDIAN" | "SOUTH_INDIAN";

export type ActiveTab = "chart" | "strengths" | "insights" | "horoscope";

export interface TransitState {
  isCalculating: boolean;
  transitDate: string; // YYYY-MM-DD
  transitTime: string; // HH:MM
  data: KundliData | null;
  horoscopeReport: string | null;
  isLoadingHoroscope: boolean;
}
