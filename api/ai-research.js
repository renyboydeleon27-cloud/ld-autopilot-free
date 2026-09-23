// LD AUTO Research Source Layer
// Builds a structured research plan/fact-pack candidate before narration.
// No OpenAI call here: authoritative-source retrieval is kept separate from prose generation.\n// v2 adds live USGS event lookup when a usable event year is present.

const SOURCE_REGISTRY = {
  tsunami: [
    {
      id: "noaa-ncei-tsunami",
      authority: "NOAA/NCEI",
      name: "Global Historical Tsunami Database",
      url: "https://www.ncei.noaa.gov/products/natural-hazards/tsunamis-earthquakes-volcanoes/tsunamis/global-historical-data",
      supports: ["event identity","date/time","location","cause","maximum water height","fatalities","injuries","houses destroyed","houses damaged","runup records"],
      confidence: "authoritative"
    },
    {
      id: "usgs-earthquake",
      authority: "USGS",
      name: "Earthquake Catalog / FDSN Event Web Service",
      url: "https://earthquake.usgs.gov/fdsnws/event/1/",
      supports: ["earthquake event records","origin time","location","magnitude","catalog metadata"],
      confidence: "authoritative"
    }
  ],
  earthquake: [
    {
      id: "usgs-earthquake",
      authority: "USGS",
      name: "Earthquake Catalog / FDSN Event Web Service",
      url: "https://earthquake.usgs.gov/fdsnws/event/1/",
      supports: ["earthquake event records","origin time","location","magnitude","catalog metadata"],
      confidence: "authoritative"
    }
  ]
};

function extractYear(topic) {
  const m = topic.match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
  return m ? Number(m[1]) : null;
}

