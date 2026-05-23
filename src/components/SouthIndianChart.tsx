/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { KundliData, RASHIS, PLANET_SANSKRIT, PlanetPosition } from "../utils/astrologyCalc";

interface SouthIndianChartProps {
  data: KundliData;
  activeHouse: number | null;
  onHoverHouse: (houseNum: number | null) => void;
  selectedHouse: number | null;
  onSelectHouse: (houseNum: number | null) => void;
}

// Fixed mapping in South Indian style: Outer ring clockwise starting with Pisces at (0,0)
// To make rendering robust, we'll map grid cells of a 4x4 layout.
// Row and Column indexes for a 4x4 structure:
interface GridBox {
  rashiIndex: number; // 0 = Aries, 1 = Taurus... 11 = Pisces
  row: number; // 0 to 3
  col: number; // 0 to 3
  name: string;
}

const SOUTH_INDIAN_LAYOUT: GridBox[] = [
  { rashiIndex: 11, row: 0, col: 0, name: "Pisces" },
  { rashiIndex: 0, row: 0, col: 1, name: "Aries" },
  { rashiIndex: 1, row: 0, col: 2, name: "Taurus" },
  { rashiIndex: 2, row: 0, col: 3, name: "Gemini" },
  { rashiIndex: 3, row: 1, col: 3, name: "Cancer" },
  { rashiIndex: 4, row: 2, col: 3, name: "Leo" },
  { rashiIndex: 5, row: 3, col: 3, name: "Virgo" },
  { rashiIndex: 6, row: 3, col: 2, name: "Libra" },
  { rashiIndex: 7, row: 3, col: 1, name: "Scorpio" },
  { rashiIndex: 8, row: 3, col: 0, name: "Sagittarius" },
  { rashiIndex: 9, row: 2, col: 0, name: "Capricorn" },
  { rashiIndex: 10, row: 1, col: 0, name: "Aquarius" },
];

export const SouthIndianChart: React.FC<SouthIndianChartProps> = ({
  data,
  activeHouse,
  onHoverHouse,
  selectedHouse,
  onSelectHouse
}) => {
  const [hoveredHouseLocal, setHoveredHouseLocal] = useState<number | null>(null);

  // Lagna Rashi Index
  const lagnaRashiIndex = data.lagna.rashiIndex;

  // Convert Rashi Index to corresponding House (1 to 12)
  const getHouseNumberForRashi = (rashiIdx: number): number => {
    return ((rashiIdx - lagnaRashiIndex + 12) % 12) + 1;
  };

  const handleMouseEnter = (houseNum: number) => {
    setHoveredHouseLocal(houseNum);
    onHoverHouse(houseNum);
  };

  const handleMouseLeave = () => {
    setHoveredHouseLocal(null);
    onHoverHouse(null);
  };

  // Group planets by Rashi Index
  const planetsByRashi: Record<number, PlanetPosition[]> = {};
  for (let r = 0; r < 12; r++) {
    planetsByRashi[r] = [];
  }
  (Object.values(data.planets) as PlanetPosition[]).forEach((p) => {
    planetsByRashi[p.rashiIndex].push(p);
  });

  const currentHighlight = selectedHouse || hoveredHouseLocal || activeHouse;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full max-w-[450px] aspect-square bg-slate-950 p-[12px] border border-slate-800">
        {/* Render a beautiful 4x4 Grid representation using CSS Grid instead of raw SVG paths */}
        <div className="grid grid-cols-4 grid-rows-4 gap-1 w-full h-full bg-slate-900 p-1">
          {/* Inner Central Space (Row 2, Col 2) */}
          <div className="col-start-2 col-end-4 row-start-2 row-end-4 bg-slate-950 flex flex-col items-center justify-center p-3 text-center border border-slate-800">
            <h4 className="text-amber-500 text-xs font-bold tracking-[0.2em] uppercase mb-1">
              RASHI CHART
            </h4>
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-bold">
              LAGNA: {data.lagna.rashi.slice(0, 3)}
            </div>
            <div className="text-[10px] text-slate-650 mt-1 font-mono uppercase">
              {data.lagna.formattedLongitude.split(" ")[0]}
            </div>
          </div>

          {/* Render the 12 Outer astrological boundary boxes */}
          {SOUTH_INDIAN_LAYOUT.map((box) => {
            const isLagnaBox = box.rashiIndex === lagnaRashiIndex;
            const houseNum = getHouseNumberForRashi(box.rashiIndex);
            const planets = planetsByRashi[box.rashiIndex];
            const isHighlighted = currentHighlight === houseNum;

            // Generate CSS classes for Row & Column offsets (1-indexed CSS Grid)
            const style = {
              gridRowStart: box.row + 1,
              gridColumnStart: box.col + 1,
            };

            return (
              <div
                key={box.rashiIndex}
                style={style}
                onMouseEnter={() => handleMouseEnter(houseNum)}
                onMouseLeave={handleMouseLeave}
                onClick={() => onSelectHouse(selectedHouse === houseNum ? null : houseNum)}
                className={`relative flex flex-col justify-between p-2 cursor-pointer transition-all duration-300 rounded-none border text-left ${
                  isHighlighted
                    ? "bg-amber-900/15 border-amber-500 scale-[1.01] z-10"
                    : "bg-slate-950 border-slate-850 hover:bg-slate-900/40"
                }`}
              >
                {/* Sign Name & House Number Indicator */}
                <div className="flex justify-between items-start">
                  <span className="font-mono font-bold text-[9px] text-slate-500 uppercase tracking-wider">
                    {box.name.slice(0, 3)}
                  </span>
                  <span className={`font-mono font-bold text-[8px] px-1 rounded-none uppercase tracking-widest ${
                    houseNum === 1
                      ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                      : "bg-slate-900 text-slate-500 border border-slate-800"
                  }`}>
                    H{houseNum}
                  </span>
                </div>

                {/* Lagna marker diagonal strike representation */}
                {isLagnaBox && (
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 rotate-12 flex items-center justify-center pointer-events-none">
                    <span className="font-mono font-extrabold text-[12px] opacity-25 text-amber-500 uppercase tracking-widest">
                      ASC
                    </span>
                  </div>
                )}

                {/* Planets render */}
                <div className="flex flex-wrap gap-1 mt-1 justify-start">
                  {planets.map((p) => (
                    <span
                      key={p.name}
                      style={{ contentVisibility: "auto" }}
                      className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-none ${
                        p.isRetrograde
                          ? "bg-red-950/20 text-red-500 border border-red-900/30"
                          : "bg-slate-900 text-amber-500 border border-slate-800"
                      }`}
                      title={`${p.name} (${PLANET_SANSKRIT[p.name]}) - ${p.formattedLongitude}`}
                    >
                      {p.name.slice(0, 2)}
                      {p.isRetrograde && <span className="text-[7px] text-red-500">*</span>}
                    </span>
                  ))}
                  {planets.length === 0 && (
                    <span className="text-[9px] text-slate-800 font-mono select-none">
                      ∅
                    </span>
                  )}
                </div>

                {/* ASC textual watermark for standard visibility */}
                {isLagnaBox && (
                  <div className="absolute bottom-1 right-2 pointer-events-none">
                    <span className="font-mono font-bold text-[8px] text-amber-500/60 uppercase">
                      ASC
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-[9px] font-mono text-slate-500 text-center tracking-widest uppercase selection:bg-slate-800">
        ✦ INTERACTIVE CHART • CLICK ANY BOX SEGMENT TO INSPECT LORD DETAILS & ACTIVE DRISHTI ASPECTS ✦
      </p>
    </div>
  );
};
