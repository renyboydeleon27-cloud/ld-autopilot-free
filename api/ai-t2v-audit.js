function outputText(data){
  if(data?.output_text) return String(data.output_text).trim();
  return (data?.output||[]).flatMap(x=>x?.content||[]).map(x=>x?.text||"").join("").trim();
}
function parseJsonObject(text){
  const clean=String(text||"").trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"").trim();
  try{return JSON.parse(clean);}catch{}
  const start=clean.indexOf("{"),end=clean.lastIndexOf("}");
  if(start>=0&&end>start){try{return JSON.parse(clean.slice(start,end+1));}catch{}}
  return null;
}
function specialProgressionRule(topic,stage){
  const rocky=/rocky mountain locust/i.test(topic)&&/\b1874\b/.test(topic);
  if(!rocky) return "";
  if(stage==="P1") return "ROCKY MOUNTAIN LOCUST 1874 P1 LOCK: ZERO visible locusts or swarming insects for the entire panel. No insects in air, on crops, on soil, near camera, or in the distance. Crops healthy; sky normal; calm farm life only.";
  if(stage==="P2") return "ROCKY MOUNTAIN LOCUST 1874 P2 LOCK: first abnormal locust buildup is visible on ground and vegetation with limited hopping/short flight. Sky remains largely clear; crops remain mostly intact. No full plague, blackened sky, smoke-like swarm, or total destruction.";
  if(stage==="P3") return "ROCKY MOUNTAIN LOCUST 1874 P3 LOCK: clearly larger gathering; adults notice and show concern. More insects may rise in loose clusters, but still no full sky-darkening plague, no total crop stripping, and no smoke/cloud-like swarm.";
  return "";
}
export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS") return res.status(204).end();
  if(req.method!=="POST") return res.status(405).json({ok:false,error:"POST only"});

  const topic=String(req.body?.topic||"").trim().slice(0,240);
  const stage=String(req.body?.stage||"").trim().toUpperCase();
  const format=req.body?.format==="longform"?"longform":"shorts";
  const visualMode=req.body?.visualMode==="real"?"real":"anime";
  const year=String(req.body?.year||"").trim().slice(0,20);
  const location=String(req.body?.location||"").trim().slice(0,240);
  const sharedDetails=String(req.body?.sharedDetails||"").trim().slice(0,2200);
  const narration=String(req.body?.narration||"").trim().slice(0,2600);
  const currentScene=String(req.body?.currentScene||"").trim().slice(0,6000);
  const currentPrompt=String(req.body?.currentPrompt||"").trim().slice(0,16000);

  if(!topic) return res.status(400).json({ok:false,error:"Missing disaster topic."});
  if(!/^P(?:[1-9]|1[0-4])$/.test(stage)) return res.status(400).json({ok:false,error:"Open a valid P1–P14 panel first."});
  if(!currentPrompt) return res.status(400).json({ok:false,error:"Build the Text-to-Video prompt before auditing."});
  const apiKey=String(process.env.OPENAI_API_KEY||"").trim();
  if(!apiKey) return res.status(500).json({ok:false,error:"OPENAI_API_KEY is not configured on the server."});

  const special=specialProgressionRule(topic,stage);
  const system=[
    "You are the Living Disaster Book Text-to-Video Prompt Auditor.",
    "Audit ONE current P1–P14 prompt. Do NOT rewrite, repair, polish, or replace the prompt.",
    "Return PASS only when there is no meaningful prompt problem likely to harm historical continuity, stage progression, visual mode, timing, camera logic, physical plausibility, or negative-lock compliance.",
    "Check structure: a usable scene, 10-second timing/action plan, camera guidance, physics/time continuity, visual continuity/DNA, and negative constraints. Do not fail merely because section labels use different wording if the required information is present.",
    "Check topic/year/location continuity and flag anachronistic or modern objects only when the prompt itself introduces them or fails an explicit supplied era lock.",
    "Check story-stage progression. Do not allow an early panel to jump to impact, destruction, recovery, or a later hazard state unless its supplied narration/current scene supports that stage.",
    "Check camera instructions for contradictions such as simultaneous push-in and pull-back, cuts despite a one-shot lock, impossible travel through objects, or conflicting focal behavior.",
    "Check physics/time instructions for instant materialization, magical multiplication, impossible scale changes, contradictory object states, or destruction that happens without a supported cause.",
    "For insect/locust topics: normal-sized separate insects, layered depth, plausible movement. A dense swarm must NOT be described as or encouraged to resemble black smoke, soot, dust, fog, haze, ash, vapor, storm cloud, shadow cloud, or a solid dark mass.",
    "Do not invent historical facts to create an issue. Audit only against the supplied production context and clear internal contradictions.",
    special,
    "Output JSON only with exactly these fields: result, summary, issues, recommendedAction.",
    "result must be exactly PASS or NEEDS FIX. summary and recommendedAction must be short strings. issues must be an array of concise strings. If PASS, issues must be an empty array and recommendedAction should say the prompt can be sent to Flow after the creator's normal visual review."
  ].filter(Boolean).join("\n");

  const user=[
    "TOPIC: "+topic,
    "STAGE: "+stage,
    "FORMAT: "+format,
    "VISUAL MODE: "+visualMode,
    "EVENT YEAR: "+(year||"not supplied"),
    "MAIN LOCATION: "+(location||"not supplied"),
    "SHARED VISUAL / CONTINUITY DETAILS: "+(sharedDetails||"none"),
    "NARRATION CONTEXT: "+(narration||"none"),
    "CURRENT PANEL SCENE: "+(currentScene||"none"),
    "FULL TEXT-TO-VIDEO PROMPT TO AUDIT:\n"+currentPrompt
  ].join("\n\n");

  try{
    const response=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{
        "Authorization":`Bearer ${apiKey}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        model:"gpt-5.6-luna",
        input:[
          {role:"system",content:[{type:"input_text",text:system}]},
          {role:"user",content:[{type:"input_text",text:user}]}
        ],
        text:{
          format:{
            type:"json_schema",
            name:"ld_t2v_audit",
            strict:true,
            schema:{
              type:"object",
              properties:{
                result:{type:"string",enum:["PASS","NEEDS FIX"]},
                summary:{type:"string"},
                issues:{type:"array",items:{type:"string"}},
                recommendedAction:{type:"string"}
              },
              required:["result","summary","issues","recommendedAction"],
              additionalProperties:false
            }
          }
        },
        max_output_tokens:700
      })
    });
    const data=await response.json();
    if(!response.ok) return res.status(response.status).json({ok:false,error:data?.error?.message||"OpenAI request failed."});
    const rawOutput=outputText(data);
    const parsed=parseJsonObject(rawOutput);
    if(!parsed) return res.status(502).json({
      ok:false,
      error:"AI audit structured output could not be parsed.",
      detail:rawOutput.slice(0,220)
    });

    const result=String(parsed.result||"").trim().toUpperCase()==="PASS"?"PASS":"NEEDS FIX";
    const issues=Array.isArray(parsed.issues)?parsed.issues.map(x=>String(x||"").trim()).filter(Boolean).slice(0,10):[];
    const summary=String(parsed.summary||"").trim().slice(0,700);
    const recommendedAction=String(parsed.recommendedAction||"").trim().slice(0,700);
    return res.status(200).json({
      ok:true,
      topic,
      stage,
      result,
      summary:summary||(result==="PASS"?"Prompt passed the AI T2V audit.":"Prompt needs revision before generation."),
      issues:result==="PASS"?[]:issues,
      recommendedAction:recommendedAction||(result==="PASS"?"Send this prompt to Flow after your normal visual review.":"Use Fix Current Panel, rebuild the T2V prompt, then audit again.")
    });
  }catch(err){
    return res.status(500).json({ok:false,error:"AI T2V audit backend error: "+String(err?.message||err)});
  }
}
