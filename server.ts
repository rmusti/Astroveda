/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import tzlookup from "tz-lookup";

// Helper function to resolve exact timezone decimal hour offset given IANA timezone and date
function getTimezoneOffset(timeZone: string, date: Date = new Date()): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset"
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find(p => p.type === "timeZoneName")?.value || "";
    // tzPart is formatted like "GMT+05:30", "GMT-08:00", "GMT", "UTC", etc.
    if (tzPart === "GMT" || tzPart === "UTC" || !tzPart) return 0;
    const match = tzPart.match(/GMT([+-]\d+):(\d+)/);
    if (match) {
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      return hours + (hours >= 0 ? minutes / 60 : -minutes / 60);
    }
  } catch (err) {
    console.error("getTimezoneOffset calculation error:", err);
  }
  return 0;
}

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set. All AI operations will return mock/fallback insights.");
}

/*
// ============================================================================
// ORIGINAL GEOMINI-BASED GEOCODER (PRESERVED INTACT FOR REFERENCES)
// ============================================================================
// 1. Geocoding API - Uses Gemini as a geocoder!
app.post("/api/geocode", async (req, res): Promise<any> => {
  const { query, dateString } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: "Missing query parameter." });
  }

  if (!ai) {
    // If no AI key, return a standard coordinate for a major placeholder (e.g. New Delhi)
    return res.json({
      latitude: 28.6139,
      longitude: 77.2090,
      timezone: 5.5,
      formattedAddress: `${query} (Default Coordinates - Please check Settings Secrets)`
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Identify the latitude, longitude, and standard timezone offset in decimal hours from UTC for this location: "${query}". Date/year Context if important for historical timezone: ${dateString || "current"}. Please ensure latitude is positive for North / negative for South, and longitude is positive for East / negative for West.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            latitude: { type: Type.NUMBER, description: "Latitude in degrees (e.g. 28.61 for Delhi, 37.77 for San Francisco)" },
            longitude: { type: Type.NUMBER, description: "Longitude in degrees (e.g. 77.20 for Delhi, -122.41 for San Francisco)" },
            timezone: { type: Type.NUMBER, description: "Timezone offset in decimal hours from UTC (e.g. Indian Standard Time is 5.5, Cental European Time in summer might be 2.0, standard winter is 1.0, US Pacific is -8.0)" },
            formattedAddress: { type: Type.STRING, description: "Formatted address: City, State/Province, Country" }
          },
          required: ["latitude", "longitude", "timezone", "formattedAddress"]
        }
      }
    });

    const text = response.text ? response.text.trim() : "";
    const result = JSON.parse(text);
    return res.json(result);
  } catch (error: any) {
    console.error("Geocoding Error:", error);
    // Fallback coordinates for common search query matching
    const qLower = query.toLowerCase();
    if (qLower.includes("delhi") || qLower.includes("india") || qLower.includes("mumbai")) {
      return res.json({ latitude: 28.6139, longitude: 77.2090, timezone: 5.5, formattedAddress: "New Delhi, India" });
    } else if (qLower.includes("york")) {
      return res.json({ latitude: 40.7128, longitude: -74.0060, timezone: -5, formattedAddress: "New York, NY, USA" });
    } else if (qLower.includes("london")) {
      return res.json({ latitude: 51.5074, longitude: -0.1278, timezone: 0, formattedAddress: "London, UK" });
    } else if (qLower.includes("california") || qLower.includes("san francisco")) {
      return res.json({ latitude: 37.7749, longitude: -122.4194, timezone: -8, formattedAddress: "San Francisco, CA, USA" });
    }
    
    return res.status(500).json({ error: "Failed to geocode location via Gemini. Please enter coordinates manually." });
  }
});
// ============================================================================
*/

