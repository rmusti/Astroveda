/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { VimshottariDashaData, AntardashaPeriod } from "../utils/astrologyCalc";

interface VimshottariDashaViewProps {
  dasha: VimshottariDashaData;
}

export const VimshottariDashaView: React.FC<VimshottariDashaViewProps> = ({ dasha }) => {
  const [selectedMahaCode, setSelectedMahaCode] = useState<string>("ALL");

  const nowMs = Date.now();

  // Find active Mahadasha, Antardasha, and Pratyantardasha for today's date
  const activeAntardasha = dasha.allAntardashas.find(
    (a) => nowMs >= a.startDate.getTime() && nowMs <= a.endDate.getTime()
  );
  const activePratyantardasha = activeAntardasha?.pratyantardashas.find(
    (p) => nowMs >= p.startDate.getTime() && nowMs <= p.endDate.getTime()
  );

  // Filter Antardashas based on selected Mahadasha pill
  const displayedAntardashas: AntardashaPeriod[] =
    selectedMahaCode === "ALL"
      ? dasha.allAntardashas
      : dasha.allAntardashas.filter((a) => a.mahadashaCode === selectedMahaCode);

  return (
    <div className="bg-[#f2f2f2] dark:bg-slate-900/40 p-4 md:p-6 rounded-xs space-y-5 text-neutral-900 dark:text-slate-200 font-sans border border-transparent dark:border-slate-800 transition-colors">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-950 border border-neutral-300 dark:border-slate-800 shadow-xs px-6 py-4 flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div>
          <h2 className="text-2xl font-normal text-neutral-950 dark:text-slate-100 tracking-normal">
            Vimshottari Dasha
          </h2>
          <p className="text-xs text-neutral-500 dark:text-slate-400 font-mono mt-1">
            Birth Balance of {dasha.birthNakshatraLord} ({dasha.birthNakshatraCode}):{" "}
            <span className="font-semibold text-neutral-800 dark:text-slate-200">{dasha.balanceText}</span>
            {activeAntardasha && (
              <span className="ml-3 pl-3 border-l border-neutral-300 dark:border-slate-700 text-amber-800 dark:text-amber-400 font-semibold">
                Current Period: {activeAntardasha.mahadashaCode} -- {activeAntardasha.antardashaCode}
                {activePratyantardasha ? ` -- ${activePratyantardasha.code}` : ""}
              </span>
            )}
          </p>
        </div>

        {/* Mahadasha Filter / Jump Bar */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedMahaCode("ALL")}
            className={`px-2.5 py-1 text-xs font-mono uppercase border transition-colors cursor-pointer ${
              selectedMahaCode === "ALL"
                ? "bg-neutral-900 dark:bg-amber-500 text-white dark:text-slate-950 border-neutral-900 dark:border-amber-500 font-bold"
                : "bg-neutral-100 dark:bg-slate-900 text-neutral-700 dark:text-slate-300 border-neutral-300 dark:border-slate-800 hover:bg-neutral-200 dark:hover:bg-slate-800"
            }`}
          >
            All (120Y)
          </button>
          {dasha.mahadashas.map((maha) => {
            const isCurrentMaha =
              nowMs >= maha.startDate.getTime() && nowMs <= maha.endDate.getTime();
            const isSelected = selectedMahaCode === maha.code;
            return (
              <button
                key={maha.code}
                type="button"
                onClick={() => setSelectedMahaCode(maha.code)}
                title={`${maha.planet} Mahadasha (${maha.formattedStartDate.trim()} - ${maha.formattedEndDate.trim()})`}
                className={`px-2.5 py-1 text-xs font-mono uppercase border transition-colors cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? "bg-neutral-900 dark:bg-amber-500 text-white dark:text-slate-950 border-neutral-900 dark:border-amber-500 font-bold"
                    : isCurrentMaha
                    ? "bg-[#fdf8e1] dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 border-amber-400 dark:border-amber-500/40 hover:bg-amber-100 dark:hover:bg-amber-950/50 font-semibold"
                    : "bg-white dark:bg-slate-900 text-neutral-700 dark:text-slate-300 border-neutral-300 dark:border-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>{maha.code}</span>
                {isCurrentMaha && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? "bg-amber-400 dark:bg-slate-950" : "bg-amber-600 dark:bg-amber-400"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Sub Periods Main Table Card */}
      <div className="bg-white dark:bg-slate-950 border border-neutral-300 dark:border-slate-800 shadow-xs transition-colors">
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xl font-normal text-neutral-950 dark:text-slate-100">Sub-Sub Periods</h3>
          <span className="text-xs font-mono text-neutral-500 dark:text-slate-400">
            {displayedAntardashas.length} Bhukti Periods
          </span>
        </div>

        {/* 3-Column Printout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3">
          {displayedAntardashas.map((antar, idx) => {
            // Middle column of each 3-column row has the cream tint (#fdf8e1) in light mode and warm amber tint in dark mode
            const isMiddleColumn = idx % 3 === 1;
            const isCurrentAntar =
              nowMs >= antar.startDate.getTime() && nowMs <= antar.endDate.getTime();

            return (
              <div
                key={`${antar.mahadashaCode}-${antar.antardashaCode}-${idx}`}
                className={`py-6 px-4 text-center font-mono text-[13.5px] leading-[2.25] text-neutral-800 dark:text-slate-300 border-b border-neutral-100 dark:border-slate-800/80 relative transition-colors ${
                  isMiddleColumn
                    ? "bg-[#fdf8e1] dark:bg-slate-900/70"
                    : "bg-white dark:bg-slate-950"
                } ${isCurrentAntar ? "ring-1 ring-inset ring-amber-500/70" : ""}`}
              >
                {isCurrentAntar && (
                  <span className="absolute top-2 right-2 text-[9px] font-sans font-bold uppercase tracking-wider bg-amber-500 text-white dark:text-slate-950 px-1.5 py-0.5 rounded-xs">
                    Active
                  </span>
                )}

                <div className="tracking-widest text-neutral-600 dark:text-slate-600 select-none">-----------</div>
                <div className="font-normal text-neutral-900 dark:text-amber-400">
                  {antar.mahadashaCode} -- {antar.antardashaCode}
                </div>
                <div className="tracking-widest text-neutral-600 dark:text-slate-600 select-none">-----------</div>

                <div>{antar.formattedStartDate}</div>
                <div>{antar.formattedEndDate}</div>

                <div className="tracking-widest text-neutral-600 dark:text-slate-600 select-none">-----------</div>

                <div className="mt-1">
                  {antar.pratyantardashas.map((p) => {
                    const isCurrentPratyantar =
                      isCurrentAntar &&
                      nowMs >= p.startDate.getTime() &&
                      nowMs <= p.endDate.getTime();

                    return (
                      <div
                        key={`${p.code}-${p.formattedEndDate}`}
                        className={
                          isCurrentPratyantar
                            ? "font-bold text-amber-950 dark:text-amber-200 bg-amber-300/40 dark:bg-amber-500/20"
                            : ""
                        }
                      >
                        {p.code} {p.formattedEndDate}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
