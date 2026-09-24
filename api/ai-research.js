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



const CURATED_EVENT_EVIDENCE = [
  {
    id:"sanriku-1896-satake-2017",
    matches:({topic,year,hazardType})=>hazardType==="tsunami" && year===1896 && /sanriku/i.test(topic),
    source:{
      id:"satake-2017-sanriku",
      authority:"Peer-reviewed",
      name:"Satake, Fujii & Yamaki (2017), Geoscience Letters",
      url:"https://link.springer.com/article/10.1186/s40562-017-0099-y",
      supports:["tsunami-earthquake classification","weak shaking","local timing observations at Miyako","Japan Trench source context"],
      confidence:"peer-reviewed"
    },
    claims:[
      {field:"event.classification",value:"tsunami earthquake",claim:"The 1896 Sanriku event is described as a typical tsunami earthquake."},
      {field:"earthquake.shaking",value:"weak",claim:"Ground shaking from the 1896 Sanriku earthquake was weak."},
      {field:"earthquake.originLocalTime",value:"19:32",claim:"The estimated earthquake origin time was 19:32 local time."},
      {field:"observation.miyako.seaRecessionTime",value:"about 19:50",claim:"At Miyako, the sea began to recede at about 19:50."},
      {field:"observation.miyako.waterRiseTime",value:"about 20:00",claim:"At Miyako, the water rose at about 20:00."},
      {field:"observation.miyako.largestWaveTime",value:"20:07",claim:"At Miyako, the largest observed wave arrived at 20:07."},
      {field:"observation.miyako.waveHeightM",value:4.5,claim:"At Miyako, the largest observed wave was about 4.5 metres high."},
      {field:"observation.miyako.subsequentWaves",value:6,claim:"At Miyako, six subsequent waves were observed until noon the following day."},
      {field:"earthquake.sourceRegion",value:"Japan Trench",claim:"The 1896 Sanriku tsunami earthquake occurred along the Japan Trench."}
    ]
  }
];

function extractYear(topic) {
  const m = topic.match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
  return m ? Number(m[1]) : null;
}