// NEW PRODUCTION IMPLEMENTATION: OpenStreetMap Nominatim Geocoder & tz-lookup Engine
app.post("/api/geocode", async (req, res): Promise<any> => {
  const { query, dateString } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: "Missing query parameter." });
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const osmResponse = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "AstroKundliHub/1.0 (contact: rmusti@google.com)"
      }
    });

    if (!osmResponse.ok) {
      throw new Error(`OpenStreetMap Geocoder returned HTTP Status ${osmResponse.status}`);
    }

    const osmData = await osmResponse.json();
    
    if (Array.isArray(osmData) && osmData.length > 0) {
      const resultObj = osmData[0];
      const lat = parseFloat(resultObj.lat);
      const lon = parseFloat(resultObj.lon);
      const formattedAddress = resultObj.display_name;

      // Passing coordinates to fast local timezone library 'tz-lookup' to resolve IANA name
      const ianaTimeZone = tzlookup(lat, lon);
      
      // Determine timezone decimal hour offset using local, robust system Intl APIs
      const targetDate = dateString ? new Date(dateString) : new Date();
      const timezoneOffset = getTimezoneOffset(ianaTimeZone, targetDate);

      return res.json({
        latitude: lat,
        longitude: lon,
        timezone: timezoneOffset,
        formattedAddress: formattedAddress
      });
    } else {
      throw new Error("No address matches found in the OpenStreetMap database.");
    }
  } catch (error: any) {
    console.error("OpenStreetMap/Local Timezone Lookup Error:", error);
    
    // Smooth Fallback to previous hardcoded coordinate rules when OpenStreetMap is down or fails
    const qLower = query.toLowerCase();
    if (qLower.includes("delhi") || qLower.includes("india") || qLower.includes("mumbai")) {
      return res.json({ latitude: 28.6139, longitude: 77.2090, timezone: 5.5, formattedAddress: "New Delhi, India (Fallback)" });
    } else if (qLower.includes("york")) {
      return res.json({ latitude: 40.7128, longitude: -74.0060, timezone: -5, formattedAddress: "New York, NY, USA (Fallback)" });
    } else if (qLower.includes("london")) {
      return res.json({ latitude: 51.5074, longitude: -0.1278, timezone: 0, formattedAddress: "London, UK (Fallback)" });
    } else if (qLower.includes("california") || qLower.includes("san francisco")) {
      return res.json({ latitude: 37.7749, longitude: -122.4194, timezone: -8, formattedAddress: "San Francisco, CA, USA (Fallback)" });
    }
    
    return res.status(500).json({ error: "Failed to geocode location. Please check coordinates manually." });
  }
});

