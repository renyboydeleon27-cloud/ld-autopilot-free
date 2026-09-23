// LD AUTO Research Source Layer
// Builds a structured research plan/fact-pack candidate before narration.
// No OpenAI call here: authoritative-source retrieval is kept separate from prose generation.

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
    version: "research-layer-1",
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
      ? "Authoritative sources are registered. The next layer will fetch event-specific records and populate the fact pack."
      : "No authoritative source adapter is registered for this hazard type yet."
  });
}
