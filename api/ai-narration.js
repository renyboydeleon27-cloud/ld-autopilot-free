import { buildResearch } from "./ai-research.js";
import { expandResearch, curatedNarration } from "./narration-research.js";
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
  const requestedStage = String(req.body?.requestedStage || "").trim().toUpperCase();
  const skipStages = new Set(
    (Array.isArray(req.body?.skipStages) ? req.body.skipStages : [])
      .map(x=>String(x||"").trim().toUpperCase())
      .filter(x=>/^(HOOK|P(?:[1-9]|1[0-4]))$/.test(x))
  );
  const rawProductionStages = req.body?.productionStages && typeof req.body.productionStages === "object"
    ? req.body.productionStages
    : {};
  const productionStages = {};
  for (const [rawStage, rawValue] of Object.entries(rawProductionStages)) {
    const stage=String(rawStage||"").trim().toUpperCase();
    if(!/^(HOOK|P(?:[1-9]|1[0-4]))$/.test(stage)) continue;
    const value=rawValue && typeof rawValue==="object" ? rawValue : {};
    productionStages[stage]={
      role:String(value.role||"").trim().slice(0,500),
      scene:String(value.scene||"").trim().slice(0,1800),
      prompt:String(value.prompt||"").trim().slice(0,2200)
    };
  }
  if (!topic) return res.status(400).json({ ok:false, error:"Please provide a disaster topic first." });
  if(requestedStage && format==="shorts" && !/^(HOOK|P(?:[1-9]|1[0-4]))$/.test(requestedStage)){
    return res.status(400).json({ok:false,error:"requestedStage must be HOOK or P1–P14 for Shorts."});
  }
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) return res.status(500).json({ ok:false, error:"OPENAI_API_KEY is not configured on the server." });
  const apiUsageParts=[];
  const usagePayload=()=>mergeApiUsage(...apiUsageParts);

  // RESEARCH -> VALIDATION -> NARRATION GATE
  let research;
  try { research = await buildResearch(topic); }
  catch (e) { return res.status(502).json({ok:false,error:"Research verification failed: "+String(e?.message||e)}); }

  // COST GUARD V3: reuse an already-valid research pack. Expansion is only
  // allowed when the base/curated pack cannot pass the narration gate.
  // This avoids paying for a second web-research pass merely because an event
  // is not in the curated-topic list.
  if(req.body?.preflightOnly!==true && !research?.narrationGate?.allowed){
    research=await expandResearch(topic,research,{apiKey,onUsage:usage=>apiUsageParts.push(usage),maxAttempts:2});
  }

  if (!research?.narrationGate?.allowed) {
    return res.status(422).json({
      ok:false,
      error:`Narration blocked by research gate: ${research?.validation?.status || "NEEDS_REVIEW"}. ${research?.validation?.reason || "Evidence is not strong enough yet."}`,
      research, apiUsage:usagePayload()
    });
  }

  const isSanriku1896=/sanriku/i.test(topic) && /\b1896\b/.test(topic);
  const isRockyMountainLocust1874=/rocky mountain locust|locust plague/i.test(topic) && /\b1874\b/.test(topic);
  const isWellingtonAvalanche1910=/wellington|stevens pass|train disaster/i.test(topic) && /\b1910\b/.test(topic) && /avalanche|wellington/i.test(topic);
  const isXylazinePhiladelphia2020s=/xylazine|zombie drug|tranq/i.test(topic) && /philadelphia|pennsylvania/i.test(topic);
  const isMessina1908=/messina|reggio calabria/i.test(topic) && /\b1908\b/.test(topic) && /tsunami/i.test(topic);
  const storyMap = research.stageMap || (isMessina1908 ? {
    HOOK:["tsunami.initialMovement"],
    P1:["event.location","event.country"],
    P2:["event.date","earthquake.magnitude"],
    P3:["impact.destroyedAreaKm2"],
    P4:["tsunami.withdrawalDistanceM"],
    P5:["tsunami.waveSequence"],
    P6:["tsunami.sicilyMaxRunupM"],
    P7:["impact.coasts"],
    P8:["impact.tsunamiDamage"],
    P9:["impact.waveHeightOver13m"],
    P10:["tsunami.effectsNorthernSicily"],
    P11:["tsunami.maltaReached","tsunami.maltaSeaLevelRiseM"],
    P12:["impact.combinedFatalitiesApprox"],
    P13:["tsunami.civitavecchiaRecorded"],
    P14:["tsunami.observationPoints"]
  } : isXylazinePhiladelphia2020s ? {
    HOOK:["event.location","drug.fentanylAssociation"],
    P1:["drug.type"],
    P2:["philadelphia.2019Share"],
    P3:["trend.us2020to2021"],
    P4:["trend.northeast"],
    P5:["drug.fentanylAssociation"],
    P6:["impact.overdose"],
    P7:["impact.severeWounds"],
    P8:["impact.sepsisAmputationRisk"],
    P9:["trend.imfDeaths2019to2022"],
    P10:["response.withdrawalStandards"],
    P11:["response.woundCare"],
    P12:["response.overdoseTraining"],
    P13:["response.drugChecking"],
    P14:["event.location","impact.severeWounds","response.woundCare"]
  } : isWellingtonAvalanche1910 ? {
    HOOK:["event.date"],
    P1:["event.location","event.country"],
    P2:["chronology.trainsHaltedPeriod"],
    P3:["chronology.trainTypes"],
    P4:["hazard.repeatedAvalanches"],
    P5:["chronology.passengersLeftForScenic"],
    P6:["hazard.railGradeSlidePaths"],
    P7:["hazard.denudedSlopes"],
    P8:["hazard.weatherPatterns"],
    P9:["impact.avalancheHit"],
    P10:["impact.sweptIntoCanyon"],
    P11:["impact.fatalities","impact.propertyDamage"],
    P12:["response.rescueArrival"],
    P13:["response.recoveryWeeks"],
    P14:["aftermath.railroadRerouted","aftermath.tunnelBypassedSlideArea"]
  } : isSanriku1896 ? {
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
  });
  const claimsByField = Object.fromEntries((research.verifiedClaims||[]).map(x=>[x.field,x]));
  const stageEvidence = Object.fromEntries(Object.entries(storyMap).map(([stage,fields])=>[
    stage, fields.map(field=>claimsByField[field]).filter(Boolean)
  ]));

  // Evidence allocator guard: detect structural reuse before spending AI credits.
  // Reuse is allowed for basic identity fields, but substantive disaster facts
  // should have one primary owner stage unless an event-specific map explicitly
  // supplies a distinct claim.
  const reusableIdentityFields=new Set(["event.year","event.date","event.location","event.country"]);
  const substantiveOwners={};
  for(const [stage,fields] of Object.entries(storyMap)){
    for(const field of fields){
      if(reusableIdentityFields.has(field) || !claimsByField[field]) continue;
      (substantiveOwners[field] ||= []).push(stage);
    }
  }
  const repeatedSubstantiveEvidence=Object.fromEntries(
    Object.entries(substantiveOwners).filter(([,stages])=>stages.length>1)
  );

  const evidenceForNarration = {
    validation: research.validation,
    storyQualityWarnings: research.storyQualityWarnings || null,
    exactNumbersAllowed: research.narrationGate.exactNumbersAllowed,
    verifiedClaims: research.verifiedClaims || [],
    factPack: research.factPack,
    sources: research.sources.map(s=>({authority:s.authority,name:s.name,url:s.url})),
    stageEvidence
  };

  // FREE PREFLIGHT — stop before any OpenAI call if a Shorts stage has no evidence.
  // This prevents spending generation/validator credits on a narration set that
  // the stage-scoped evidence validator would reject anyway.
  if(String(format||"").trim().toLowerCase().includes("short")){
    const preflightStages=(requestedStage?[requestedStage]:Object.keys(stageEvidence)).filter(stage=>!skipStages.has(stage));
    const missingStageEvidence=preflightStages
      .filter(stage=>!Array.isArray(stageEvidence[stage])||stageEvidence[stage].length===0);

    // Narrative Evidence Sufficiency Gate V1:
    // identity-only evidence can frame a story, but must never be used as filler
    // to occupy later impact/aftermath panels simply to satisfy P1-P14.
    const identityOnlyStages=preflightStages.filter(stage=>{
      const items=Array.isArray(stageEvidence[stage])?stageEvidence[stage]:[];
      return items.length>0 && items.every(item=>reusableIdentityFields.has(item.field));
    });
    const identityFramingAllowance=new Set(["HOOK","P1","P2"]);
    const fillerIdentityStages=identityOnlyStages.filter(stage=>!identityFramingAllowance.has(stage));
    const meaningfulStages=preflightStages.filter(stage=>{
      const items=Array.isArray(stageEvidence[stage])?stageEvidence[stage]:[];
      return items.some(item=>!reusableIdentityFields.has(item.field));
    });
    const narrativeEvidenceInsufficient=fillerIdentityStages.length>0;

    if(missingStageEvidence.length || narrativeEvidenceInsufficient){
      return res.status(422).json({
        ok:false,
        error:narrativeEvidenceInsufficient
          ?"Narration preflight blocked before AI generation: verified research is not narratively sufficient for all requested stages. Identity facts such as date, year, country, or location cannot be used as filler for later panels."
          :"Narration preflight blocked before AI generation: some stages have no verified stage-specific evidence.",
        missingStageEvidence,
        fillerIdentityStages,
        meaningfulStageCount:meaningfulStages.length,
        requestedStageCount:preflightStages.length,
        repeatedSubstantiveEvidence,
        needsResearchExpansion:narrativeEvidenceInsufficient,
        creditSafe:apiUsageParts.length===0,
        apiUsage:usagePayload(),
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

  const allStageNames = format === "shorts"
    ? ["HOOK", ...Array.from({length:14},(_,i)=>"P"+(i+1))]
    : ["HOOK", ...Array.from({length:30},(_,i)=>"S"+(i+1))];
  const stageNames = (requestedStage ? [requestedStage] : allStageNames).filter(stage=>!skipStages.has(stage));

  const rawTiming=req.body?.targetStageSeconds&&typeof req.body.targetStageSeconds==="object"?req.body.targetStageSeconds:{};
  const timingTargets=Object.fromEntries(stageNames.map(stage=>{
    const sec=Number(rawTiming[stage]);
    return [stage,Number.isFinite(sec)&&sec>0?Math.max(1,Math.min(15,sec)):null];
  }).filter(([,sec])=>sec));
  const timingInstruction=Object.keys(timingTargets).length?
    "\nFINAL EDIT TIMING POLISH — HIGHEST PRIORITY AFTER FACT SAFETY:\n"+
    "- Transitions have already been applied. These are the FINAL spoken windows for each stage.\n"+
    "- Write narration specifically for these final panel durations: "+Object.entries(timingTargets).map(([stage,sec])=>stage+"="+sec.toFixed(2)+"s (~"+Math.max(4,Math.round(sec*2.0))+"-"+Math.max(6,Math.round(sec*2.35))+" spoken words)").join(", ")+".\n"+
    "- TIMING FIT V2.2: treat each supplied duration as a hard spoken-window budget, not a target to fill completely.\n"+
    "- Aim for roughly 78-90% spoken occupancy at a natural documentary pace, leaving a short breathing margin for clean panel entry/exit and editor transitions.\n"+
    "- Prefer a complete shorter sentence over extra clauses added only to consume time. Never add unsupported detail, repeat a fact, or slow the wording unnaturally just to fill the window.\n"+
    "- If a verified fact needs more words than the window comfortably allows, preserve the essential fact and remove nonessential connective wording first; never move the overflow into the next panel.\n"+
    "- Sentence complexity should scale with the window: short windows get one direct clause; longer windows may use one compact second clause only when it adds distinct stage-supported information.\n"+
    "- Readability check: avoid tongue-twisting names, stacked numbers, or dense clauses when a simpler evidence-equivalent phrasing fits the same panel more naturally.\n"+
    "- HOOK has narration in this final edited version. Keep it concise, tense, and grounded in that HOOK stage evidence.\n"+
    "- Do NOT shorten several panels into a single summary. Each stage must have its own complete line tied only to that stage.\n"+
    "- You may use neutral connective wording that adds no new event-specific facts, but never pad with invented details.\n"+
    "- The final narrator will be generated panel by panel, so every stage must stand alone and end cleanly.\n":"";

  const system = `You are the Living Disaster Book narration engine.\n${factPackInstruction}\n${req.body?.narrativeFormat==='causal-v1'?'NEW LD FORMAT TRIAL V1: Preserve the selected hook and exact event-specific stage chronology. Every stage must add a distinct development or consequence. Connect supported causes to effects, establish meaningful stakes, build intensity through the assigned impact stages, and make aftermath specific to available evidence. Avoid generic repeated filler. Do not invent facts, warnings, people, or causal links to satisfy this style. Preserve all duration and visual locks.':''}${isWellingtonAvalanche1910?'\nWELLINGTON 1910 EVENT LOCK: This is a snow-avalanche railroad disaster, not a tsunami or earthquake. Follow the supplied Wellington stageEvidence exactly. Do not introduce waves, seismic magnitude, coastal effects, or unrelated hazard mechanics.':''}${isMessina1908?'\nMESSINA 1908 FINAL RHYTHM LOCK:\n- HOOK may dramatize the verified initial sea withdrawal, but do not repeat its duration or distance there; reserve the measured withdrawal distance and duration for P4.\n- P4 owns the approximately 200-metre withdrawal and few-minute duration. It must advance beyond the HOOK rather than replay it.\n- P6 and P9 are different measurements from different evidence: P6 is the documented 11.9-metre run-up at Sant\'Alessio; P9 is the separate Italian report of waves over 13 metres in some places. Phrase them so they read as distinct location/observation evidence, not as one measurement changing value.\n- Preserve all exact evidence boundaries; do not infer wave height from run-up or run-up from wave height.':''}${isXylazinePhiladelphia2020s?'\nXYLAZINE PHILADELPHIA STORY-FIRST LOCK V2.6:\n- This is a developing public-health crisis, not a sudden physical disaster.\n- Tell one evidence-locked story: identify xylazine -> early Philadelphia evidence -> documented spread -> local fentanyl association -> distinct human harms -> broader trend -> distinct public-health responses -> Philadelphia significance.\n- P1-P5 must flow as narration, not five research excerpts. State supported findings directly; avoid repetitive source-style openings.\n- P2-P4 SOURCE VARIETY LOCK: do not open these three consecutive panels with CDC, laboratory testing, surveillance, officials, or another source label. Keep every verified number/time period, but move attribution later when attribution is needed. At most ONE of P2-P4 may begin with a source/institution.\n- P2-P4 STORY MOVEMENT: P2 = early Philadelphia signal; P3 = documented national expansion; P4 = Northeast concentration. Make that progression audible without inventing causality.\n- P6-P9 must have distinct jobs: overdose harm -> severe wounds -> serious complications -> broader mortality trend.\n- P10-P13 must have distinct jobs: withdrawal management -> wound care -> overdose-response training -> drug checking/test strips.\n- P14 SHORT PAYOFF LOCK: close on Philadelphia being particularly hard hit. Do not repeat the severe-wounds detail from P7/P8 and do not repeat wound-care support/best-practices from P11. If P14 evidence overlaps earlier panels, omit duplicated details rather than summarizing them again. Prefer one concise closing sentence.\n- FULL-STORY REPETITION AUDIT: compare every line against earlier lines, especially P14 against P7, P8 and P11. Remove duplicated supporting facts when the stage remains truthful without them.\n- FINAL STORY RHYTHM POLISH: after factual drafting, silently read P1-P14 as one uninterrupted voice-over. Improve only wording, sentence openings, verb variety and transitions that add ZERO new factual claims. The finished sequence must feel like one developing documentary story rather than fourteen database entries.\n- P5-P6 SUBJECT COLLISION LOCK: do not begin both adjacent panels with Philadelphia officials, Local officials, officials, authorities, or equivalent institutional subjects. Preserve attribution when required, but move it later in one sentence or use a direct evidence-supported construction.\n- HUMAN-IMPACT ESCALATION RHYTHM: P6 introduces overdose harm, P7 moves to severe wounds, P8 reaches documented serious complications, and P9 widens to the mortality trend. Keep these four beats distinct and progressively weightier through wording only; never exaggerate severity beyond evidence.\n- RESPONSE TRANSITION RHYTHM: P10 marks the narrative turn from documented harm toward response. P10-P13 should sound like forward movement through four different actions, not a checklist. Use neutral transitions only when they assert no new chronology or causality.\n- SENTENCE-MUSIC CHECK: avoid three consecutive sentences with the same grammatical shape, repeated city/source subjects, or repeated verbs such as report, describe, developed, updated. Prefer clear spoken English that fits the target stage duration.\n- FACT-PRESERVATION OVERRIDE: rhythm polish may NEVER replace, soften, strengthen, combine, infer, or embellish a verified claim. When storytelling and evidence conflict, evidence wins.\n- Vary adjacent sentence openings and remove duplicate ideas, but never add facts or causal links absent from that exact stage evidence.\n- Never add symptoms, street behavior, visual stereotypes, motives, individual stories, causality, or medical claims absent from the exact stage evidence.':''}${timingInstruction}
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

STAGE ROLE LOCK — SHORTS P1-P14 — EVENT-ADAPTIVE V2:
- Plan the complete requested story arc before writing any individual narration line.
- The exact STAGE EVIDENCE and APPROVED PRODUCTION STAGE CONTEXT define each panel's narrative job. Do not force tsunami, earthquake, cyclone, avalanche, fire, flood, or other hazard roles onto a different disaster type.
- Treat the production flow as one continuous documentary story, not a collection of independent panel summaries. For slow-moving crises, epidemics, drug crises, environmental crises, and other non-sudden events, use evidence-driven emergence -> spread -> human consequences -> response -> significance rather than forcing a sudden-disaster impact template.
- For each stage, silently assign one role from this arc when supported: SETUP -> BUILDUP -> WARNING/INSTABILITY -> TRIGGER -> ESCALATION -> PEAK IMPACT -> IMMEDIATE CONSEQUENCE -> AFTERMATH -> RESCUE -> SURVIVAL/RELIEF -> RECOVERY -> HISTORICAL PAYOFF.
- The role sequence is descriptive, not a license to invent facts. Skip or combine unsupported roles rather than manufacturing details.
- Every panel owns ONE primary narrative job. Adjacent panels must advance time, cause/effect, location, human consequence, response, or historical meaning.
- Use the previous and next requested stage as continuity context. A line should naturally hand the story forward without previewing facts assigned to the next stage.
- NEIGHBOR AWARENESS V2.1: before drafting each requested stage, silently inspect the immediately previous and next requested stage evidence plus their APPROVED PRODUCTION STAGE CONTEXT. Use neighbors only to understand continuity, contrast, and handoff; they are NEVER factual sources for the current stage.
- CURRENT-PANEL PRIORITY: the current stage's own STAGE EVIDENCE and APPROVED PRODUCTION STAGE CONTEXT always win. Narrate the action, place, consequence, or story beat visible/assigned NOW; do not describe a neighbor merely because it is more dramatic.
- NO EARLY REVEAL: do not state the next panel's primary fact, impact, casualty, rescue, or historical payoff before its assigned stage.
- NO BACKWARD ECHO: do not restate the previous panel's primary fact unless a few neutral connective words are needed for grammar; the new sentence must immediately advance to the current panel's distinct evidence.
- VISUAL HANDOFF: when production context establishes a supported visual transition between adjacent panels, phrase the current line so it enters from the previous beat and exits cleanly toward the next without inventing motion, timing, reactions, or causality.
- NEIGHBOR CONFLICT RULE: if a neighbor's production context conflicts with the current stage evidence, ignore the conflicting neighbor detail and stay inside the current stage evidence boundary.
- HARD NO-REUSE RULE: assign each important fact or idea to one stage. Once used as a stage's main point, do not restate or paraphrase it as the main point of an adjacent stage.
- CROSS-PANEL EVIDENCE UNIQUENESS V3: apply the no-reuse rule across the ENTIRE requested HOOK/P1-P14 story, not only adjacent panels. Before drafting, build a silent ledger of core evidence ideas already assigned: date/identity, location, trigger/cause, warning or precursor, hazard sequence, scale/run-up, geographic impact, physical damage, human toll, response/aftermath, historical payoff. A later stage may share a field with an earlier stage, but it must use a genuinely distinct supported fact from that stageEvidence or omit the duplicate detail. Never paraphrase the same withdrawal, wave count, height/run-up, damage statement, casualty total, or location-impact claim merely to fill another panel.
- DUPLICATE-EVIDENCE COLLISION RULE: when the supplied storyMap gives multiple stages overlapping evidence, do NOT treat that as permission to repeat it. Give the strongest or earliest narratively appropriate stage ownership of that fact. In later overlapping stages, use another unused claim explicitly available in that stage; if none exists, write the shortest non-repetitive line strictly supported by that stage and its production context. Never borrow facts from another stage.
- HOOK RESERVATION RULE: a dramatic fact used in HOOK may be briefly referenced later only when necessary for chronology, but the later panel must advance with new stage-specific evidence rather than replaying the hook.
- FULL-STORY DUPLICATION AUDIT: after drafting all requested stages, compare every line against every other line by meaning, not wording. Rewrite or remove repeated main ideas while preserving stageEvidence boundaries. Distinct wording for the same fact still counts as repetition.
- REPETITION KILLER: adjacent lines should not begin with the same subject pattern or rely on the same main verb when a natural alternative is possible without changing factual meaning.
- CAUSE/EFFECT BRIDGE: when two adjacent stage-evidence sets explicitly support a causal sequence, connect them naturally. Never infer a causal link that the evidence does not establish.
- IMPACT MOMENT: use the strongest active, concrete wording at the verified peak-impact stage; do not spend the strongest language on setup panels.
- AFTERMATH MOMENTUM: after peak impact, keep the story moving through distinct verified consequences, rescue, survival, recovery, or legacy instead of repeatedly describing destruction.
- P14 is the historical payoff: use a verified consequence, significance, change, or legacy when available. Do not merely repeat the event identity, casualty count, or earlier damage unless the exact stage evidence leaves no stronger supported close.
- Final continuity audit: compare every adjacent pair. If two lines could be summarized by the same factual sentence or feel interchangeable, rewrite the later one using its own stage evidence.
- FULL-STORY FINAL POLISH V2.3: after drafting all requested stages, silently read the complete narration once from the first spoken stage through P14 as one documentary story before returning JSON.
- STORY ARC AUDIT: confirm the full sequence has clear forward movement from setup/build-up through trigger/impact and then distinct aftermath/response/recovery/payoff where supported. Do not manufacture a missing phase merely to complete the arc.
- TRANSITION AUDIT: inspect every adjacent pair for abrupt topic resets, encyclopedia-style restarts, duplicated setup, or weak handoffs. Rewrite only with facts already assigned to the affected stage.
- ESCALATION AUDIT: reserve the strongest active language for the verified trigger/peak-impact area. Earlier setup must not sound more catastrophic than the supported impact, and later recovery must not falsely re-escalate the event.
- RHYTHM AUDIT: vary sentence openings and sentence shape naturally across the full story while preserving evidence. Avoid a mechanical sequence of repeated "The...", "As...", "When...", or place-name openings.
- AFTERMATH AUDIT: after peak impact, each line must add a distinct supported consequence, rescue, survival/relief, recovery, or legacy beat rather than repeatedly describing destruction.
- ENDING PAYOFF AUDIT: P14 should feel like a factual historical close using its own verified evidence. Do not turn it into a CTA; the separate ENDING_CTA remains outside P1-P14.
- MINIMAL-REWRITE RULE: if a line already passes evidence, panel match, continuity, timing, and rhythm checks, keep it. Polish only lines that materially improve the complete story.
- FINAL SAFETY PASS: story polish may improve ordering, wording, handoff, and rhythm, but must never introduce a fact absent from that stage's evidence, borrow a neighbor fact, or weaken any explicit uncertainty/safety restriction.
- If a stage has sparse evidence, prefer one short, strong, natural sentence. Never borrow a fact from another stage to make the line fuller.

FINAL VIDEO-FLOW NARRATION QUALITY LOCK — LIVING DISASTER BOOK:
- Treat narration as part of the edit, not as a generic summary. Every stage must sound written for that exact panel and its assigned place in the story.
- Each panel gets ONE clear narrative job and ONE concrete forward-moving sentence whenever the evidence allows it.
- Prefer specific nouns, active verbs, verified names, dates, locations, physical actions and consequences over vague phrases.
- Never use filler such as "the story continues", "the disaster develops", "effects spread across the affected area", "conditions worsen", or generic "lessons were learned" language merely to fill time.
- The narration must progress like a documentary: setup -> verified buildup/trigger -> escalation -> peak impact -> immediate aftermath -> rescue/human consequence -> recovery -> historically supported legacy.
- Match the assigned visual/story beat. Do not narrate the next panel early and do not describe a previous panel again.
- Keep lines compact and weighty: usually about 14-26 spoken words for a 10-second panel, but factual clarity outranks hitting a word count.
- If verified evidence is sparse, use a shorter strong sentence rather than padding with generic disaster language.
- P14 must close with a verified historical consequence, identity, change, or legacy when evidence supports one; never default to a generic preparedness slogan.
- Repetition audit: adjacent panels must differ in subject, verb, information, and dramatic purpose.
- STORY SELECTION LOCK: prefer direct event developments, physical consequences, human impact, rescue/evacuation/displacement, and immediate aftermath over source/archive metadata or retrospective institutional material.
- Do not spend multiple panels on the event's ranking, archive inclusion, commemorations, later studies, legal-document archives, monitoring programmes, or generic hazard-management significance. Use at most one such legacy beat, preferably P14, and only when supported and no stronger event-specific consequence is available.
- GLOBAL DUPLICATION LOCK: before returning JSON, compare ALL requested lines, not only adjacent panels. Date/location/event identity should normally appear once; a casualty/ranking/legacy idea should normally appear once. If two lines communicate substantially the same fact, keep the stronger placement and rewrite the other from its own stage evidence.
- LATE-STORY LOCK: P10-P13 should stay close to people and direct consequences whenever evidence permits: survivors, evacuation, rescue, displacement, recovery, continuing hazard, health/environmental effects, or concrete damage. Do not drift into encyclopedia-summary mode merely because retrospective sources are available.
- SOURCE-INVISIBILITY LOCK: authoritative organizations, archives, atlases, records, reviews, studies, and planning documents validate facts backstage; they are not themselves the story unless their role is historically essential to the event.
- V3.1 REALLOCATION LOCK: if STORY QUALITY WARNINGS identify secondary/legacy-heavy stages, do not repeat their metadata framing. Translate only the direct event fact contained in that stage evidence when one exists. If the stage evidence contains only secondary metadata, keep it extremely brief rather than expanding it into archive/source discussion.
- HARD LEGACY OUTPUT QUOTA: across HOOK through P14, no more than ONE spoken line may primarily discuss ranking, archives, atlases, databases, documentary review, record-keeping, later studies, or comparative historical status. Prefer that single line at P14.
- Read every line aloud mentally before returning it. It must sound natural, cinematic, and solid at normal documentary pace.

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

FINAL APPROVED PANEL ALIGNMENT LOCK:
- APPROVED PRODUCTION STAGE CONTEXT is the current NER Studio scene/prompt context for each requested stage.
- Use it only to keep narration synchronized with the exact visual beat already built for that same stage.
- Do not jump ahead, repeat the previous panel, or narrate a different action/location when the approved stage context establishes the current beat.
- This production context is NOT a factual source. Event-specific claims still require that exact stage's STAGE EVIDENCE.
- If the visual context contains unsupported specificity, stay visually compatible but state only facts allowed by STAGE EVIDENCE.

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
          {role:"user",content:[{type:"input_text",text:`Topic: ${topic}\nFormat: ${format}\nRequired stages: ${stageNames.join(", ")}\n${requestedStage?"Generate ONLY the requested narration stage. It must fit this exact stage and must not summarize later panels.":"Generate the complete narration set."}\n\nAPPROVED PRODUCTION STAGE CONTEXT (alignment only; not a factual source):\n${JSON.stringify(productionStages)}\n\nRESEARCH EVIDENCE (authoritative-source gate):\n${JSON.stringify({...evidenceForNarration,stageEvidence:Object.fromEntries(stageNames.map(s=>[s,stageEvidence[s]||[]]))})}\nUse this evidence as the factual boundary. If exactNumbersAllowed is false, do not state exact numerical claims from uncertain fields.`}]}
        ],
        max_output_tokens: 8000
      })
    });
    const responseText = await response.text();
    let data;
    try { data = responseText ? JSON.parse(responseText) : {}; }
    catch {
      return res.status(502).json({
        ok:false,
        error:"OpenAI narration service returned a non-JSON response. Please retry.",
        upstreamStatus:response.status,
        outputPreview:responseText.slice(0,300),
        apiUsage:usagePayload()
      });
    }
    apiUsageParts.push(usageFromResponse(data,"gpt-5-mini"));
    if (!response.ok) return res.status(response.status).json({ok:false,error:data?.error?.message || "OpenAI request failed.",apiUsage:usagePayload()});
    const raw = data.output_text || (data.output || []).flatMap(x=>x.content||[]).map(x=>x.text||"").join("").trim();
    let parsed;
    try { parsed = JSON.parse(raw.replace(/^\`\`\`json\s*/i,"").replace(/\`\`\`$/,"").trim()); }
    catch { return res.status(502).json({ok:false,error:"AI returned an unexpected format. Please try again.",outputPreview:raw.slice(0,700),outputLength:raw.length,responseStatus:data.status||null,incompleteReason:data.incomplete_details?.reason||null,apiUsage:usagePayload()}); }
    if (parsed?.error === "INSUFFICIENT_EVIDENCE") {
      return res.status(422).json({
        ok:false,
        error:"Research verified the event identity, but the evidence pack is too sparse for evidence-locked HOOK + panels.",
        missingEvidence:Array.isArray(parsed.missing)?parsed.missing:[],
        researchStatus:research.validation.status,
        apiUsage:usagePayload()
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
          {role:"user",content:[{type:"input_text",text:`STAGE EVIDENCE:\n${JSON.stringify(Object.fromEntries(stageNames.map(s=>[s,stageEvidence[s]||[]])))}\n\nNARRATION:\n${JSON.stringify(stages)}`}]}
        ],
        max_output_tokens:4000
      })
    });
    const validatorData = await validatorResponse.json();
    apiUsageParts.push(usageFromResponse(validatorData,"gpt-5-mini"));
    if (!validatorResponse.ok) {
      return res.status(502).json({ok:false,error:validatorData?.error?.message || "Evidence validator request failed.",apiUsage:usagePayload()});
    }
    const validatorRaw = validatorData.output_text || (validatorData.output || []).flatMap(x=>x.content||[]).map(x=>x.text||"").join("").trim();
    let audit;
    try { audit=JSON.parse(validatorRaw.replace(/^\`\`\`json\s*/i,"").replace(/\`\`\`$/,"").trim()); }
    catch { return res.status(502).json({ok:false,error:"Evidence validator returned an unexpected format.",apiUsage:usagePayload()}); }
    if (audit?.valid !== true || (Array.isArray(audit?.unsupported) && audit.unsupported.length)) {
      const unsupported=Array.isArray(audit?.unsupported)?audit.unsupported:[];
      const repairStages=[...new Set(unsupported.map(x=>x.stage).filter(s=>stageNames.includes(s)))];
      if (!repairStages.length) {
        return res.status(422).json({ok:false,error:"Narration rejected by claim-level evidence validator.",unsupportedClaims:unsupported,researchStatus:research.validation.status,apiUsage:usagePayload()});
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
      if(!repairResponse.ok) return res.status(502).json({ok:false,error:repairData?.error?.message||"Narration auto-repair failed.",apiUsage:usagePayload()});
      const repairRaw=repairData.output_text||(repairData.output||[]).flatMap(x=>x.content||[]).map(x=>x.text||"").join("").trim();
      let repaired;
      try{
        repaired=JSON.parse(repairRaw.replace(/^```json\s*/i,"").replace(/```$/,"").trim());
        if(repaired?.stages && typeof repaired.stages==="object") repaired=repaired.stages;
      }catch{
        return res.status(502).json({ok:false,error:"Narration auto-repair returned an unexpected format.",repairPreview:repairRaw.slice(0,700),repairLength:repairRaw.length,repairStatus:repairData.status||null,repairIncompleteReason:repairData.incomplete_details?.reason||null,apiUsage:usagePayload()});
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
      if(!recheckResponse.ok) return res.status(502).json({ok:false,error:recheckData?.error?.message||"Narration repair validation failed.",apiUsage:usagePayload()});
      const recheckRaw=recheckData.output_text||(recheckData.output||[]).flatMap(x=>x.content||[]).map(x=>x.text||"").join("").trim();
      let recheck;
      try{recheck=JSON.parse(recheckRaw.replace(/^\`\`\`json\s*/i,"").replace(/\`\`\`$/,"").trim());}
      catch{return res.status(502).json({ok:false,error:"Narration repair validator returned an unexpected format.",apiUsage:usagePayload()});}
      if(recheck?.valid!==true||(Array.isArray(recheck?.unsupported)&&recheck.unsupported.length)){
        return res.status(422).json({
          ok:false,
          error:"Narration auto-repair was still not fully supported by evidence.",
          unsupportedClaims:Array.isArray(recheck?.unsupported)?recheck.unsupported:[],
          researchStatus:research.validation.status,
          apiUsage:usagePayload()
        });
      }
    }

    // V3.2 FINAL STORY AUDIT — cheap local whole-script inspection.
    // No web research and no extra model call: detect metadata-heavy or globally
    // repetitive output after factual validation, then rewrite only flagged
    // stages from their own verified evidence using deterministic phrasing.
    const legacySpeechRe=/\b(authoritative|meteorological authorities|records? (?:list|show|record|use)|archives?|atlases?|databases?|compilations?|expert review|archival|professional literature|historical inventories|benchmark|world[- ]weather extremes|deadliest .*record|highest .*mortality)\b/i;
    const normStory=s=>String(s||"").toLowerCase().replace(/\b(19\d{2}|20\d{2})\b/g," ").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
    const storyTokens=s=>new Set(normStory(s).split(" ").filter(x=>x.length>5));
    const storySimilar=(a,b)=>{
      const A=storyTokens(a),B=storyTokens(b); if(A.size<3||B.size<3)return false;
      let n=0; for(const x of A)if(B.has(x))n++;
      return n/Math.min(A.size,B.size)>=0.65;
    };
    const flagged=new Set();
    const ordered=stageNames.filter(s=>typeof stages[s]==="string");
    const legacySpoken=ordered.filter(s=>legacySpeechRe.test(stages[s]));
    if(legacySpoken.length>1){
      const keep=legacySpoken.includes("P14")?"P14":legacySpoken[legacySpoken.length-1];
      for(const s of legacySpoken)if(s!==keep)flagged.add(s);
    }
    for(let i=0;i<ordered.length;i++)for(let j=i+1;j<ordered.length;j++){
      if(storySimilar(stages[ordered[i]],stages[ordered[j]]))flagged.add(ordered[j]);
    }
    const directFromEvidence=(stage)=>{
      const items=stageEvidence?.[stage]||[];
      if(!items.length)return "";
      const raw=String(items[0]?.claim??items[0]?.value??"").trim();
      if(!raw)return "";
      return raw
        .replace(/^(authoritative|official|historical|international|meteorological)\s+(records?|accounts?|sources?|compilations?)\s+(?:show|list|record|report|note|describe|cite)\s+(?:that\s+)?/i,"")
        .replace(/^(records?|accounts?|sources?|compilations?)\s+(?:show|list|record|report|note|describe|cite)\s+(?:that\s+)?/i,"")
        .replace(/^according to [^,]+,\s*/i,"")
        .replace(/^./,m=>m.toUpperCase());
    };
    for(const stage of flagged){
      const replacement=directFromEvidence(stage);
      if(replacement)stages[stage]=replacement;
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
        researchStatus:research.validation.status,
        apiUsage:usagePayload()
      });
    }

    for (const name of stageNames) {
      if (typeof stages[name] !== "string" || !stages[name].trim()) return res.status(502).json({ok:false,error:`AI response is missing ${name}. Please try again.`,apiUsage:usagePayload()});
      stages[name] = polishNarrationQuality(name, sanitizeNarrationLine(name, stages[name], stageEvidence), stageEvidence);
    }
    return res.status(200).json({ok:true,topic,format,requestedStage:requestedStage||null,researchStatus:research.validation.status,stages,apiUsage:usagePayload()});
  } catch (err) {
    return res.status(500).json({ok:false,error:"AI narration error: "+String(err?.message||err),apiUsage:usagePayload()});
  }
}