// 2. Astrological Interpretation Report API
app.post("/api/kundli-report", async (req, res): Promise<any> => {
  const { kundliData } = req.body;
  
  if (!kundliData) {
    return res.status(400).json({ error: "Missing kundliData." });
  }

  if (!ai) {
    return res.json({
      report: `### Traditional Vedic Kundli Analysis for ${kundliData.name}

*Note: The Gemini API Key is missing. This is a local astrological breakdown.*

#### 🌟 Soul Path & Ascendant (Lagna: ${kundliData.lagna.rashi})
Your Lagna falls in **${kundliData.lagna.rashi}** at **${kundliData.lagna.rashiDegree.toFixed(2)}°** in **${kundliData.lagna.nakshatra}** Nakshatra.
This represents a powerful birth marking high potential. In Vedic systems, your Lagna dictates how you channel your vital forces.

#### 🪐 Key Planetary Configurations
- **Ascendant Lord Placement**: Calculated dynamically based on your Lagna which sits in ${kundliData.lagna.rashi}.
- **The Moon (Chandra)**: Sits in **House ${kundliData.planets.Moon?.house}** under **${kundliData.planets.Moon?.rashi}** and **${kundliData.planets.Moon?.nakshatra}** Nakshatra, Pada ${kundliData.planets.Moon?.nakshatraPada}. This reveals your internal psychic structure, emotional nature, and intuitive landscape.
- **The Sun (Surya)**: Sits in **House ${kundliData.planets.Sun?.house}** under **${kundliData.planets.Sun?.rashi}**. This guides your soul's authority, vital energy, and career path.

For full spiritually immersive guidance, professional remedies, and transit forecasts, please add a valid \`GEMINI_API_KEY\` inside the Secrets Tab.`
    });
  }

  try {
    const prompt = `You are a legendary traditional Indian Vedic astrologer (Jyotishi) of supreme reputation, wisdom, and spiritual composure.
Generate a deeply personalized, authentic, and high-fidelity astrological report (Kundli Reading) in professional Markdown.
Use precise Vedic terminology (such as Lagna, Nakshatras, Panchanga, Drishti, Planetary Yogas, and Shanti Remedies), while explaining the psychological, spiritual, and material implications clearly.

Here is the exact astronomical dataset calculated for this individual:
- Person Name: ${kundliData.name}
- Birth Place: ${kundliData.birthPlace} (Lat: ${kundliData.latitude}, Lon: ${kundliData.longitude})
- Born On: ${kundliData.birthDate} at ${kundliData.birthTime} (Timezone Index: GMT ${kundliData.timezone})
- Calculated Sidereal Lagna (Ascendant): ${kundliData.lagna.rashi} at ${kundliData.lagna.rashiDegree.toFixed(2)}° in ${kundliData.lagna.nakshatra} Nakshatra
- Ayanamsa value used (Lahiri): ${kundliData.ayanamsa.toFixed(4)}°

- PLANETS PLACEMENTS (Sidereal / Rashi Chart):
${Object.values(kundliData.planets).map((p: any) => `  * ${p.name} (${p.isRetrograde ? "Retrograde" : "Direct"}): Sits in House ${p.house} inside "${p.rashi}" at ${p.rashiDegree.toFixed(2)}° in Nakshatra "${p.nakshatra}" (Pada ${p.nakshatraPada}), Navamsha Rashi is "${p.navamshaRashi}".`).join("\n")}

- HOUSES STRUCTURE:
${kundliData.houses.map((h: any) => `  * House ${h.houseNumber}: Sits in ${h.rashiName}.`).join("\n")}

- DETAILED PLANETARY ASPECTS (Drishti System):
${kundliData.aspects.slice(0, 15).join("\n")}

Please divide the report into the following formatted sections:
1. **Kundli Summary Sheet**: A beautiful markdown table listing Planet, Rashi, House, Nakshatra, Pada, Retrograde status, and Navamsha.
2. **Personality & Soul Destiny (Lagna & Chandra Analysis)**: Analysis of the Ascendant, its ruling planet, and the Moon's psychic and mental patterns in ${kundliData.planets.Moon?.nakshatra}.
3. **Professional Path & Prosperity (10th/2nd/11th House Intersections)**: Where their career will excel based on these indicators.
4. **Key Spiritual Alignments & Yogas**: Point out any strong Vedic planetary combinations (such as Kendra-Trikona connections, Gajakesari if Jupiter and Moon aspect/conjoin, Manglik Dosha if Mars is in 1,4,7,8,12, Budhaditya if Sun and Mercury are in same house, etc.).
5. **Vedic Shanti Remedies & Cosmic Advice**: Recommend high-integrity spiritual practices, specific mantras, charity, and colors to harmonize any difficult alignments (like Saturn, Rahu, or Ketu placements).

Keep the tone highly insightful, compassionate, authoritative, and deeply spiritual. Refrain from generic statements.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return res.json({ report: response.text });
  } catch (error: any) {
    console.error("Astrology Report Error:", error);
    return res.status(500).json({ error: "Failed to generate Kundli analysis report." });
  }
});

// 3. Transit Horoscope Prediction API
app.post("/api/transit-horoscope", async (req, res): Promise<any> => {
  const { natalPlanets, transitPlanets, name } = req.body;

  if (!natalPlanets || !transitPlanets) {
    return res.status(400).json({ error: "Missing natal or transit planetary information." });
  }

  if (!ai) {
    return res.json({
      horoscope: `### Transit Forecast & Daily Horoscope for ${name || "Seeker"}

*Note: Gemini API key is missing. This is a computed Vedic transit analysis based on mathematics.*

- **Transit Suns & Energy Flow**: The Transit Sun is currently highlighting planets in **${transitPlanets.Sun?.rashi}**. This illuminates your natural vitality.
- **Transit Moon & Daily Focus**: Today's Transit Moon travels through **${transitPlanets.Moon?.rashi}** inside Nakshatra **${transitPlanets.Moon?.nakshatra}**. This influences your mood, triggers spontaneous feelings, and indicates the ideal tasks to pursue today.
- **Guru Gochara (Jupiter's Transit)**: Jupiter is traveling through **${transitPlanets.Jupiter?.rashi}**. This triggers expansions, wealth gains, and divine grace in this area of your life.
- **Shani Gochara (Saturn's Transit)**: Saturn is in **${transitPlanets.Saturn?.rashi}**, bringing lessons, discipline, and endurance requirements to this quadrant.

*To obtain detailed daily aspect forecasts and customized remedies, please activate a Gemini API Key.*`
    });
  }

  try {
    const prompt = `You are an expert Vedic Transit Scholar (Gochara Expert).
Analyze the dynamic astronomical interactions between this user's Natal planetary positions and Today's Transit planetary coordinates, and write a high-impact Daily Horoscope and Transit Prediction in Markdown.

USER'S NATAL POSITIONS:
${Object.entries(natalPlanets).map(([k, p]: any) => `  * ${k}: House ${p.house} in ${p.rashi} (${p.rashiDegree.toFixed(2)}°)`).join("\n")}

CURRENT TRANSIT POSITIONS (TODAY):
${Object.entries(transitPlanets).map(([k, p]: any) => `  * ${k}: Traveling through "${p.rashi}" at ${p.rashiDegree.toFixed(2)}° inside Nakshatra "${p.nakshatra}"`).join("\n")}

Write a beautiful, scannable, and highly motivational astrological guide:
1. **The Moon Mirror (Your Mind & Emotional Target today)**: Deep prediction based on how today's transit Moon relates to their natal Moon and Lagna sign.
2. **Transit Highlights of the Heavyweights**: Analyze the transits of Jupiter (Gochara Guru) and Saturn (Gochara Shani) relative to their natal matrix.
3. **Core Prediction Categories**:
   - **Vitality & Mind**
   - **Love & Interactions**
   - **Career & Manifestation**
4. **Pragmatic Golden Hours Advice & Auspicious Action**: What standard activities are favored today based on these transits.

Keep it structured, visual, clear, and highly encouraging!`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return res.json({ horoscope: response.text });
  } catch (error: any) {
    console.error("Transit Horoscope Error:", error);
    return res.status(500).json({ error: "Failed to generate dynamic transit horoscope." });
  }
});

// Start routing server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