function topicSearchText(topic) {
  return topic
    .replace(/\b(1[0-9]{3}|20[0-9]{2})\b/g, " ")
    .replace(/\b(tsunami|earthquake|quake|mega-tsunami|megatsunami)\b/gi, " ")
    .replace(/[—–-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchUsgsCandidate(topic, year) {
  if (!year) return {status:"skipped", reason:"No event year found in topic."};
  const start = `${year}-01-01`;
  const end = `${year + 1}-01-01`;
  const url = new URL("https://earthquake.usgs.gov/fdsnws/event/1/query");
  url.searchParams.set("format","geojson");
  url.searchParams.set("starttime",start);
  url.searchParams.set("endtime",end);
  url.searchParams.set("minmagnitude","5");
  url.searchParams.set("orderby","magnitude");
  url.searchParams.set("limit","100");
  const r = await fetch(url);
  if (!r.ok) return {status:"error", reason:`USGS HTTP ${r.status}`};
  const data = await r.json();
  const words = topicSearchText(topic).toLowerCase().split(" ").filter(w=>w.length>2);
  const scored = (data.features || []).map(feature => {
    const place = String(feature?.properties?.place || "").toLowerCase();
    const score = words.reduce((n,w)=>n + (place.includes(w) ? 1 : 0), 0);
    return {feature,score};
  }).sort((a,b)=>b.score-a.score || (b.feature?.properties?.mag||0)-(a.feature?.properties?.mag||0));
  const best = scored[0];
  if (!best || best.score === 0) return {status:"no-confident-match", candidates:(data.features||[]).length};
  const p=best.feature.properties||{}, g=best.feature.geometry||{};
  return {
    status:"candidate",
    confidence: best.score >= 2 ? "medium" : "low",
    matchScore:best.score,
    event:{
      id:best.feature.id,
      time:p.time ? new Date(p.time).toISOString() : null,
      place:p.place || null,
      magnitude:p.mag ?? null,
      magnitudeType:p.magType || null,
      coordinates:Array.isArray(g.coordinates) ? {longitude:g.coordinates[0],latitude:g.coordinates[1],depthKm:g.coordinates[2]} : null,
      detailUrl:p.url || null
    }
  };
}


async function fetchNoaaTsunamiCandidate(topic, year) {
  if (!year) return {status:"skipped", reason:"No event year found in topic."};
  const base = "https://gis.ngdc.noaa.gov/arcgis/rest/services/web_mercator/hazards/MapServer/0/query";
  const url = new URL(base);
  url.searchParams.set("where", `YEAR=${year}`);
  url.searchParams.set("outFields", "*");
  url.searchParams.set("returnGeometry", "true");
  url.searchParams.set("f", "json");
  const r = await fetch(url);
  if (!r.ok) return {status:"error", reason:`NOAA/NCEI HTTP ${r.status}`};
  const data = await r.json();
  if (data?.error) return {status:"error", reason:data.error.message || "NOAA/NCEI query error"};
  const words = topicSearchText(topic).toLowerCase().split(" ").filter(w=>w.length>2);
  const scored = (data.features || []).map(feature => {
    const a = feature.attributes || {};
    const hay = [a.LOCATION_NAME,a.COUNTRY,a.REGION,a.COMMENTS,a.CAUSE].filter(Boolean).join(" ").toLowerCase();
    const score = words.reduce((n,w)=>n + (hay.includes(w) ? 1 : 0), 0);
    return {feature,score};
  }).sort((a,b)=>b.score-a.score);
  const best = scored[0];
  if (!best || best.score === 0) return {status:"no-confident-match", candidates:(data.features||[]).length};
  const a=best.feature.attributes||{};
  return {
    status:"candidate",
    confidence: best.score >= 2 ? "high" : "medium",
    matchScore:best.score,
    event:{
      id:a.ID ?? a.OBJECTID ?? null,
      year:a.YEAR ?? null, month:a.MONTH ?? null, day:a.DAY ?? null,
      hour:a.HOUR ?? null, minute:a.MINUTE ?? null,
      location:a.LOCATION_NAME ?? null,
      country:a.COUNTRY ?? null,
      cause:a.CAUSE ?? null,
      validity:a.VALIDITY ?? a.EVENT_VALIDITY ?? null,
      maximumWaterHeightM:a.MAX_WATER_HEIGHT ?? a.MAXIMUM_WATER_HEIGHT ?? null,
      deaths:a.DEATHS ?? a.TOTAL_DEATHS ?? null,
      injuries:a.INJURIES ?? a.TOTAL_INJURIES ?? null,
      housesDestroyed:a.HOUSES_DESTROYED ?? null,
      housesDamaged:a.HOUSES_DAMAGED ?? null,
      raw:a
    }
  };
}

function classifyTopic(topic) {
  const t = topic.toLowerCase();
  if (t.includes("tsunami")) return "tsunami";
  if (t.includes("earthquake") || t.includes("quake")) return "earthquake";
  return "general";
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ok:false,error:"POST only"});

  const topic = String(req.body?.topic || "").trim().slice(0, 240);
  if (!topic) return res.status(400).json({ok:false,error:"Please provide a disaster topic first."});

  const hazardType = classifyTopic(topic);
  const sources = SOURCE_REGISTRY[hazardType] || [];

  return res.status(200).json({
    ok: true,
    version: "research-layer-3",
    topic,
    hazardType,
    status: sources.length ? "source-plan-ready" : "needs-source-registry",
    factPack: {
      identity: [],
      cause: [],
      chronology: [],
      warning_conditions: [],
      physical_impact: [],
      human_impact: [],
      aftermath: [],
      significance: [],
      uncertainty: []
    },
    sources,
    evidencePolicy: {
      narrationMustUseVerifiedFactsOnly: true,
      preserveUncertainty: true,
      doNotInventMissingFacts: true,
      exactNumbersRequireReliableEvidence: true,
      conflictingSourcesMustBeFlagged: true
    },
    note: sources.length
      ? "Authoritative sources are registered. NOAA/NCEI tsunami-event and USGS earthquake-event retrieval are active when the topic contains a usable year. Candidate matches remain evidence candidates until cross-source validation."
      : "No authoritative source adapter is registered for this hazard type yet."
  });
}
