/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  User,
  Compass,
  BookOpen,
  Compass as ChartIcon,
  HelpCircle,
  Eye,
  Settings,
  Flame,
  Globe,
  RefreshCw,
  TrendingUp,
  RotateCcw
} from "lucide-react";

import {
  generateKundli,
  KundliData,
  RASHIS,
  RASHI_SANSKRIT,
  PLANET_SANSKRIT,
  getHouseSignificance,
  RASHI_RULERS,
  PlanetPosition
} from "./utils/astrologyCalc";

import { NorthIndianChart } from "./components/NorthIndianChart";
import { SouthIndianChart } from "./components/SouthIndianChart";
import { MarkdownRenderer } from "./components/MarkdownRenderer";
import { ActiveTab, ChartStyle, KundliInputs, TransitState } from "./types";



export default function App() {
  // --- Form & General State ---
  const [inputs, setInputs] = useState<KundliInputs>({
    name: "",
    birthPlace: "",
    birthDate: "1995-08-15",
    birthTime: "08:30",
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 5.5,
    isCustomCoordinates: false
  });

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

  // Calculated Kundli State
  const [calculatedData, setCalculatedData] = useState<KundliData | null>(null);
  
  // Chart Visual Preferences
  const [chartStyle, setChartStyle] = useState<ChartStyle>("NORTH_INDIAN");
  const [chartDivisional, setChartDivisional] = useState<"D1" | "D9">("D1");

  // Interaction Focus States (for highlighting and drill-down analytics)
  const [activeTab, setActiveTab] = useState<ActiveTab>("chart");
  const [focusedHouse, setFocusedHouse] = useState<number | null>(null);
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);

  // --- AI Report States ---
  const [astroReport, setAstroReport] = useState<string | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // --- Dynamic Real-Time Transit States ---
  const [transitState, setTransitState] = useState<TransitState>({
    isCalculating: false,
    transitDate: new Date().toISOString().split("T")[0],
    transitTime: "12:00",
    data: null,
    horoscopeReport: null,
    isLoadingHoroscope: false
  });

  // Calculate current transits based on current local computer time on load
  const loadCurrentLocalTransits = () => {
    const now = new Date();
    const tzOffsetDecimal = now.getTimezoneOffset() / -60.0;
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const mins = String(now.getMinutes()).padStart(2, "0");

    const dateStr = `${year}-${month}-${day}`;
    const timeStr = `${hours}:${mins}`;

    // Calculate transit indices on New Delhi standard location coordinates for global coherence, or user's local coords
    const transitCalculated = generateKundli(
      "Transit Planets",
      "Dynamic Transit Location",
      dateStr,
      timeStr,
      28.6139,
      77.2090,
      5.5
    );

    setTransitState((prev) => ({
      ...prev,
      transitDate: dateStr,
      transitTime: timeStr,
      data: transitCalculated
    }));
  };

  useEffect(() => {
    // Automatically pre-load live Keplerian transits for "today"
    loadCurrentLocalTransits();
  }, []);

  // --- Location Autocorrection & Geocoding via Backend ---
  const triggerGeocoding = async () => {
    if (!inputs.birthPlace.trim()) {
      setGeocodingError("Please enter a birth place first.");
      return;
    }
    setIsGeocoding(true);
    setGeocodingError(null);

    try {
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: inputs.birthPlace, dateString: inputs.birthDate })
      });

      if (!response.ok) {
        throw new Error("Failed to geocode location.");
      }

      const raw = await response.json();
      setInputs((prev) => ({
        ...prev,
        latitude: parseFloat(raw.latitude.toFixed(4)),
        longitude: parseFloat(raw.longitude.toFixed(4)),
        timezone: parseFloat(raw.timezone.toFixed(2)),
        birthPlace: raw.formattedAddress
      }));
    } catch (err: any) {
      console.error(err);
      setGeocodingError("Could not resolve location coordinates. Try entering them manually.");
    } finally {
      setIsGeocoding(false);
    }
  };

  // --- Calculate Kundli Trigger ---
  const handleCalculateKundli = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputs.name.trim()) {
      alert("Please enter a seeker's name.");
      return;
    }

    const calculated = generateKundli(
      inputs.name,
      inputs.birthPlace || "Custom Coordinates",
      inputs.birthDate,
      inputs.birthTime,
      inputs.latitude,
      inputs.longitude,
      inputs.timezone
    );

    setCalculatedData(calculated);
    setAstroReport(null); // Clear older report
    setSelectedHouse(null);
    setFocusedHouse(null);
    setActiveTab("chart");
  };



  // --- Request Detailed Astro Insights from Gemini API ---
  const fetchDeepAstroInsights = async () => {
    if (!calculatedData) return;
    setIsLoadingReport(true);
    setReportError(null);

    try {
      const response = await fetch("/api/kundli-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kundliData: calculatedData })
      });

      if (!response.ok) {
        throw new Error("Failed to compile astrological analysis.");
      }

      const raw = await response.json();
      setAstroReport(raw.report);
    } catch (err: any) {
      console.error(err);
      setReportError("Astrology engine timed out or is unconfigured. Please ensure GEMINI_API_KEY is supplied.");
    } finally {
      setIsLoadingReport(false);
    }
  };

  // --- Request Daily Transit Horoscope Predictions ---
  const fetchTransitHoroscope = async () => {
    if (!calculatedData || !transitState.data) return;
    setTransitState(prev => ({ ...prev, isLoadingHoroscope: true, horoscopeReport: null }));

    try {
      const response = await fetch("/api/transit-horoscope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          natalPlanets: calculatedData.planets,
          transitPlanets: transitState.data.planets,
          name: calculatedData.name
        })
      });

      if (!response.ok) {
        throw new Error("Failed to receive transit forecast.");
      }

      const raw = await response.json();
      setTransitState(prev => ({ ...prev, horoscopeReport: raw.horoscope }));
    } catch (err: any) {
      console.error(err);
      setTransitState(prev => ({
        ...prev,
        horoscopeReport: `### Gochara Analysis Failed\n\nCould not compile predictions. Ensure your Gemini API key is configured inside secrets.`
      }));
    } finally {
      setTransitState(prev => ({ ...prev, isLoadingHoroscope: false }));
    }
  };

  // Calculate customized navamsha-ready mock structures or true ones for transit
  const handleRecalculateTransits = () => {
    const transitCalculated = generateKundli(
      "Transit Planets",
      "Dynamic Transit Location",
      transitState.transitDate,
      transitState.transitTime,
      28.6139,
      77.2090,
      5.5
    );

    setTransitState((prev) => ({
      ...prev,
      data: transitCalculated,
      horoscopeReport: null
    }));
  };

  // Drilldown analytics for focused house
  const focusHouseInfo = selectedHouse || focusedHouse;

  // Compile planets residing in current selected/focused house
  const focalPlanets = focusHouseInfo && calculatedData
    ? (Object.values(calculatedData.planets) as PlanetPosition[]).filter(p => p.house === focusHouseInfo)
    : [];

  // Compile aspects cast upon this focused house
  const focalAspects = focusHouseInfo && calculatedData
    ? calculatedData.aspects.filter(asp => asp.includes(`aspects House ${focusHouseInfo}`))
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col selection:bg-amber-600/30 selection:text-amber-300 font-sans">
      
      {/* Visual background ambient yantra/stars grids */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900/30 via-slate-950 to-slate-950 pointer-events-none z-0" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-500/5 pointer-events-none blur-3xl" />

      {/* Primary Header */}
      <header className="relative z-10 h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-8 text-slate-200">
        <div className="flex items-center gap-4">
          {/* Geometric Balance Rotated Square Emblem */}
          <div className="w-8 h-8 border-2 border-amber-500 rotate-45 flex items-center justify-center shrink-0">
            <div className="w-4 h-4 bg-amber-500" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-[0.2em] text-amber-500 uppercase flex items-center gap-3">
              ASTROVEDA
              <span className="text-[9px] font-mono tracking-widest uppercase bg-slate-950 border border-slate-800 px-1.5 py-0.5 font-normal text-slate-400">
                NIRAYANA LAHIRI
              </span>
            </h1>
          </div>
        </div>

        {/* Live Ephemeris Ticker */}
        {transitState.data && (
          <div className="hidden md:flex items-center gap-4 bg-slate-950 border border-slate-800 px-4 py-1.5 text-[10px] font-mono text-slate-400 tracking-wider uppercase">
            <span className="flex items-center gap-1.5 shrink-0 font-bold text-amber-500">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Live Transits:
            </span>
            <div className="flex gap-4 overflow-x-auto whitespace-nowrap scrollbar-none max-w-[320px]">
              {(Object.values(transitState.data.planets) as PlanetPosition[]).slice(0, 5).map(p => (
                <span key={p.name} className="hover:text-amber-400 transition-colors normal-case">
                  {p.name.slice(0, 2)} in {p.rashi.slice(0, 3)} ({Math.floor(p.rashiDegree)}°)
                </span>
              ))}
            </div>
            <button
              onClick={loadCurrentLocalTransits}
              title="Recalculate live transits"
              className="hover:text-amber-400 transition-colors border-l border-slate-800 pl-2 ml-1"
            >
              <RefreshCw className="w-3 h-3 animate-spin-slow" />
            </button>
          </div>
        )}
      </header>

      {/* Main Container Grid */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-[380px_1fr] divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
        
        {/* SIDEBAR FOR INPUT FORM --- */}
        <section className="w-full lg:w-[380px] p-6 flex flex-col gap-6 bg-slate-950 border-r border-slate-800 overflow-y-auto max-h-none lg:max-h-[calc(100vh-96px)]">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-amber-500" /> CHART CONFIGURATION
            </h2>
            <p className="text-[11px] text-slate-500 leading-normal">
              Input precise parameters to resolve a mathematically congruent Nirayana Vedic natal chart.
            </p>
          </div>



          <form onSubmit={handleCalculateKundli} className="flex flex-col gap-4">
            {/* Seeker Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <User className="w-3 h-3 text-amber-500" /> PERSON NAME
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Priyanth Sharma"
                value={inputs.name}
                onChange={(e) => setInputs(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 p-2.5 text-xs text-slate-100 placeholder:text-slate-650 focus:border-amber-500 focus:outline-none transition-colors font-sans"
              />
            </div>

            {/* DoB & ToB */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-amber-500" /> DATE OF BIRTH
                </label>
                <input
                  type="date"
                  required
                  value={inputs.birthDate}
                  onChange={(e) => setInputs(prev => ({ ...prev, birthDate: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 p-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none transition-colors font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-amber-500" /> TIME OF BIRTH
                </label>
                <input
                  type="time"
                  required
                  value={inputs.birthTime}
                  onChange={(e) => setInputs(prev => ({ ...prev, birthTime: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 p-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none transition-colors font-mono"
                />
              </div>
            </div>

            {/* Place of Birth with AI Geocoding */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-amber-500" /> PLACE OF BIRTH
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Pune, Maharashtra, India"
                  value={inputs.birthPlace}
                  onChange={(e) => setInputs(prev => ({ ...prev, birthPlace: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 pl-3 pr-20 py-2.5 text-xs text-slate-100 placeholder:text-slate-650 focus:border-amber-500 focus:outline-none transition-colors font-sans"
                />
                <button
                  type="button"
                  onClick={triggerGeocoding}
                  disabled={isGeocoding || !inputs.birthPlace}
                  className="absolute right-1 text-[8px] font-mono top-1/2 -translate-y-1/2 h-7 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 px-2 disabled:opacity-40 transition-colors uppercase font-bold tracking-tight cursor-pointer"
                >
                  {isGeocoding ? "Resolving..." : "Geocode"}
                </button>
              </div>
              {geocodingError && (
                <p className="text-[10px] text-red-500 font-mono mt-1">{geocodingError}</p>
              )}
            </div>

            {/* Tweak Coordinates Manually Option */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={inputs.isCustomCoordinates}
                    onChange={(e) => setInputs(prev => ({ ...prev, isCustomCoordinates: e.target.checked }))}
                    className="accent-amber-500"
                  />
                  MANUALLY ADJUST COORDINATES
                </label>
              </div>

              {inputs.isCustomCoordinates && (
                <div className="grid grid-cols-3 gap-2 bg-slate-900/50 border border-slate-800 p-3">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-bold text-slate-500 block uppercase">LAT</span>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={inputs.latitude}
                      onChange={(e) => setInputs(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-slate-950 border border-slate-800 p-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-bold text-slate-500 block uppercase">LON</span>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={inputs.longitude}
                      onChange={(e) => setInputs(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-slate-950 border border-slate-800 p-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-bold text-slate-500 block uppercase">TZ</span>
                    <input
                      type="number"
                      step="0.05"
                      required
                      value={inputs.timezone}
                      onChange={(e) => setInputs(prev => ({ ...prev, timezone: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-slate-950 border border-slate-800 p-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold py-3 text-xs uppercase tracking-widest transition-colors mt-2 border border-amber-500/10 cursor-pointer"
            >
              Calculate Birth Chart
            </button>
          </form>

          {/* Quick Informational Box */}
          <div className="mt-auto border-t border-slate-800 pt-4 text-[10px] text-slate-500 flex flex-col gap-2 uppercase tracking-wide">
            <div className="flex gap-2">
              <span className="text-amber-500 select-none font-bold">✦</span>
              <span><strong>Ayanamsa (Lahiri)</strong> corrections for earth axial precession (~23.9°) to extract sidereal Rashis.</span>
            </div>
            <div className="flex gap-2">
              <span className="text-amber-500 select-none font-bold">✦</span>
              <span><strong>Aspects (Drishti)</strong> reflect standard energetic alignments cast from resident houses onto opposite spheres.</span>
            </div>
          </div>
        </section>

        {/* PRIMARY COMPONENT CANVAS DISPLAY --- */}
        <section className="flex flex-col bg-slate-950 max-h-none lg:max-h-[calc(100vh-96px)] overflow-y-auto flex-1">
          {!calculatedData ? (
            /* EMPTY SCREEN STATE */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950">
              {/* Geometric Balance Rotated Square Loader */}
              <div className="relative w-32 h-32 border-2 border-slate-800 rotate-45 flex items-center justify-center mb-8">
                <div className="absolute inset-2 border border-dashed border-amber-500/25 animate-spin-slow" />
                <Globe className="w-10 h-10 text-amber-500/60 -rotate-45" />
              </div>

              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500 mb-2">
                AWAITING COSMIC ALIGNMENT
              </h2>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-8 uppercase tracking-wider">
                Provide birth parameters in the panel on the left to begin high-accuracy astronomical Kundli calculations.
              </p>
            </div>
          ) : (
            /* CALCULATED REPORT STATE */
            <div className="flex flex-col h-full">
              {/* Profile Bar */}
              <div className="bg-slate-900/20 p-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-slate-500 font-bold">
                    ACTIVE KUNDLI SEEKER
                  </div>
                  <h3 className="text-base font-bold text-slate-200 uppercase tracking-widest">
                    {calculatedData.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 font-mono uppercase tracking-tight">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-amber-500" /> {calculatedData.birthDate}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-500" /> {calculatedData.birthTime}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-amber-500" /> {calculatedData.birthPlace}</span>
                  </div>
                </div>

                {/* Quick Info Badges */}
                <div className="flex flex-wrap gap-2.5">
                  <div className="bg-slate-950 px-4 py-2 border border-slate-800 text-center font-mono text-xs">
                    <span className="text-slate-500 block uppercase text-[8px] tracking-[0.15em] font-bold">Lagna (Ascendant)</span>
                    <span className="text-amber-500 font-bold uppercase">
                      {calculatedData.lagna.rashi} ({Math.floor(calculatedData.lagna.rashiDegree)}°)
                    </span>
                  </div>
                  <div className="bg-slate-950 px-4 py-2 border border-slate-800 text-center font-mono text-xs">
                    <span className="text-slate-500 block uppercase text-[8px] tracking-[0.15em] font-bold">Moon & Nakshatra</span>
                    <span className="text-amber-500 font-bold uppercase">
                      {calculatedData.planets.Moon?.rashi} • {calculatedData.planets.Moon?.nakshatra}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="border-b border-slate-800 bg-slate-950 px-6 flex gap-1">
                <button
                  onClick={() => setActiveTab("chart")}
                  className={`px-5 py-3.5 text-[10px] font-mono font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === "chart"
                      ? "border-amber-500 text-amber-500 bg-slate-900/30"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <ChartIcon className="w-3.5 h-3.5" /> Interactive Chart
                </button>
                <button
                  onClick={() => setActiveTab("strengths")}
                  className={`px-5 py-3.5 text-[10px] font-mono font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === "strengths"
                      ? "border-amber-500 text-amber-500 bg-slate-900/30"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" /> Planetary Placements
                </button>
                <button
                  onClick={() => setActiveTab("insights")}
                  className={`px-5 py-3.5 text-[10px] font-mono font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === "insights"
                      ? "border-amber-500 text-amber-500 bg-slate-900/30"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" /> Deep AI Analysis
                </button>
                <button
                  onClick={() => setActiveTab("horoscope")}
                  className={`px-5 py-3.5 text-[10px] font-mono font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === "horoscope"
                      ? "border-amber-500 text-amber-500 bg-slate-900/30"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" /> Gochara Transits
                </button>
              </div>

              {/* TAB CONTENTS CONTAINER */}
              <div className="flex-1 p-6">
                
                {/* TAB 1: INTERACTIVE CHART VIEW */}
                {activeTab === "chart" && (
                  <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
                    
                    {/* Visualizer Frame */}
                    <div className="bg-slate-900/35 border border-slate-800 p-6 flex flex-col gap-6">
                      
                      {/* Configuration Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider">CHART STYLE:</span>
                          <div className="bg-slate-950 p-1 border border-slate-800 flex gap-1">
                            <button
                              onClick={() => setChartStyle("NORTH_INDIAN")}
                              className={`px-3 py-1 text-[10px] font-mono uppercase cursor-pointer tracking-wider font-bold transition-all ${
                                chartStyle === "NORTH_INDIAN"
                                  ? "bg-amber-600/15 text-amber-500"
                                  : "text-slate-500 hover:text-slate-300"
                              }`}
                            >
                              Diamond
                            </button>
                            <button
                              onClick={() => setChartStyle("SOUTH_INDIAN")}
                              className={`px-3 py-1 text-[10px] font-mono uppercase cursor-pointer tracking-wider font-bold transition-all ${
                                chartStyle === "SOUTH_INDIAN"
                                  ? "bg-amber-600/15 text-amber-500"
                                  : "text-slate-500 hover:text-slate-300"
                              }`}
                            >
                              Square
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider">DIVISIONAL CHART:</span>
                          <div className="bg-slate-950 p-1 border border-slate-800 flex gap-1">
                            <button
                              onClick={() => setChartDivisional("D1")}
                              className={`px-3 py-1 text-[10px] font-mono uppercase cursor-pointer tracking-wider font-bold transition-all ${
                                chartDivisional === "D1"
                                  ? "bg-amber-600/15 text-amber-500"
                                  : "text-slate-500 hover:text-slate-300"
                              }`}
                            >
                              Lagna (D1)
                            </button>
                            <button
                              onClick={() => setChartDivisional("D9")}
                              className={`px-3 py-1 text-[10px] font-mono uppercase cursor-pointer tracking-wider font-bold transition-all ${
                                chartDivisional === "D9"
                                  ? "bg-amber-600/15 text-amber-500"
                                  : "text-slate-500 hover:text-slate-300"
                              }`}
                              title="The Navamsha is the D9 divisional chart, representing the alignment of the soul/psychic matrix"
                            >
                              Navamsha (D9)
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* True Chart Render */}
                      <div className="flex justify-center py-6 bg-slate-950 border border-slate-850">
                        {/* If divisional is D9, we construct a virtual KundliData mapping the computed Navamsha signs to corresponding houses */}
                        {(() => {
                          let renderingData = calculatedData;
                          if (chartDivisional === "D9") {
                            // Map planets based on their D9 navamsha index
                            const d9Planets = { ...calculatedData.planets };
                            // Lagna D9 index
                            const lagnaD9 = calculateNavamshaValue(calculatedData.lagna.longitude);
                            
                            (Object.entries(d9Planets) as [string, PlanetPosition][]).forEach(([name, p]) => {
                              const navamshaRashiIdx = p.navamshaRashiIndex;
                              const d9House = (navamshaRashiIdx - lagnaD9.index + 12) % 12 + 1;
                              
                              d9Planets[name] = {
                                ...p,
                                rashi: p.navamshaRashi,
                                rashiIndex: p.navamshaRashiIndex,
                                rashiDegree: ((p.longitude % 30) * 9) % 30, // approximate degree coordinate inside Navamsha
                                house: d9House
                              };
                            });

                            // Recompile virtual houses list for D9
                            const d9Houses = Array.from({ length: 12 }, (_, hIdx) => {
                              const rIndex = (lagnaD9.index + hIdx) % 12;
                              return {
                                houseNumber: hIdx + 1,
                                rashiIndex: rIndex,
                                rashiName: RASHIS[rIndex]
                              };
                            });

                            renderingData = {
                              ...calculatedData,
                              lagna: {
                                ...calculatedData.lagna,
                                rashi: lagnaD9.rashi,
                                rashiIndex: lagnaD9.index,
                                rashiDegree: 0 // generic
                              },
                              planets: d9Planets,
                              houses: d9Houses
                            };
                          }

                          return chartStyle === "NORTH_INDIAN" ? (
                            <NorthIndianChart
                              data={renderingData}
                              activeHouse={focusedHouse}
                              onHoverHouse={setFocusedHouse}
                              selectedHouse={selectedHouse}
                              onSelectHouse={setSelectedHouse}
                            />
                          ) : (
                            <SouthIndianChart
                              data={renderingData}
                              activeHouse={focusedHouse}
                              onHoverHouse={setFocusedHouse}
                              selectedHouse={selectedHouse}
                              onSelectHouse={setSelectedHouse}
                            />
                          );
                        })()}
                      </div>
                    </div>
                                       {/* Interactive House Placements Drilldown Panel */}
                    <div className="bg-slate-900/35 border border-slate-800 p-5 space-y-5">
                      {focusHouseInfo ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-amber-500">
                              HOUSE {focusHouseInfo} BREAKDOWN
                            </h4>
                            <button
                              onClick={() => setSelectedHouse(null)}
                              className="text-[9px] bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-800 px-2 py-1 font-mono uppercase tracking-widest cursor-pointer"
                            >
                              RESET FOCUS
                            </button>
                          </div>

                          {/* Rashi Ruler Details */}
                          {(() => {
                            const rashiData = calculatedData.houses.find(h => h.houseNumber === focusHouseInfo);
                            const rName = rashiData ? rashiData.rashiName : "";
                            const rSanskrit = rName ? RASHI_SANSKRIT[RASHIS.indexOf(rName)] : "";
                            const rRuler = rName ? RASHI_RULERS[rName] : "";
                            return (
                              <div className="bg-slate-950 p-3 border border-slate-800 text-xs">
                                <span className="text-slate-500 font-mono text-[9px] font-bold block uppercase tracking-wider mb-1">Rashi Domain:</span>
                                <span className="text-slate-200 font-bold uppercase block tracking-wider">{rName} ({rSanskrit})</span>
                                <span className="text-slate-500 font-mono text-[9px] font-bold block uppercase tracking-wider mt-2.5 mb-1">Lord / Ruler:</span>
                                <span className="text-amber-500 font-bold font-mono uppercase">{rRuler} ({PLANET_SANSKRIT[rRuler] || "N/A"})</span>
                              </div>
                            );
                          })()}

                          {/* Significance Description */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold block">
                              VEDIC SIGNIFICANCE
                            </span>
                            <p className="text-xs text-slate-350 leading-relaxed bg-slate-950 p-3 border border-slate-850">
                              {getHouseSignificance(focusHouseInfo)}
                            </p>
                          </div>

                          {/* Planets in this House */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold block">
                              RESIDENT PLACEMENTS
                            </span>
                            {focalPlanets.length === 0 ? (
                              <p className="text-[11px] text-slate-500 font-mono italic">
                                No planets occupy House {focusHouseInfo} (Natal Void).
                              </p>
                            ) : (
                              <div className="space-y-1.5">
                                {(focalPlanets as PlanetPosition[]).map(p => (
                                  <div key={p.name} className="bg-slate-950 p-3 border border-slate-800 flex flex-col gap-1 text-xs">
                                    <div className="flex justify-between items-center text-slate-200 font-sans font-bold uppercase tracking-wider">
                                      <span>{p.name} ({PLANET_SANSKRIT[p.name]})</span>
                                      <span className="font-mono text-amber-500">{Math.floor(p.rashiDegree)}° in {p.rashi}</span>
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-500 uppercase">
                                      {p.nakshatra} Nakshatra, Pada {p.nakshatraPada}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Aspects received by this House */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold block">
                              ASPECTS CAST ON HOUSE {focusHouseInfo} (DRISHTI)
                            </span>
                            {focalAspects.length === 0 ? (
                              <p className="text-[11px] text-slate-500 font-mono italic">
                                No active planetary Drishti is cast on this quadrant.
                              </p>
                            ) : (
                              <ul className="space-y-1.5 font-mono">
                                {focalAspects.map((asp, idx) => (
                                  <li key={idx} className="bg-slate-950 border border-slate-800 p-3 text-[11px] text-slate-400 flex items-start gap-2 leading-relaxed">
                                    <span className="text-amber-500 font-bold">✦</span>
                                    <span>
                                      <strong>{asp.split(" ")[0]}</strong> casts aspect from House {asp.match(/House (\d+) aspects/)?.[1]}.
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                        </div>
                      ) : (
                        <div className="h-[230px] flex flex-col items-center justify-center text-center p-4 bg-slate-950/20 border border-dashed border-slate-850">
                          <HelpCircle className="w-8 h-8 text-slate-700 mb-3" />
                          <h5 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">
                            HOUSE EXPLORATION FOCUS
                          </h5>
                          <p className="text-[11px] text-slate-500 max-w-xs leading-normal uppercase">
                            Hover or click any segment of the Kundli chart to inspect its significance, resident lords, and planetary aspect lines in detail.
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
                )}
                        {/* TAB 2: DETAILED PLANETARY PLACEMENTS GRID */}
                {activeTab === "strengths" && (
                  <div className="bg-slate-900/30 border border-slate-800">
                    <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-amber-500">
                        PLANETARY COORDINATES & DIVISIONAL ALIGNMENT
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">9 BODIES CALLED</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300 border-collapse">
                        <thead className="bg-slate-950/80 font-mono text-[9px] text-slate-500 uppercase tracking-widest border-b border-slate-800">
                          <tr>
                            <th className="px-5 py-3 font-semibold">Planet Name</th>
                            <th className="px-4 py-3 font-semibold">Sanskrit Alias</th>
                            <th className="px-4 py-3 font-semibold">House Position</th>
                            <th className="px-4 py-3 font-semibold">Sidereal Sign</th>
                            <th className="px-4 py-3 font-semibold">Sign Coordinates</th>
                            <th className="px-4 py-3 font-semibold">Nakshatra Mansions</th>
                            <th className="px-4 py-3 font-semibold">Pada</th>
                            <th className="px-4 py-3 font-semibold">Navamsha D9</th>
                            <th className="px-4 py-3 font-semibold">Motion</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {(Object.values(calculatedData.planets) as PlanetPosition[]).map((p) => (
                            <tr key={p.name} className="hover:bg-slate-900/45 transition-colors uppercase font-mono text-[11px] tracking-tight">
                              <td className="px-5 py-3.5 font-bold text-amber-500 flex items-center gap-1.5 font-sans normal-case tracking-normal">
                                <span className={`w-1.5 h-1.5 rounded-none ${
                                  p.name === "Sun" ? "bg-amber-400" : p.name === "Moon" ? "bg-white" : "bg-amber-500"
                                }`} />
                                {p.name}
                              </td>
                              <td className="px-4 py-3.5 italic text-slate-500 normal-case font-sans">
                                {PLANET_SANSKRIT[p.name] || "—"}
                              </td>
                              <td className="px-4 py-3.5 font-bold text-amber-500">
                                House {p.house}
                              </td>
                              <td className="px-4 py-3.5 text-slate-300">
                                {p.rashi}
                              </td>
                              <td className="px-4 py-3.5 text-slate-400">
                                {p.formattedLongitude}
                              </td>
                              <td className="px-4 py-3.5 text-slate-300">
                                {p.nakshatra}
                              </td>
                              <td className="px-4 py-3.5 text-slate-500">
                                Pada {p.nakshatraPada}
                              </td>
                              <td className="px-4 py-3.5 text-slate-300 font-bold">
                                {p.navamshaRashi}
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`px-2 py-0.5 text-[9px] font-bold border ${
                                  p.isRetrograde
                                    ? "bg-red-950/20 text-red-500 border-red-900/50"
                                    : "bg-green-950/20 text-green-500 border-green-900/50"
                                }`}>
                                  {p.isRetrograde ? "Retro" : "Direct"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 3: DEEP AI KUNDLI REPORT INSIGHTS */}
                {activeTab === "insights" && (
                  <div className="bg-slate-900/35 border border-slate-800 p-6 relative">
                    {!astroReport ? (
                      <div className="py-12 flex flex-col items-center justify-center text-center">
                        <BookOpen className="w-10 h-10 text-amber-500/50 mb-4" />
                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500 mb-2">
                          VEDIC AI INTERPRETATION REPORT
                        </h4>
                        <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-6 uppercase tracking-wider">
                          Submit this exact astronomical alignment to the server-side Gemini intelligence to generate a spiritual reading, key yantra remedies, and career alignments.
                        </p>
                        <button
                          onClick={fetchDeepAstroInsights}
                          disabled={isLoadingReport}
                          className="px-6 py-3 bg-slate-950 hover:bg-slate-900 text-slate-200 border border-slate-800 font-mono text-[10px] uppercase font-bold tracking-widest cursor-pointer transition-colors flex items-center gap-2"
                        >
                          {isLoadingReport ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                              CHANNELLING ASTROLOGICAL SAGES...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              GENERATE SPIRITUAL READINGS & REMEDIES
                            </>
                          )}
                        </button>
                        {reportError && (
                          <p className="text-[11px] text-red-500 mt-3 font-mono border border-slate-800 bg-slate-950 px-4 py-2 uppercase tracking-wider">{reportError}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-200 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            Personalized Kundli Synthesis
                          </h4>
                          <button
                            onClick={() => setAstroReport(null)}
                            className="text-[10px] text-slate-500 hover:text-amber-500 flex items-center gap-1.5 font-mono uppercase tracking-widest cursor-pointer"
                          >
                            <RotateCcw className="w-3 text-amber-500" /> RE-EXAMINE
                          </button>
                        </div>

                        {/* Beautifully rendered report using MarkdownRenderer */}
                        <div className="max-w-3xl mx-auto py-2">
                          <MarkdownRenderer content={astroReport} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: GOCHARA TRANSITS & DAILY HOROSCOPE */}
                {activeTab === "horoscope" && (
                  <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6 items-start">
                    
                    {/* Transit positions side comparison */}
                    <div className="bg-slate-900/35 border border-slate-800 p-4 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                          DYNAMIC TRANSIT INPUTS
                        </h4>
                        <span className="text-[9px] font-mono text-green-500 uppercase tracking-wider">LIVE GOCHARA</span>
                      </div>

                      {/* Transit Controls */}
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-widest block">Transit Date</span>
                          <input
                            type="date"
                            value={transitState.transitDate}
                            onChange={(e) => setTransitState(prev => ({ ...prev, transitDate: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 font-mono uppercase focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-widest block">Transit Time (Greenwich)</span>
                          <input
                            type="time"
                            value={transitState.transitTime}
                            onChange={(e) => setTransitState(prev => ({ ...prev, transitTime: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 font-mono uppercase focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={handleRecalculateTransits}
                          className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-amber-500 font-mono text-[10px] uppercase tracking-widest cursor-pointer transition-colors"
                        >
                          Calculate Transit Map
                        </button>
                      </div>

                      <div className="border-t border-slate-800 pt-3 space-y-2">
                        <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold tracking-wider">Transit Rashi Alignments</span>
                        {transitState.data && (
                          <div className="space-y-1">
                            {(Object.values(transitState.data.planets) as PlanetPosition[]).slice(0, 6).map(p => (
                              <div key={p.name} className="flex justify-between items-center text-[10px] font-mono bg-slate-950 px-2.5 py-1.5 border border-slate-900">
                                <span className="text-slate-500">{p.name}:</span>
                                <span className="text-amber-300">{p.rashi.slice(0, 3)} ({Math.floor(p.rashiDegree)}°)</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Daily Horoscope Predictions */}
                    <div className="bg-slate-900/35 border border-slate-800 p-6 relative min-h-[300px]">
                      {!transitState.horoscopeReport ? (
                        <div className="flex flex-col items-center justify-center text-center py-12">
                          <TrendingUp className="w-10 h-10 text-amber-500/50 mb-4" />
                          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500 mb-2">
                            DAILY GOCHARA FORECAST
                          </h4>
                          <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-6 uppercase tracking-wider">
                            Construct a dynamic transit matrix mapping today&apos;s shifting stars relative to your birth matrix, and write a targeted horoscope.
                          </p>
                          <button
                            onClick={fetchTransitHoroscope}
                            disabled={transitState.isLoadingHoroscope}
                            className="px-6 py-3 bg-slate-950 hover:bg-slate-900 text-slate-200 border border-slate-800 font-mono text-[10px] uppercase font-bold tracking-widest cursor-pointer transition-colors flex items-center gap-2"
                          >
                            {transitState.isLoadingHoroscope ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                                ALIGNING TRANSIT ORBS...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                REQUEST DAILY GOCHARA FORECAST
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-200 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-amber-500" />
                              Daily Celestial Horoscope Insights
                            </h4>
                            <button
                              onClick={() => setTransitState(prev => ({ ...prev, horoscopeReport: null }))}
                              className="text-[10px] text-slate-500 hover:text-amber-500 flex items-center gap-1.5 font-mono uppercase tracking-widest cursor-pointer"
                            >
                              <RotateCcw className="w-3 text-amber-500" /> RE-EXAMINE
                            </button>
                          </div>

                          <div className="max-w-2xl mx-auto py-2">
                            <MarkdownRenderer content={transitState.horoscopeReport} />
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                )}

              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

// Simple Helper to calculate Navamsha Rashi divisions from 1st-level degrees for visual charts
function calculateNavamshaValue(longitude: number) {
  const currentRashiIndex = Math.floor(longitude / 30);
  const degreeInRashi = longitude % 30;
  const segment = Math.floor(degreeInRashi / 3.3333333);
  let baseIndex = 0;
  const elementGroup = currentRashiIndex % 4; // 0 = Fire, 1 = Earth, 2 = Air, 3 = Water
  
  if (elementGroup === 0) {
    baseIndex = 0;
  } else if (elementGroup === 1) {
    baseIndex = 9;
  } else if (elementGroup === 2) {
    baseIndex = 6;
  } else {
    baseIndex = 3;
  }
  
  const navamshaIndex = (baseIndex + segment) % 12;
  return {
    rashi: RASHIS[navamshaIndex],
    index: navamshaIndex
  };
}
