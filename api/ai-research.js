// LD AUTO Research Source Layer
// Builds a structured research plan/fact-pack candidate before narration.
// No OpenAI call here: authoritative-source retrieval is kept separate from prose generation.
// v2 adds live USGS event lookup when a usable event year is present.

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


function normalizeWords(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g," ").split(" ").filter(w=>w.length>2);
}
function datePartsFromIso(iso) {
  if (!iso) return null;
  const d=new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return {year:d.getUTCFullYear(),month:d.getUTCMonth()+1,day:d.getUTCDate()};
}
function crossValidate(noaa, usgs) {
  const n = noaa?.status === "candidate" ? noaa.event : null;
  const u = usgs?.status === "candidate" ? usgs.event : null;
  if (!n && !u) return {status:"NEEDS_REVIEW",confidence:"none",checks:[],reason:"No confident authoritative event candidate was found."};
  if (n && !u) return {status:"PARTIAL",confidence:noaa.confidence||"medium",checks:[{field:"NOAA/NCEI event",match:true}],reason:"NOAA/NCEI candidate found; no matching USGS catalog candidate was found."};
  if (!n && u) return {status:"PARTIAL",confidence:usgs.confidence||"low",checks:[{field:"USGS event",match:true}],reason:"USGS candidate found; no matching NOAA/NCEI tsunami candidate was found."};

  const ud=datePartsFromIso(u.time);
  const dateMatch = !!(ud && Number(n.year)===ud.year && (!n.month || Number(n.month)===ud.month) && (!n.day || Number(n.day)===ud.day));
  const nw=normalizeWords([n.location,n.country].filter(Boolean).join(" "));
  const uw=normalizeWords(u.place);
  const shared=nw.filter(w=>uw.includes(w));
  const locationMatch=shared.length>0;
  const nMag=Number(n.raw?.EQ_MAGNITUDE ?? n.raw?.EQ_MAG_MW);
  const uMag=Number(u.magnitude);
  const magnitudeComparable=Number.isFinite(nMag)&&Number.isFinite(uMag);
  const magnitudeClose=!magnitudeComparable || Math.abs(nMag-uMag)<=0.6;
  const checks=[
    {field:"date",match:dateMatch,noaa:{year:n.year,month:n.month,day:n.day},usgs:ud},
    {field:"location",match:locationMatch,sharedTerms:shared},
    {field:"magnitude",match:magnitudeClose,comparable:magnitudeComparable,noaa:Number.isFinite(nMag)?nMag:null,usgs:Number.isFinite(uMag)?uMag:null}
  ];
  if (dateMatch && locationMatch && magnitudeClose) return {status:"VERIFIED",confidence:"high",checks,reason:"NOAA/NCEI and USGS candidates agree on the event identity within configured checks."};
  if (dateMatch && (locationMatch || magnitudeClose)) return {status:"PARTIAL",confidence:"medium",checks,reason:"Authoritative candidates partly agree but require review before exact details are locked."};
  return {status:"CONFLICT",confidence:"low",checks,reason:"NOAA/NCEI and USGS candidates do not agree strongly enough to lock the event identity."};
}

function classifyTopic(topic) {
  const t = topic.toLowerCase();
  if (t.includes("tsunami")) return "tsunami";
  if (t.includes("earthquake") || t.includes("quake")) return "earthquake";
  return "general";
}

export async function buildResearch(topic) {
  const hazardType = classifyTopic(topic);
  const sources = SOURCE_REGISTRY[hazardType] || [];
  const year = extractYear(topic);
  let noaa = null;
  let usgs = null;

  if (hazardType === "tsunami") {
    try { noaa = await fetchNoaaTsunamiCandidate(topic, year); }
    catch (e) { noaa = {status:"error",reason:String(e?.message||e)}; }
  }
  if (hazardType === "tsunami" || hazardType === "earthquake") {
    try { usgs = await fetchUsgsCandidate(topic, year); }
    catch (e) { usgs = {status:"error",reason:String(e?.message||e)}; }
  }

  const validation = crossValidate(noaa, usgs);
  const identity = [
    ...(noaa?.status === "candidate" ? [{source:"NOAA/NCEI",confidence:noaa.confidence,event:noaa.event}] : []),
    ...(usgs?.status === "candidate" ? [{source:"USGS",confidence:usgs.confidence,event:usgs.event}] : [])
  ];

  return {
    ok:true,
    version:"research-layer-4",
    topic, hazardType,
    status:sources.length ? "source-plan-ready" : "needs-source-registry",
    factPack:{
      identity,
      cause:noaa?.status === "candidate" && noaa.event?.cause ? [{source:"NOAA/NCEI",value:noaa.event.cause}] : [],
      chronology:[], warning_conditions:[],
      physical_impact:noaa?.status === "candidate" && noaa.event?.maximumWaterHeightM != null ? [{source:"NOAA/NCEI",maximumWaterHeightM:noaa.event.maximumWaterHeightM}] : [],
      human_impact:noaa?.status === "candidate" ? [{
        source:"NOAA/NCEI", deaths:noaa.event.deaths, injuries:noaa.event.injuries,
        housesDestroyed:noaa.event.housesDestroyed, housesDamaged:noaa.event.housesDamaged
      }] : [],
      aftermath:[], significance:[],
      uncertainty: validation.status === "VERIFIED" ? [] : [validation.reason]
    },
    sources,
    retrieval:{year,noaa,usgs},
    validation,
    narrationGate:{
      allowed:validation.status === "VERIFIED" || validation.status === "PARTIAL",
      exactNumbersAllowed:validation.status === "VERIFIED",
      status:validation.status
    },
    evidencePolicy:{
      narrationMustUseVerifiedFactsOnly:true,
      preserveUncertainty:true,
      doNotInventMissingFacts:true,
      exactNumbersRequireReliableEvidence:true,
      conflictingSourcesMustBeFlagged:true
    }
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ok:false,error:"POST only"});
  const topic=String(req.body?.topic||"").trim().slice(0,240);
  if (!topic) return res.status(400).json({ok:false,error:"Please provide a disaster topic first."});
  try { return res.status(200).json(await buildResearch(topic)); }
  catch (e) { return res.status(500).json({ok:false,error:"Research error: "+String(e?.message||e)}); }
}
