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
Write natural, human-sounding historical-documentary English for a general audience.
Preserve verified facts, dates, places, causes and consequences. Explain technical science clearly and cinematically.
FACT SAFETY LOCK:
- Never invent precise facts, dates, month/day, time of day, measurements, casualty figures, quotations, named locations, human activities, warning signs, or certainty.
- A detail appearing in the topic may be treated as supplied by the user. Any additional specific historical detail must be highly reliable from your knowledge; when uncertain, omit it rather than filling a narrative gap.
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
        text:{format:{type:"json_object"}},
        input:[
          {role:"system",content:[{type:"input_text",text:system}]},
          {role:"user",content:[{type:"input_text",text:`Topic: ${topic}\nFormat: ${format}\nRequired stages: ${stageNames.join(", ")}\nGenerate the complete narration set.`}]}
        ],
        max_output_tokens: 5000
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ok:false,error:data?.error?.message || "OpenAI request failed."});
    const raw = data.output_text || (data.output || []).flatMap(x=>x.content||[]).map(x=>x.text||"").join("").trim();
    let parsed;
    try { parsed = JSON.parse(raw.replace(/^\`\`\`json\s*/i,"").replace(/\`\`\`$/,"").trim()); }
    catch { return res.status(502).json({ok:false,error:"AI returned an unexpected format. Please try again."}); }
    const stages = parsed?.stages || {};
    for (const name of stageNames) {
      if (typeof stages[name] !== "string" || !stages[name].trim()) return res.status(502).json({ok:false,error:`AI response is missing ${name}. Please try again.`});
      stages[name] = stages[name].trim();
    }
    return res.status(200).json({ok:true,topic,format,stages});
  } catch (err) {
    return res.status(500).json({ok:false,error:"AI narration error: "+String(err?.message||err)});
  }
}
