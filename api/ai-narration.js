import { buildResearch } from "./ai-research.js";
import { usageFromResponse, mergeApiUsage } from "./api-usage.js";

function naturalCaseValue(value) {
  const s=String(value??"").trim();
  if(!s) return "";
  if(/^[A-Z][A-Z\s.'-]+$/.test(s) && s.length>3) {
    return s.toLowerCase().replace(/\b[a-z]/g,m=>m.toUpperCase());
  }
  return s;
}

function articleFor(value) {
  const s=String(value??"").trim().toLowerCase();
  return /^[aeiou]/.test(s) ? "an" : "a";
}

function evidenceFallback(stage, evidence=[]) {
  const byField=Object.fromEntries(evidence.map(x=>[x.field,x.value]));
  const location=naturalCaseValue(byField["event.location"]);
  const country=naturalCaseValue(byField["event.country"]);
  const date=String(byField["event.date"]??"").trim();
  const cause=String(byField["event.cause"]??"").trim().toLowerCase();
  const magnitude=byField["earthquake.magnitude"];
  const water=byField["impact.maximumWaterHeightM"];
  const deaths=byField["impact.deaths"];
  const injuries=byField["impact.injuries"];
  const destroyed=byField["impact.housesDestroyed"];
  const damaged=byField["impact.housesDamaged"];

  if(stage==="HOOK" && date) {
    const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    const spoken=m ? new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric",timeZone:"UTC"}) : date;
    return `On ${spoken}, the disaster began.`;
  }
  if(stage==="P1" && location) return `The disaster unfolded in ${location}${country ? ", "+country : ""}.`;
  if(stage==="P2" && cause) return `The disaster began with ${articleFor(cause)} ${cause}.`;
  if(magnitude!==undefined) return `The earthquake had a magnitude of ${magnitude}.`;
  if(water!==undefined) return `Maximum water height reached ${water} metres.`;
  if(deaths!==undefined && injuries!==undefined) return `The disaster killed ${deaths} people and injured ${injuries}.`;
  if(deaths!==undefined) return `The death toll was ${deaths}.`;
  if(injuries!==undefined) return `${injuries} people were injured.`;
  if(destroyed!==undefined && damaged!==undefined) return `${destroyed} houses were destroyed and ${damaged} were damaged.`;
  if(destroyed!==undefined) return `${destroyed} houses were destroyed.`;
  if(damaged!==undefined) return `${damaged} houses were damaged.`;
  if(location) return `The event occurred in ${location}${country ? ", "+country : ""}.`;
  if(cause) return `The disaster began with ${articleFor(cause)} ${cause}.`;
  return "";
}

function sanitizeNarrationLine(stage, text, stageEvidence) {
  const t=String(text??"").trim();
  const metadataLeak=/\b(records?|recorded|dataset|database|field|entry|listed|NOAA|NCEI|USGS|source)\b/i;
  if(!metadataLeak.test(t)) return t;
  return evidenceFallback(stage, stageEvidence?.[stage]||[]) || t;
}

function polishNarrationQuality(stage, text, stageEvidence) {
  const t=String(text??"").trim();
  const evidence=stageEvidence?.[stage]||[];
  const byField=Object.fromEntries(evidence.map(x=>[x.field,x.value]));
  if(stage==="HOOK" && /^On .+, the disaster began\.$/i.test(t) &&
     String(byField["earthquake.shaking"]||"").toLowerCase()==="weak" &&
     String(byField["event.classification"]||"").toLowerCase()==="tsunami earthquake"){
    const date=String(byField["event.date"]||"").trim();
    const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    const spoken=m ? new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric",timeZone:"UTC"}) : date;
    if(spoken) return `On ${spoken}, the ground shook only weakly—but this was a tsunami earthquake.`;
  }
  if(stage==="P1" && /^The event occurred in /i.test(t)){
    return evidenceFallback(stage,evidence) || t;
  }
  if(stage==="P5" && /^At Miyako the water then began to rise at about 20:00\.$/i.test(t)){
    return "At Miyako, the water began to rise around 8:00 p.m.";
  }
  if(stage==="P6" && /largest wave at Miyako arrived at 20:07/i.test(t)){
    return "At 20:07, Miyako’s largest observed wave arrived about 4.5 metres high, with a booming sound.";
  }
  if(stage==="P8" && /^Six subsequent waves were observed at Miyako until noon the following day\.$/i.test(t)){
    return "Six more waves were observed at Miyako through noon the next day.";
  }
  if(stage==="P9" && /^The tsunami was instrumentally recorded at three tide-gauge stations in Japan\.$/i.test(t)){
    return "Three tide-gauge stations in Japan recorded the tsunami.";
  }
  if(stage==="P11" && /^An 1896 survey by Iki reported a maximum tsunami height of 24 metres at Yoshihama\.$/i.test(t)){
    return "An 1896 survey reported a maximum tsunami height of 24 metres at Yoshihama.";
  }
  if(stage==="P12" && /^A later survey by Matsuo reported an often-quoted 38-metre height at Shirahama\.$/i.test(t)){
    return "A later survey reported an often-cited tsunami height of 38 metres at Shirahama.";
  }
  if(stage==="P14" && /^This was the Sanriku tsunami of 1896-06-15 in Japan\.$/i.test(t)){
    return "This was the Sanriku tsunami of June 15, 1896, in Japan.";
  }
  return t;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"POST only" });

  const topic = String(req.body?.topic || "").trim().slice(0, 240);
  const format = req.body?.format === "longform" ? "longform" : "shorts";
  if (!topic) return res.status(400).json({ ok:false, error:"Please provide a disaster topic first." });
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) return res.status(500).json({ ok:false, error:"OPENAI_API_KEY is not configured on the server." });
  const apiUsageParts=[];
  const usagePayload=()=>mergeApiUsage(...apiUsageParts);

  // RESEARCH -> VALIDATION -> NARRATION GATE
  let research;
  try { research = await buildResearch(topic); }
  catch (e) { return res.status(502).json({ok:false,error:"Research verification failed: "+String(e?.message||e)}); }

  if (!research?.narrationGate?.allowed) {
    return res.status(422).json({
      ok:false,
      error:`Narration blocked by research gate: ${research?.validation?.status || "NEEDS_REVIEW"}. ${research?.validation?.reason || "Evidence is not strong enough yet."}`,
      research
    });
  }

  const isSanriku1896=/sanriku/i.test(topic) && /\b1896\b/.test(topic);
  const isRockyMountainLocust1874=/rocky mountain locust|locust plague/i.test(topic) && /\b1874\b/.test(topic);
  const storyMap = isSanriku1896 ? {
    HOOK:["event.date","earthquake.shaking","event.classification"],
    P1:["event.location","event.country"],
    P2:["event.cause","earthquake.sourceRegion"],
    P3:["earthquake.originLocalTime","observation.miyako.shockDurationMin"],
    P4:["observation.miyako.seaRecessionTime"],
    P5:["observation.miyako.waterRiseTime"],
    P6:["observation.miyako.largestWaveTime","observation.miyako.waveHeightM","observation.miyako.waveSound"],
    P7:["observation.miyako.pathDestruction"],
    P8:["observation.miyako.subsequentWaves"],
    P9:["tsunami.instrumentalTideGaugeStations"],
    P10:["impact.deaths","survey.yamana.villages"],
    P11:["survey.iki.maximumHeightM","survey.iki.maximumHeightLocation"],
    P12:["survey.matsuo.maximumHeightM","survey.matsuo.maximumHeightLocation"],
    P13:["tsunami.heightVariationShortDistance"],
    P14:["event.date","event.location","event.country"]
  } : isRockyMountainLocust1874 ? {
    HOOK:["event.year","event.species","impact.agriculture"],
    P1:["event.location","event.country"],
    P2:["outbreak.period","outbreak.range"],
    P3:["chronology.1874.june"],
    P4:["chronology.1874.july"],
    P5:["chronology.1874.lateJuly"],
    P6:["chronology.1874.august"],
    P7:["chronology.1874.october"],
    P8:["impact.agriculture"],
    P9:["impact.nebraskaFields"],
    P10:["impact.settlerDistress"],
    P11:["response.publicAid"],
    P12:["outbreak.broaderPeriod"],
    P13:["response.entomologicalCommission"],
    P14:["significance.kansasGrasshopperYear","event.year","event.species"]
  } : {
    HOOK:["event.date"],
    P1:["event.location","event.country"],
    P2:["event.cause"],
    P3:["earthquake.magnitude","earthquake.originTime"],
    P4:["impact.maximumWaterHeightM"],
    P5:["tsunami.numberOfRunupObservations"],
    P6:["impact.maximumWaterHeightM"],
    P7:["impact.housesDestroyed","impact.housesDamaged"],
    P8:["impact.deaths","impact.injuries"],
    P9:["impact.housesDestroyed","impact.housesDamaged"],
    P10:["impact.deaths","impact.injuries"],
    P11:["tsunami.numberOfRunupObservations","impact.maximumWaterHeightM"],
    P12:["impact.deaths","impact.injuries"],
    P13:["impact.housesDestroyed","impact.housesDamaged"],
    P14:["event.date","event.location","impact.maximumWaterHeightM","impact.deaths"]
  };
  const claimsByField = Object.fromEntries((research.verifiedClaims||[]).map(x=>[x.field,x]));
  const stageEvidence = Object.fromEntries(Object.entries(storyMap).map(([stage,fields])=>[
    stage, fields.map(field=>claimsByField[field]).filter(Boolean)
  ]));

  const evidenceForNarration = {
    validation: research.validation,
    exactNumbersAllowed: research.narrationGate.exactNumbersAllowed,
    verifiedClaims: research.verifiedClaims || [],
    factPack: research.factPack,
    sources: research.sources.map(s=>({authority:s.authority,name:s.name,url:s.url})),
    stageEvidence
  };

  // FREE PREFLIGHT — stop before any OpenAI call if a Shorts stage has no evidence.
  // This prevents spending generation/validator credits on a narration set that
  // the stage-scoped evidence validator would reject anyway.
  if(format==="shorts"){
    const missingStageEvidence=Object.entries(stageEvidence)
      .filter(([,items])=>!Array.isArray(items)||items.length===0)
      .map(([stage])=>stage);
    if(missingStageEvidence.length){
      return res.status(422).json({
        ok:false,
        error:"Narration preflight blocked before AI generation: some stages have no verified stage-specific evidence.",
        missingStageEvidence,
        creditSafe:true,
        researchStatus:research.validation.status
      });
    }
  }

  if(req.body?.preflightOnly===true){
    return res.status(200).json({
      ok:true,
      preflight:true,
      creditSafe:true,
      topic,
      format,
      researchStatus:research.validation.status,
      stageEvidenceSummary:Object.fromEntries(
        Object.entries(stageEvidence).map(([stage,items])=>[
          stage,
          (items||[]).map(x=>x.field)
        ])
      )
    });
  }

  // VERIFIED FACT PACK LAYER — narration must first build a structured evidence-aware fact pack.
  // This is intentionally separated from the prose-writing step so uncertain details can be excluded.
  const factPackInstruction = `
VERIFIED FACT PACK — INTERNAL FIRST PASS:
Before writing narration, silently build a fact pack for the selected event with these fields:
1. identity: canonical event name, year/date only when reliable, country/region.
2. cause: triggering hazard and mechanism; preserve scientific uncertainty.
3. chronology: ordered sequence of distinct, historically supportable events.
4. warning_conditions: only documented warning signs/conditions; otherwise mark unknown internally.
5. physical_impact: wave/run-up/inundation/eruption/shaking/wind/fire measurements only when sufficiently reliable.
6. human_impact: deaths, injuries, displacement, homes/damage only when sufficiently reliable.
7. aftermath: rescue, recovery, response, or documented consequences.
8. significance: documented scientific/historical lessons, not generic legacy language.
9. uncertainty: identify disputed, estimated, model-dependent, or poorly constrained details.

EVIDENCE GATE:
- Narration may use only details that survive this internal fact-pack audit.
- Never convert an estimate, disputed interpretation, or uncertain mechanism into a definite statement.
- If a numerical value is uncertain or sources historically vary, omit the number or use cautious qualitative wording.
- Do not fill an empty stage with plausible background detail. Advance to another supported fact instead.
- Historical database values can contain uncertainty, especially older events; preserve that uncertainty in wording.
- The fact pack is internal planning only. Return only the requested narration JSON, not the fact pack.
`;

  const stageNames = format === "shorts"
    ? ["HOOK", ...Array.from({length:14},(_,i)=>"P"+(i+1))]
    : ["HOOK", ...Array.from({length:30},(_,i)=>"S"+(i+1))];

  const system = `You are the Living Disaster Book narration engine.\n${factPackInstruction}
EVIDENCE-LOCKED NARRATION — HARD BOUNDARY:
- VERIFIED CLAIMS is the factual allow-list for event-specific narration. Treat it as stricter than the larger raw factPack.
- The RESEARCH EVIDENCE supplied by the user message is the ONLY factual source you may use for event-specific claims.
- Do NOT supplement it from model memory, common knowledge, inference, or typical disaster behavior.
- Every event-specific factual claim must exist in verifiedClaims. For Shorts, it must ALSO be explicitly entailed by that exact stage's stageEvidence; stageEvidence is the binding per-stage allow-list.
- Do not broaden a numeric database value into a range, ranking, superlative, comparison, or qualitative adjective such as strong/weak/deadly unless a verified claim explicitly supports that wording.
- Do not invent human activity/context (holidays, crowds, occupations, routines, reactions) from location/date alone.
- If a field is empty, that class of claim is unavailable. Do not invent it and do not replace it with a plausible generic event detail.
- Generic science may explain a mechanism only when the evidence pack identifies that mechanism for this event; generic science cannot establish that the mechanism happened in this event.
- Never state sea withdrawal/recession, strong or weak shaking, warning signs, witness behavior, community activities, rescue actions, exact wave behavior, or a named scientific classification unless that detail exists explicitly in the evidence pack.
- VERIFIED means the EVENT IDENTITY passed the source gate. It does NOT mean every possible historical detail is verified.
- If the evidence pack is too sparse to support all requested stages, return an evidence-insufficient error object instead of filling gaps: {"error":"INSUFFICIENT_EVIDENCE","missing":["chronology",...]}.

Write natural, human-sounding historical-documentary English for a general audience.
Preserve verified facts, dates, places, causes and consequences. Explain technical science clearly and cinematically.
FACT SAFETY LOCK:
- Never invent precise facts, dates, month/day, time of day, measurements, casualty figures, quotations, named locations, human activities, warning signs, or certainty.
- A detail appearing in the topic may be treated as user-supplied identity context only. Do not use additional event-specific historical details from model knowledge; they must appear in RESEARCH EVIDENCE.
- Do not infer morning/night, weather, celebrations, occupations, shoreline behavior, evacuation behavior, or what witnesses saw unless reliably established.
- Prefer a broader accurate sentence over a vivid unsupported detail.
- Separate established historical facts from cinematic phrasing. Cinematic language must never change the factual meaning.
- Before returning JSON, silently audit every stage for unsupported specificity, contradictions, repeated facts, and chronology errors. Rewrite anything questionable.

HOOK PERFORMANCE LOCK:
- HOOK is not a historical summary, lesson, conclusion, or policy statement. It is the first ~10 seconds of a Living Disaster short.
- Write one concise, speakable cinematic line that creates immediate tension or curiosity around the disaster itself.
- Prefer concrete disaster action and human-scale stakes that are historically safe. Avoid abstract phrases such as "changed lives and policy", "central chapter", "understanding of disasters", "legacy", or textbook-style significance.
- Do not manufacture a twist, warning sign, witness action, exact timing, or visual event just to make the hook dramatic.
- Keep the strongest reveal for the disaster while remaining factually grounded.
- P1-P14 should then progress chronologically without simply repeating the HOOK.

STAGE ROLE LOCK — SHORTS P1-P14:
- Plan the entire 15-stage story before writing any individual narration.
- HOOK: immediate fact-safe curiosity/tension; do not explain the whole event. When verified weak-shaking evidence exists for a tsunami earthquake, it may be used as the contrast that opens the story.
- P1: normal world, geography, exposed communities, and location context.
- P2: relevant tectonic/geologic setup only; do not narrate tsunami travel or impact yet.
- P3: the triggering earthquake/event itself.
- P4: historically established unusual warning conditions or the gap between trigger and disaster; if a verified local observation exists, anchor it to that named location and do not generalize it to the entire coast.
- P5: the next distinct verified local or physical development after P4. Do not invent a generation mechanism if one is not in evidence.
- P6: the next distinct verified wave arrival/measurement or approach detail.
- P7: verified peak coastal water-height/run-up evidence; do not turn one measurement into a coast-wide claim.
- P8: verified houses destroyed/property-destruction evidence.
- P9: verified additional property-damage evidence.
- P10: verified fatalities, non-graphic.
- P11: verified injuries or other distinct human-impact evidence.
- P12: verified subsequent-wave sequence or immediate aftermath evidence; keep local observations local.
- P13: verified scientific classification/source context, response, recovery, or documented historical consequence.
- P14: concise closing callback to event identity/date/location; do not repeat casualty or damage figures.
- Every panel owns one narrative job. Adjacent panels must not explain the same causal step.
- HARD NO-REUSE RULE: before drafting, assign each important fact or idea to exactly one stage. Once a fact is the main point of a stage, it cannot be the main point, explanation, warning, consequence, or paraphrase in the immediately following stage.
- Specifically, if P3 establishes unusually weak or limited felt shaking, P4 MUST NOT discuss weak shaking, lack of alarm, lack of warning from shaking, or the mismatch again. P4 must move to the next distinct verified event or condition.
- If no separate verified P4 warning condition exists, advance the chronology to the next distinct causal step rather than filling P4 with a paraphrase.
- Final audit: compare every adjacent pair (HOOK/P1, P1/P2 ... P13/P14). If two stages could be summarized by the same factual sentence, rewrite the later stage with new verified information.
- If the event does not support one role with reliable facts, move forward to another distinct verified fact instead of inventing filler.
- Do not force generic plate names or a simplified tectonic model when the event's mechanism is complex or uncertain.
- Avoid the phrase "radiated toward"; prefer natural spoken wording such as "spread across the ocean" when scientifically appropriate.

DOCUMENTARY NARRATION POLISH LOCK:
- Write natural, human-sounding historical-documentary English for a general audience.
- Prefer concrete cause-and-effect wording and short, speakable sentences over academic, bureaucratic, or textbook language.
- Avoid phrases like "radiated toward", "sea-borne threat", "central chapter", "modest shaking", and other unnecessarily formal wording when plain English is clearer.
- Each stage must advance the story with materially new information. Do not restate the same weak-shaking, wave, impact, casualty, or aftermath point across adjacent stages.
- Preserve verified facts and chronology while simplifying technical science accurately.
- Do not claim what people expected, knew, believed, noticed, or understood unless that is historically established. Describe observable conditions instead.
- Aim for narration that can be spoken naturally in about 8-10 seconds per stage.
Avoid robotic wording, keyword stuffing, repetitive event-name insertion, textbook jargon and redundant dates.
Each stage must be concise and speakable, roughly suitable for about 8-10 seconds of narration.
HOOK should create immediate curiosity without making a false claim.
For Shorts, build a coherent progression: setting/context -> cause/build-up -> trigger -> escalation -> peak impact -> aftermath/rescue -> displacement/recovery -> lessons/legacy.
Do not repeat the same fact across adjacent stages.
Adults only; no gore.
DOCUMENTARY EVIDENCE TRANSLATION LOCK:
STAGE-EVIDENCE EXCLUSIVITY LOCK:
For Shorts, each stage may use ONLY the claims listed in stageEvidence for that exact stage. The global verifiedClaims list exists for validation and must NOT be used to import a fact assigned to another stage.
Do not move impact measurements, casualty figures, damage figures, or other later-stage facts into HOOK/P1/P2 unless that exact claim appears in that stage's stageEvidence.
If a stage has little evidence, write one short natural sentence from its assigned evidence. Never borrow from another stage to make it more dramatic.

Write the verified facts as natural historical-documentary narration, not as database metadata.
Never say "field", "entry", "dataset", "database", "recorded location field", "country field", "official cause listed", or similar source-interface language in narration. Also never say "records list", "records show", "is recorded as", "recorded for", "official records", "historical dataset", "listed as", or "the record" merely to attribute a verified fact.
Source names and provenance belong to validation, not spoken narration, unless the source itself is historically relevant to the story.
You MAY make a purely linguistic transformation of a verified claim without adding facts. Example: verified location Sanriku + country Japan may become "Along Japan's Sanriku coast" only when "coast" is already explicit in the selected topic/event identity; otherwise say "in Sanriku, Japan."
A verified cause value of earthquake may become "The disaster began with an earthquake" or "An earthquake triggered the tsunami" only when the verified event identity is a tsunami and the cause claim explicitly says earthquake.
Keep sentences human, concrete, cinematic, and speakable. Do not add people, weather, warning signs, sensory details, rankings, comparisons, or causal mechanisms that are absent from VERIFIED CLAIMS.
Do not pad a stage with metadata wording just to make it longer. If evidence is sparse, prefer a short natural sentence.

Return ONLY valid JSON in exactly this shape:
{"stages":{"HOOK":"...","P1":"..."}}
Include every requested stage key exactly once and no markdown.`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method:"POST",
      headers:{
        "Authorization":`Bearer ${apiKey}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        model:"gpt-5-mini",
        text:{format:{type:"json_schema",name:"narration_set",strict:true,schema:{type:"object",properties:{stages:{type:"object",properties:Object.fromEntries(stageNames.map(n=>[n,{type:"string"}])),required:stageNames,additionalProperties:false}},required:["stages"],additionalProperties:false}}},
        input:[
          {role:"system",content:[{type:"input_text",text:system}]},
          {role:"user",content:[{type:"input_text",text:`Topic: ${topic}\nFormat: ${format}\nRequired stages: ${stageNames.join(", ")}\nGenerate the complete narration set.\n\nRESEARCH EVIDENCE (authoritative-source gate):\n${JSON.stringify(evidenceForNarration)}\nUse this evidence as the factual boundary. If exactNumbersAllowed is false, do not state exact numerical claims from uncertain fields.`}]}
        ],
        max_output_tokens: 8000
      })
    });
    const data = await response.json();
    apiUsageParts.push(usageFromResponse(data,"gpt-5-mini"));
    if (!response.ok) return res.status(response.status).json({ok:false,error:data?.error?.message || "OpenAI request failed."});
    const raw = data.output_text || (data.output || []).flatMap(x=>x.content||[]).map(x=>x.text||"").join("").trim();
    let parsed;
    try { parsed = JSON.parse(raw.replace(/^\`\`\`json\s*/i,"").replace(/\`\`\`$/,"").trim()); }
    catch { return res.status(502).json({ok:false,error:"AI returned an unexpected format. Please try again.",outputPreview:raw.slice(0,700),outputLength:raw.length,responseStatus:data.status||null,incompleteReason:data.incomplete_details?.reason||null}); }
    if (parsed?.error === "INSUFFICIENT_EVIDENCE") {
      return res.status(422).json({
        ok:false,
        error:"Research verified the event identity, but the evidence pack is too sparse for evidence-locked HOOK + panels.",
        missingEvidence:Array.isArray(parsed.missing)?parsed.missing:[],
        researchStatus:research.validation.status
      });
    }
    const stages = parsed?.stages || {};

    // CLAIM-LEVEL EVIDENCE VALIDATOR — semantic second pass.
    // Unlike phrase blacklists, this asks the model to map every event-specific
    // claim to the retrieved evidence pack, then rejects unsupported claims.
    const validatorResponse = await fetch("https://api.openai.com/v1/responses", {
      method:"POST",
      headers:{"Authorization":`Bearer ${apiKey}`,"Content-Type":"application/json"},
      body:JSON.stringify({
        model:"gpt-5-mini",
        text:{format:{type:"json_schema",name:"evidence_audit",strict:true,schema:{type:"object",properties:{valid:{type:"boolean"},unsupported:{type:"array",items:{type:"object",properties:{stage:{type:"string"},claim:{type:"string"},reason:{type:"string"}},required:["stage","claim","reason"],additionalProperties:false}}},required:["valid","unsupported"],additionalProperties:false}}},
        input:[
          {role:"system",content:[{type:"input_text",text:`You are a strict evidence auditor. Compare each narration stage ONLY against the supplied STAGE EVIDENCE for that exact stage. Do not use outside knowledge or borrow facts assigned to another stage. Event identity being VERIFIED does not verify other details. Split each stage into event-specific factual claims. A claim is supported only if that stage's evidence explicitly entails it; paraphrases are allowed, inference and typical disaster behavior are not. Generic connective/cinematic wording is allowed only when it adds no new factual assertion. Return JSON exactly: {"valid":true,"unsupported":[]} or {"valid":false,"unsupported":[{"stage":"HOOK","claim":"...","reason":"..."}]}.`}]},
          {role:"user",content:[{type:"input_text",text:`STAGE EVIDENCE:\n${JSON.stringify(stageEvidence)}\n\nNARRATION:\n${JSON.stringify(stages)}`}]}
        ],
        max_output_tokens:4000
      })
    });
    const validatorData = await validatorResponse.json();
    apiUsageParts.push(usageFromResponse(validatorData,"gpt-5-mini"));
    if (!validatorResponse.ok) {
      return res.status(502).json({ok:false,error:validatorData?.error?.message || "Evidence validator request failed."});
    }
    const validatorRaw = validatorData.output_text || (validatorData.output || []).flatMap(x=>x.content||[]).map(x=>x.text||"").join("").trim();
    let audit;
    try { audit=JSON.parse(validatorRaw.replace(/^\`\`\`json\s*/i,"").replace(/\`\`\`$/,"").trim()); }
    catch { return res.status(502).json({ok:false,error:"Evidence validator returned an unexpected format."}); }
    if (audit?.valid !== true || (Array.isArray(audit?.unsupported) && audit.unsupported.length)) {
      const unsupported=Array.isArray(audit?.unsupported)?audit.unsupported:[];
      const repairStages=[...new Set(unsupported.map(x=>x.stage).filter(s=>stageNames.includes(s)))];
      if (!repairStages.length) {
        return res.status(422).json({ok:false,error:"Narration rejected by claim-level evidence validator.",unsupportedClaims:unsupported,researchStatus:research.validation.status});
      }

      // AUTO-REPAIR only the rejected stages. Keep already-supported stages unchanged.
      const repairResponse=await fetch("https://api.openai.com/v1/responses",{
        method:"POST",
        headers:{"Authorization":`Bearer ${apiKey}`,"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"gpt-5-mini",
          text:{format:{type:"json_schema",name:"repaired_stages",strict:true,schema:{type:"object",properties:Object.fromEntries(repairStages.map(n=>[n,{type:"string"}])),required:repairStages,additionalProperties:false}}},
          input:[
            {role:"system",content:[{type:"input_text",text:"Rewrite ONLY the requested rejected narration stages. Use ONLY facts explicitly entailed by the supplied STAGE EVIDENCE for each exact stage. Never borrow facts from another stage. Remove unsupported ranking, comparison, sensory, witness, warning, or causal claims. Do not use outside knowledge. Keep each line natural, cinematic, concise, and about 8-10 seconds. Return only the requested stage keys."}]},
            {role:"user",content:[{type:"input_text",text:`STAGE EVIDENCE:\n${JSON.stringify(Object.fromEntries(repairStages.map(s=>[s,stageEvidence[s]||[]])))}\n\nREJECTED CLAIMS:\n${JSON.stringify(unsupported)}\n\nCURRENT REJECTED STAGES:\n${JSON.stringify(Object.fromEntries(repairStages.map(s=>[s,stages[s]])))}`}]}
          ],
          max_output_tokens:4000
        })
      });
      const repairData=await repairResponse.json();
      apiUsageParts.push(usageFromResponse(repairData,"gpt-5-mini"));
      if(!repairResponse.ok) return res.status(502).json({ok:false,error:repairData?.error?.message||"Narration auto-repair failed."});
      const repairRaw=repairData.output_text||(repairData.output||[]).flatMap(x=>x.content||[]).map(x=>x.text||"").join("").trim();
      let repaired;
      try{
        repaired=JSON.parse(repairRaw.replace(/^```json\s*/i,"").replace(/```$/,"").trim());
        if(repaired?.stages && typeof repaired.stages==="object") repaired=repaired.stages;
      }catch{
        return res.status(502).json({ok:false,error:"Narration auto-repair returned an unexpected format.",repairPreview:repairRaw.slice(0,700),repairLength:repairRaw.length,repairStatus:repairData.status||null,repairIncompleteReason:repairData.incomplete_details?.reason||null});
      }
      for(const s of repairStages) if(typeof repaired?.[s]==="string"&&repaired[s].trim()) stages[s]=repaired[s].trim();

      // Revalidate repaired stages semantically against the same evidence boundary.
      const recheckResponse=await fetch("https://api.openai.com/v1/responses",{
        method:"POST",
        headers:{"Authorization":`Bearer ${apiKey}`,"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"gpt-5-mini",
          text:{format:{type:"json_schema",name:"repair_audit",strict:true,schema:{type:"object",properties:{valid:{type:"boolean"},unsupported:{type:"array",items:{type:"object",properties:{stage:{type:"string"},claim:{type:"string"},reason:{type:"string"}},required:["stage","claim","reason"],additionalProperties:false}}},required:["valid","unsupported"],additionalProperties:false}}},
          input:[
            {role:"system",content:[{type:"input_text",text:"Strictly audit each repaired narration stage ONLY against the supplied STAGE EVIDENCE for that exact stage. Do not use outside knowledge or facts assigned to another stage. A claim is supported only if explicitly entailed by that stage's evidence. Return valid=true only if every event-specific claim is supported."}]},
            {role:"user",content:[{type:"input_text",text:`STAGE EVIDENCE:\n${JSON.stringify(Object.fromEntries(repairStages.map(s=>[s,stageEvidence[s]||[]])))}\n\nREPAIRED STAGES:\n${JSON.stringify(Object.fromEntries(repairStages.map(s=>[s,stages[s]])))}`}]}
          ],
          max_output_tokens:1500
        })
      });
      const recheckData=await recheckResponse.json();
      apiUsageParts.push(usageFromResponse(recheckData,"gpt-5-mini"));
      if(!recheckResponse.ok) return res.status(502).json({ok:false,error:recheckData?.error?.message||"Narration repair validation failed."});
      const recheckRaw=recheckData.output_text||(recheckData.output||[]).flatMap(x=>x.content||[]).map(x=>x.text||"").join("").trim();
      let recheck;
      try{recheck=JSON.parse(recheckRaw.replace(/^\`\`\`json\s*/i,"").replace(/\`\`\`$/,"").trim());}
      catch{return res.status(502).json({ok:false,error:"Narration repair validator returned an unexpected format."});}
      if(recheck?.valid!==true||(Array.isArray(recheck?.unsupported)&&recheck.unsupported.length)){
        return res.status(422).json({ok:false,error:"Narration auto-repair was still not fully supported by evidence.",unsupportedClaims:Array.isArray(recheck?.unsupported)?recheck.unsupported:[],researchStatus:research.validation.status});
      }
    }

    // PROGRAMMATIC EVIDENCE GUARD — reject high-risk event claims unless the
    // retrieved fact pack explicitly contains evidence for that claim class.
    const fp = research.factPack || {};
    const evidenceText = JSON.stringify({factPack:fp,verifiedClaims:research.verifiedClaims||[]}).toLowerCase();
    const hasEvidence = (...terms) => terms.some(term => evidenceText.includes(term));
    const unsupportedClaims = [];
    const claimRules = [
      {
        id:"sensory-roar",
        re:/\b(roar|roaring|thunder-like|thunderous|rumbl(?:e|ing))\b/i,
        supported:()=>hasEvidence("roar","thunder","rumbl")
      },
      {
        id:"sea-recession",
        re:/\b(sea|ocean|water)\b[^.!?]{0,80}\b(pulled back|receded|withdrew|retreated)\b|\b(pulled back|receded|withdrew|retreated)\b[^.!?]{0,80}\b(sea|ocean|water)\b/i,
        supported:()=>hasEvidence("reced","withdraw","retreat","pulled back")
      },
      {
        id:"shaking-strength",
        re:/\b(strong|violent|weak|faint|mild|limited|modest)\b[^.!?]{0,50}\b(quake|earthquake|shaking|tremor)\b|\b(quake|earthquake|shaking|tremor)\b[^.!?]{0,50}\b(strong|violent|weak|faint|mild|limited|modest)\b/i,
        supported:()=>hasEvidence("shaking","tremor","intensity")
      },
      {
        id:"witness-knowledge",
        re:/\b(people|residents|villagers|survivors|witnesses)\b[^.!?]{0,100}\b(saw|heard|noticed|knew|realized|expected|understood|watched)\b/i,
        supported:()=>hasEvidence("witness","heard","noticed","observed","testimony")
      },
      {
        id:"rescue-response",
        re:/\b(rescue|rescued|evacuat(?:e|ed|ion)|relief|aid)\b/i,
        supported:(stage)=>{
          const stageItems=stageEvidence?.[stage]||[];
          const stageText=JSON.stringify(stageItems).toLowerCase();
          return (Array.isArray(fp.aftermath) && fp.aftermath.length>0) ||
            stageItems.some(x=>String(x?.field||"").startsWith("response.")) ||
            /relief|aid|assistance|rescue|evacuat/.test(stageText);
        }
      }
    ];
    for (const [stage,text] of Object.entries(stages)) {
      if (typeof text !== "string") continue;
      for (const rule of claimRules) {
        if (rule.re.test(text) && !rule.supported(stage)) unsupportedClaims.push({stage,claimClass:rule.id,text});
      }
    }
    if (unsupportedClaims.length) {
      return res.status(422).json({
        ok:false,
        error:"Narration rejected by programmatic evidence guard: unsupported event-specific claim detected.",
        unsupportedClaims,
        researchStatus:research.validation.status
      });
    }

    for (const name of stageNames) {
      if (typeof stages[name] !== "string" || !stages[name].trim()) return res.status(502).json({ok:false,error:`AI response is missing ${name}. Please try again.`});
      stages[name] = polishNarrationQuality(name, sanitizeNarrationLine(name, stages[name], stageEvidence), stageEvidence);
    }
    return res.status(200).json({ok:true,topic,format,researchStatus:research.validation.status,stages});
  } catch (err) {
    return res.status(500).json({ok:false,error:"AI narration error: "+String(err?.message||err)});
  }
}
