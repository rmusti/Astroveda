/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { KundliData, RASHIS, getHouseSignificance, PLANET_SANSKRIT, PlanetPosition } from "../utils/astrologyCalc";

interface NorthIndianChartProps {
  data: KundliData;
  activeHouse: number | null;
  onHoverHouse: (houseNum: number | null) => void;
  selectedHouse: number | null;
  onSelectHouse: (houseNum: number | null) => void;
}

export const NorthIndianChart: React.FC<NorthIndianChartProps> = ({
  data,
  activeHouse,
  onHoverHouse,
  selectedHouse,
  onSelectHouse
}) => {
  const [hoveredHouseLocal, setHoveredHouseLocal] = useState<number | null>(null);

  // Define SVG polygons and text locations for 12 houses (coordinates are inside a 400x400 container)
  const housePolygons = [
    {
      // House 1 (Lagna) - Top Center Diamond
      num: 1,
      points: "200,0 100,100 200,200 300,100",
      textPos: { x: 200, y: 120 },
      signPos: { x: 200, y: 60 }
    },
    {
      // House 2 - Top Left Triangle
      num: 2,
      points: "0,0 200,0 100,100",
      textPos: { x: 100, y: 40 },
      signPos: { x: 100, y: 75 }
    },
    {
      // House 3 - Left Top-Side Triangle
      num: 3,
      points: "0,0 0,200 100,100",
      textPos: { x: 40, y: 100 },
      signPos: { x: 65, y: 100 }
    },
    {
      // House 4 - Middle Left Diamond
      num: 4,
      points: "0,200 100,100 200,200 100,300",
      textPos: { x: 100, y: 200 },
      signPos: { x: 60, y: 200 }
    },
    {
      // House 5 - Left Bottom-Side Triangle
      num: 5,
      points: "0,200 0,400 100,300",
      textPos: { x: 40, y: 300 },
      signPos: { x: 65, y: 300 }
    },
    {
      // House 6 - Bottom Left Triangle
      num: 6,
      points: "0,400 200,400 100,300",
      textPos: { x: 100, y: 360 },
      signPos: { x: 100, y: 325 }
    },
    {
      // House 7 - Bottom Center Diamond
      num: 7,
      points: "200,400 100,300 200,200 300,300",
      textPos: { x: 200, y: 280 },
      signPos: { x: 200, y: 340 }
    },
    {
      // House 8 - Bottom Right Triangle
      num: 8,
      points: "200,400 400,400 300,300",
      textPos: { x: 300, y: 360 },
      signPos: { x: 300, y: 325 }
    },
    {
      // House 9 - Right Bottom-Side Triangle
      num: 9,
      points: "400,200 400,400 300,300",
      textPos: { x: 360, y: 300 },
      signPos: { x: 335, y: 300 }
    },
    {
      // House 10 - Middle Right Diamond
      num: 10,
      points: "400,200 300,100 200,200 300,300",
      textPos: { x: 300, y: 200 },
      signPos: { x: 340, y: 200 }
    },
    {
      // House 11 - Right Top-Side Triangle
      num: 11,
      points: "400,0 400,200 300,100",
      textPos: { x: 360, y: 100 },
      signPos: { x: 335, y: 100 }
    },
    {
      // House 12 - Top Right Triangle
      num: 12,
      points: "200,0 400,0 300,100",
      textPos: { x: 300, y: 40 },
      signPos: { x: 300, y: 75 }
    }
  ];

  // Group planets by house for easy rendering
  const planetsByHouse: Record<number, PlanetPosition[]> = {};
  for (let h = 1; h <= 12; h++) {
    planetsByHouse[h] = [];
  }
  (Object.values(data.planets) as PlanetPosition[]).forEach((p) => {
    if (p.house >= 1 && p.house <= 12) {
      planetsByHouse[p.house].push(p);
    }
  });

  const handleMouseEnter = (houseNum: number) => {
    setHoveredHouseLocal(houseNum);
    onHoverHouse(houseNum);
  };

  const handleMouseLeave = () => {
    setHoveredHouseLocal(null);
    onHoverHouse(null);
  };

  const currentHighlight = selectedHouse || hoveredHouseLocal || activeHouse;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full max-w-[450px] aspect-square bg-slate-950 p-[12px] border border-slate-800">
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full select-none cursor-pointer"
        >
          {/* Main Chart Lines & Outer Boundaries */}
          {housePolygons.map((house) => {
            const isHighlighted = currentHighlight === house.num;
            const rashiData = data.houses.find(h => h.houseNumber === house.num);
            const rashiNum = rashiData ? rashiData.rashiIndex + 1 : 1;
            const planets = planetsByHouse[house.num];

            return (
              <g
                key={house.num}
                onMouseEnter={() => handleMouseEnter(house.num)}
                onMouseLeave={handleMouseLeave}
                onClick={() => onSelectHouse(selectedHouse === house.num ? null : house.num)}
                className="transition-all duration-300"
              >
                {/* House Area Polygon */}
                <polygon
                  points={house.points}
                  className={`transition-colors duration-300 ${
                    isHighlighted
                      ? "fill-amber-955/10 stroke-amber-500 stroke-2"
                      : "fill-slate-950 stroke-slate-800 hover:fill-slate-900/40"
                  }`}
                />

                {/* Rashi / Zodiac Number Badge (Subtle, centered in house corner) */}
                <text
                  x={house.signPos.x}
                  y={house.signPos.y}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  className="font-mono text-[10px] pointer-events-none fill-slate-500"
                >
                  {rashiNum}
                </text>

                {/* Planet Abbreviations Label Group */}
                {planets.length > 0 && (
                  <g className="pointer-events-none">
                    {/* Render up to 5 planets cleanly inside each house */}
                    {planets.map((p, idx) => {
                      // Staggered layout for planets
                      let dx = 0;
                      let dy = 0;
                      
                      if (planets.length === 1) {
                        dx = 0; dy = -2;
                      } else if (planets.length === 2) {
                        dx = idx === 0 ? -18 : 18;
                        dy = -2;
                      } else if (planets.length === 3) {
                        dx = idx === 0 ? -20 : idx === 1 ? 0 : 20;
                        dy = idx === 1 ? -15 : 6;
                      } else {
                        // Diamond pattern
                        const angle = (idx * Math.PI * 2) / Math.min(planets.length, 6);
                        const radius = 16;
                        dx = Math.cos(angle) * radius;
                        dy = Math.sin(angle) * radius - 4;
                      }

                      return (
                        <g key={p.name}>
                          {/* Small dark rectangle behind text */}
                          <rect
                            x={house.textPos.x + dx - 10}
                            y={house.textPos.y + dy - 10}
                            width="20"
                            height="20"
                            className="fill-slate-950 stroke-slate-800"
                          />
                          <text
                            x={house.textPos.x + dx}
                            y={house.textPos.y + dy + 1}
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            className={`font-mono font-bold pointer-events-none ${
                              p.isRetrograde ? "fill-red-400 text-[10px]" : "fill-amber-300 text-[10px]"
                            }`}
                          >
                            {p.name.slice(0, 2)}
                            {p.isRetrograde && <tspan className="text-[7px] text-red-500/80" dy="-4">*</tspan>}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* House Index Number Badge (Lagna has special coloring) */}
                <rect
                  x={house.textPos.x - 7}
                  y={house.textPos.y + (planets.length > 0 ? 11 : -7)}
                  width="14"
                  height="14"
                  className={`${
                    house.num === 1
                      ? "fill-amber-500/10 stroke-amber-500"
                      : "fill-slate-950 stroke-slate-800"
                  }`}
                />
                <text
                  x={house.textPos.x}
                  y={house.textPos.y + (planets.length > 0 ? 18.5 : 0.5)}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  className="font-mono text-[8px] font-bold fill-amber-500 pointer-events-none"
                >
                  {house.num}
                </text>
              </g>
            );
          })}

          {/* Golden Center Accent Yantra Symbol */}
          <g transform="translate(200, 200) rotate(45)">
            <rect
              x="-8"
              y="-8"
              width="16"
              height="16"
              className="fill-amber-500/10 stroke-amber-500/40"
            />
          </g>
          <circle
            cx="200"
            cy="200"
            r="1.5"
            className="fill-amber-500"
          />
        </svg>
      </div>

      <p className="mt-3 text-[9px] font-mono text-slate-500 text-center tracking-widest uppercase selection:bg-slate-800">
        ✦ INTERACTIVE CHART • CLICK ANY HOUSE SEGMENT TO INSPECT LORD DETAILS & ACTIVE DRISHTI ASPECTS ✦
      </p>
    </div>
  );
};