function topicSearchText(topic) {
  return topic
    .replace(/\b(1[0-9]{3}|20[0-9]{2})\b/g, " ")
    .replace(/\b(tsunami|earthquake|quake|mega-tsunami|megatsunami)\b/gi, " ")
    .replace(/[—–-]/g, " ")
    .replace(/\b(usa|u\.?s\.?a\.?|united states|japan|alaska)\b/gi, " ")
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
  // Do not use the modern USGS catalog as a hard requirement for old historical events.
  // Coverage/completeness is much stronger for instrument-era earthquakes.
  if (year < 1900) return {status:"historical-catalog-gap", reason:"Pre-1900 event: use NOAA/NCEI historical evidence as primary source."};
  url.searchParams.set("minmagnitude","5");
  url.searchParams.set("orderby","magnitude");
  url.searchParams.set("limit","100");
  const r = await fetch(url);
  if (!r.ok) return {status:"error", reason:`USGS HTTP ${r.status}`};
  const data = await r.json();
  const words = topicSearchText(topic).toLowerCase().split(" ").filter(w=>w.length>2);
  const regionHints = topic.toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>2);
  const scored = (data.features || []).map(feature => {
    const place = String(feature?.properties?.place || "").toLowerCase();
    const direct = words.reduce((n,w)=>n + (place.includes(w) ? 3 : 0), 0);
    const regional = regionHints.reduce((n,w)=>n + (place.includes(w) ? 1 : 0), 0);
    const score = direct + regional;
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
  const base = "https://gis.ngdc.noaa.gov/arcgis/rest/services/web_mercator/hazards/MapServer/1/query";
  const url = new URL(base);
  // NOAA ArcGIS field names have changed across published layers; query the
  // year defensively and fall back to a broad server-side query if needed.
  url.searchParams.set("where", `YEAR=${year}`);
  url.searchParams.set("outFields", "*");
  url.searchParams.set("returnGeometry", "true");
  url.searchParams.set("f", "json");
  const r = await fetch(url);
  if (!r.ok) return {status:"error", reason:`NOAA/NCEI HTTP ${r.status}`};
  let data = await r.json();
  if (data?.error) {
    const fallback = new URL(base);
    fallback.searchParams.set("where","1=1");
    fallback.searchParams.set("outFields","*");
    fallback.searchParams.set("returnGeometry","true");
    fallback.searchParams.set("f","json");
    fallback.searchParams.set("resultRecordCount","2000");
    const fr=await fetch(fallback);
    if (!fr.ok) return {status:"error",reason:`NOAA/NCEI fallback HTTP ${fr.status}`};
    data=await fr.json();
    if (data?.error) return {status:"error",reason:data.error.message || "NOAA/NCEI query error"};
    data.features=(data.features||[]).filter(feature => {
      const a=feature.attributes||{};
      const y=Number(a.YEAR ?? a.Year ?? a.year ?? a.EVENT_YEAR ?? a.Event_Year);
      return y===year;
    });
  }
  const words = topicSearchText(topic).toLowerCase().split(" ").filter(w=>w.length>2);
  const regionHints = topic.toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>2);
  const scored = (data.features || []).map(feature => {
    const a = feature.attributes || {};
    const location = a.LOCATION_NAME ?? a.Location_Name ?? a.LOCATION ?? a.Location ?? a.location;
    const country = a.COUNTRY ?? a.Country ?? a.country;
    const region = a.REGION ?? a.Region ?? a.region;
    const comments = a.COMMENTS ?? a.Comments ?? a.comments;
    const cause = a.CAUSE ?? a.Cause ?? a.cause;
    const hay = [location,country,region,comments,cause].filter(Boolean).join(" ").toLowerCase();
    const direct = words.reduce((n,w)=>n + (hay.includes(w) ? 3 : 0), 0);
    const regional = regionHints.reduce((n,w)=>n + (hay.includes(w) ? 1 : 0), 0);
    const score = direct + regional;
    return {feature,score};
  }).sort((a,b)=>b.score-a.score);
  const best = scored[0];
  if (!best || best.score === 0) {
    // Historical NOAA records do not always repeat the modern event name in
    // searchable text. If the requested year has exactly one tsunami source
    // record, retain it as a cautious year-only candidate instead of discarding it.
    if ((data.features || []).length === 1) {
      const only=data.features[0], a=only.attributes||{};
      best={feature:only,score:0,yearOnly:true};
    } else {
      return {
        status:"no-confident-match",
        candidates:(data.features||[]).length,
        sample:(data.features||[]).slice(0,5).map(x=>x.attributes||{})
      };
    }
  }
  const a=best.feature.attributes||{};
  return {
    status:"candidate",
    confidence: best.yearOnly ? "low" : (best.score >= 2 ? "high" : "medium"),
    matchScore:best.score,
    matchMethod:best.yearOnly ? "year-only-single-record" : "topic-text",
    event:{
      id:a.ID ?? a.OBJECTID ?? null,
      year:a.YEAR ?? a.Year ?? a.year ?? a.EVENT_YEAR ?? null,
      month:a.MONTH ?? a.Month ?? a.month ?? null, day:a.DAY ?? a.Day ?? a.day ?? null,
      hour:a.HOUR ?? a.Hour ?? a.hour ?? null, minute:a.MINUTE ?? a.Minute ?? a.minute ?? null,
      location:a.LOCATION_NAME ?? a.Location_Name ?? a.LOCATION ?? a.Location ?? null,
      country:a.COUNTRY ?? a.Country ?? null,
      cause:a.CAUSE ?? a.Cause ?? null,
      validity:a.VALIDITY ?? a.EVENT_VALIDITY ?? null,
      maximumWaterHeightM:a.MAX_EVENT_RUNUP ?? a.MAX_WATER_HEIGHT ?? a.MAXIMUM_WATER_HEIGHT ?? null,
      magnitude:a.EQ_MAGNITUDE ?? a.EQ_MAG_MW ?? a.EQ_MAG_MS ?? null,
      numberOfRunupObservations:a.NUM_RUNUP ?? a.NUM_RUNUPS ?? null,
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
  if (n && !u) {
    const historicalGap = usgs?.status === "historical-catalog-gap";
    return {
      status: historicalGap && noaa.confidence === "high" ? "VERIFIED" : "PARTIAL",
      confidence: historicalGap && noaa.confidence === "high" ? "high" : (noaa.confidence||"medium"),
      checks:[{field:"NOAA/NCEI historical event",match:true},{field:"USGS cross-check",match:null,reason:usgs?.reason||"No matching catalog candidate"}],
      reason: historicalGap
        ? "NOAA/NCEI is the primary authoritative historical source; USGS modern catalog cross-check is not required for this pre-1900 event."
        : "NOAA/NCEI candidate found; no matching USGS catalog candidate was found."
    };
  }
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
  const year = extractYear(topic);
  let sources = [...(SOURCE_REGISTRY[hazardType] || [])];
  const curatedProfiles=CURATED_EVENT_EVIDENCE.filter(p=>p.matches({topic,year,hazardType}));
  for(const p of curatedProfiles) if(!sources.some(s=>s.id===p.source.id)) sources.push(p.source);
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

  // Build an explicit allow-list of atomic facts with provenance. Narration
  // should prefer these records over interpreting the larger raw source object.
  const verifiedClaims=[];
  if(noaa?.status==="candidate"){
    const e=noaa.event||{};
    const sourceId="noaa-ncei-tsunami";
    const sourceUrl=SOURCE_REGISTRY.tsunami[0].url;
    const add=(field,value,claim)=>{
      if(value!==null&&value!==undefined&&value!=="") verifiedClaims.push({field,value,claim,sourceId,authority:"NOAA/NCEI",sourceUrl});
    };
    add("event.year",e.year,e.year?`Event year: ${e.year}.`:null);
    if(e.month&&e.day) add("event.date",`${e.year}-${String(e.month).padStart(2,"0")}-${String(e.day).padStart(2,"0")}`,`Event date: ${e.year}-${String(e.month).padStart(2,"0")}-${String(e.day).padStart(2,"0")}.`);
    add("event.location",e.location,e.location?`Location: ${e.location}.`:null);
    add("event.country",e.country,e.country?`Country: ${e.country}.`:null);
    add("event.cause",e.cause,e.cause?`Cause: ${e.cause}.`:null);
    add("impact.maximumWaterHeightM",e.maximumWaterHeightM,e.maximumWaterHeightM!=null?`Maximum water height: ${e.maximumWaterHeightM} m.`:null);
    add("tsunami.numberOfRunupObservations",e.numberOfRunupObservations,e.numberOfRunupObservations!=null?`Runup observations: ${e.numberOfRunupObservations}.`:null);
    add("impact.deaths",e.deaths,e.deaths!=null?`Deaths: ${e.deaths}.`:null);
    add("impact.injuries",e.injuries,e.injuries!=null?`Injuries: ${e.injuries}.`:null);
    add("impact.housesDestroyed",e.housesDestroyed,e.housesDestroyed!=null?`Houses destroyed: ${e.housesDestroyed}.`:null);
    add("impact.housesDamaged",e.housesDamaged,e.housesDamaged!=null?`Houses damaged: ${e.housesDamaged}.`:null);
    const mag=e.raw?.EQ_MAGNITUDE ?? e.raw?.EQ_MAG_MW;
    add("earthquake.magnitude",mag,mag!=null?`Earthquake magnitude: ${mag}.`:null);
  }
  if(usgs?.status==="candidate"){
    const e=usgs.event||{}, sourceId="usgs-earthquake", sourceUrl=SOURCE_REGISTRY.earthquake[0].url;
    if(e.time) verifiedClaims.push({field:"earthquake.originTime",value:e.time,claim:`USGS origin time: ${e.time}.`,sourceId,authority:"USGS",sourceUrl});
    if(e.place) verifiedClaims.push({field:"earthquake.place",value:e.place,claim:`USGS place: ${e.place}.`,sourceId,authority:"USGS",sourceUrl});
    if(e.magnitude!=null) verifiedClaims.push({field:"earthquake.magnitude",value:e.magnitude,claim:`USGS magnitude: ${e.magnitude}${e.magnitudeType?" "+e.magnitudeType:""}.`,sourceId,authority:"USGS",sourceUrl});
  }

  curatedProfiles.forEach(profile=>{
    profile.claims.forEach(item=>{
      verifiedClaims.push({
        ...item,
        sourceId:profile.source.id,
        authority:profile.source.authority,
        sourceUrl:profile.source.url
      });
    });
  });

  const claimConflicts=[];
  const magnitudeClaims=verifiedClaims.filter(x=>x.field==="earthquake.magnitude" && Number.isFinite(Number(x.value)));
  const magnitudeValues=[...new Set(magnitudeClaims.map(x=>Number(x.value)))];
  if(magnitudeValues.length>1){
    claimConflicts.push({
      field:"earthquake.magnitude",
      values:magnitudeClaims.map(x=>({value:x.value,authority:x.authority,sourceId:x.sourceId})),
      reason:"Authoritative sources report different earthquake magnitude values; narration must not select one or convert them into a range without explicit resolution."
    });
  }

  return {
    ok:true,
    version:"research-layer-7-structured-impact",
    topic, hazardType,
    status:sources.length ? "source-plan-ready" : "needs-source-registry",
    verifiedClaims:verifiedClaims.filter(x=>!claimConflicts.some(y=>y.field===x.field)),
    claimConflicts,
    factPack:{
      identity,
      cause:noaa?.status === "candidate" && noaa.event?.cause ? [{source:"NOAA/NCEI",value:noaa.event.cause}] : [],
      chronology:[
        ...(noaa?.status==="candidate" && noaa.event?.year ? [{source:"NOAA/NCEI",type:"event_date",year:noaa.event.year,month:noaa.event.month,day:noaa.event.day}] : []),
        ...(usgs?.status==="candidate" && usgs.event?.time ? [{source:"USGS",type:"earthquake_origin_time",time:usgs.event.time}] : [])
      ], warning_conditions:[],
      physical_impact:noaa?.status === "candidate" ? [
        ...(noaa.event?.maximumWaterHeightM != null ? [{source:"NOAA/NCEI",type:"maximum_runup",value:noaa.event.maximumWaterHeightM,unit:"m"}] : []),
        ...(noaa.event?.numberOfRunupObservations != null ? [{source:"NOAA/NCEI",type:"runup_observation_count",value:noaa.event.numberOfRunupObservations}] : [])
      ] : [],
      human_impact:noaa?.status === "candidate" ? [
        ...(noaa.event?.deaths != null ? [{source:"NOAA/NCEI",type:"deaths",value:noaa.event.deaths}] : []),
        ...(noaa.event?.injuries != null ? [{source:"NOAA/NCEI",type:"injuries",value:noaa.event.injuries}] : []),
        ...(noaa.event?.housesDestroyed != null ? [{source:"NOAA/NCEI",type:"houses_destroyed",value:noaa.event.housesDestroyed}] : []),
        ...(noaa.event?.housesDamaged != null ? [{source:"NOAA/NCEI",type:"houses_damaged",value:noaa.event.housesDamaged}] : [])
      ] : [],
      aftermath:[], significance:[],
      uncertainty:[...(validation.status === "VERIFIED" ? [] : [validation.reason]),...claimConflicts.map(x=>x.reason)]
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
      conflictingSourcesMustBeFlagged:true,
      conflictedClaimsExcludedFromNarration:true
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
