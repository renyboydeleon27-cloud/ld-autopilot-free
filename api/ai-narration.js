import { buildResearch } from "./ai-research.js";

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

  const evidenceForNarration = {
    validation: research.validation,
    exactNumbersAllowed: research.narrationGate.exactNumbersAllowed,
    verifiedClaims: research.verifiedClaims || [],
    factPack: research.factPack,
    sources: research.sources.map(s=>({authority:s.authority,name:s.name,url:s.url}))
  };

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
- Every event-specific factual claim must be explicitly entailed by an item in verifiedClaims. If it is absent from verifiedClaims, do not state it.
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
- HOOK: immediate fact-safe curiosity/tension; do not explain the whole event.
- P1: normal world, geography, exposed communities, and location context.
- P2: relevant tectonic/geologic setup only; do not narrate tsunami travel or impact yet.
- P3: the triggering earthquake/event itself.
- P4: historically established unusual warning conditions or the gap between trigger and disaster; if none are verified, use the next distinct causal step without inventing one.
- P5: tsunami generation / water displacement mechanism specific to this event.
- P6: waves travel/approach the coast.
- P7: first major coastal impact.
- P8: inundation/destruction expands through affected communities.
- P9: peak human-scale consequences, non-graphic.
- P10: wider geographic impact or additional documented wave effects.
- P11: immediate aftermath and survival/rescue conditions.
- P12: verified scale of loss/damage; use exact figures only when sufficiently reliable, otherwise use cautious qualitative wording.
- P13: response, recovery, scientific lesson, or documented historical consequence.
- P14: concise closing historical significance that does not repeat casualty/damage language.
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
    if (!response.ok) return res.status(response.status).json({ok:false,error:data?.error?.message || "OpenAI request failed."});
    const raw = data.output_text || (data.output || []).flatMap(x=>x.content||[]).map(x=>x.text||"").join("").trim();
    let parsed;
    try { parsed = JSON.parse(raw.replace(/^\`\`\`json\s*/i,"").replace(/\`\`\`$/,"").trim()); }
    catch { return res.status(502).json({ok:false,error:"AI returned an unexpected format. Please try again."}); }
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
          {role:"system",content:[{type:"input_text",text:`You are a strict evidence auditor. Compare narration claims ONLY against the supplied VERIFIED CLAIMS allow-list. Do not use outside knowledge. Event identity being VERIFIED does not verify other details. Split each stage into event-specific factual claims. A claim is supported only if VERIFIED CLAIMS explicitly entail it; paraphrases are allowed, inference and typical disaster behavior are not. Generic connective/cinematic wording is allowed only when it adds no new factual assertion. Return JSON exactly: {"valid":true,"unsupported":[]} or {"valid":false,"unsupported":[{"stage":"HOOK","claim":"...","reason":"..."}]}.`}]},
          {role:"user",content:[{type:"input_text",text:`VERIFIED CLAIMS:\n${JSON.stringify(research.verifiedClaims||[])}\n\nNARRATION:\n${JSON.stringify(stages)}`}]}
        ],
        max_output_tokens:4000
      })
    });
    const validatorData = await validatorResponse.json();
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
            {role:"system",content:[{type:"input_text",text:"Rewrite ONLY the requested rejected narration stages. Use ONLY facts explicitly entailed by the supplied fact pack. Remove unsupported ranking, comparison, sensory, witness, warning, or causal claims. Do not use outside knowledge. Keep each line natural, cinematic, concise, and about 8-10 seconds. Return only the requested stage keys."}]},
            {role:"user",content:[{type:"input_text",text:`VERIFIED CLAIMS:\n${JSON.stringify(research.verifiedClaims||[])}\n\nREJECTED CLAIMS:\n${JSON.stringify(unsupported)}\n\nCURRENT REJECTED STAGES:\n${JSON.stringify(Object.fromEntries(repairStages.map(s=>[s,stages[s]])))}`}]}
          ],
          max_output_tokens:2000
        })
      });
      const repairData=await repairResponse.json();
      if(!repairResponse.ok) return res.status(502).json({ok:false,error:repairData?.error?.message||"Narration auto-repair failed."});
      const repairRaw=repairData.output_text||(repairData.output||[]).flatMap(x=>x.content||[]).map(x=>x.text||"").join("").trim();
      let repaired;
      try{repaired=JSON.parse(repairRaw.replace(/^\`\`\`json\s*/i,"").replace(/\`\`\`$/,"").trim());}
      catch{return res.status(502).json({ok:false,error:"Narration auto-repair returned an unexpected format."});}
      for(const s of repairStages) if(typeof repaired?.[s]==="string"&&repaired[s].trim()) stages[s]=repaired[s].trim();

      // Revalidate repaired stages semantically against the same evidence boundary.
      const recheckResponse=await fetch("https://api.openai.com/v1/responses",{
        method:"POST",
        headers:{"Authorization":`Bearer ${apiKey}`,"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"gpt-5-mini",
          text:{format:{type:"json_schema",name:"repair_audit",strict:true,schema:{type:"object",properties:{valid:{type:"boolean"},unsupported:{type:"array",items:{type:"object",properties:{stage:{type:"string"},claim:{type:"string"},reason:{type:"string"}},required:["stage","claim","reason"],additionalProperties:false}}},required:["valid","unsupported"],additionalProperties:false}}},
          input:[
            {role:"system",content:[{type:"input_text",text:"Strictly audit the repaired narration ONLY against the supplied fact pack. Do not use outside knowledge. A claim is supported only if explicitly entailed. Return valid=true only if every event-specific claim is supported."}]},
            {role:"user",content:[{type:"input_text",text:`VERIFIED CLAIMS:\n${JSON.stringify(research.verifiedClaims||[])}\n\nREPAIRED STAGES:\n${JSON.stringify(Object.fromEntries(repairStages.map(s=>[s,stages[s]])))}`}]}
          ],
          max_output_tokens:1500
        })
      });
      const recheckData=await recheckResponse.json();
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
    const evidenceText = JSON.stringify(fp).toLowerCase();
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
        supported:()=>Array.isArray(fp.aftermath) && fp.aftermath.length>0
      }
    ];
    for (const [stage,text] of Object.entries(stages)) {
      if (typeof text !== "string") continue;
      for (const rule of claimRules) {
        if (rule.re.test(text) && !rule.supported()) unsupportedClaims.push({stage,claimClass:rule.id,text});
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
      stages[name] = stages[name].trim();
    }
    return res.status(200).json({ok:true,topic,format,researchStatus:research.validation.status,stages});
  } catch (err) {
    return res.status(500).json({ok:false,error:"AI narration error: "+String(err?.message||err)});
  }
}
