import { usageFromResponse, mergeApiUsage } from "./api-usage.js";

function textFromResponse(data){
  if(data?.output_text) return String(data.output_text).trim();
  const parts=[];
  for(const item of data?.output||[]){
    for(const content of item?.content||[]){
      if(typeof content?.text==='string'&&content.text.trim()) parts.push(content.text);
      else if(typeof content?.output_text==='string'&&content.output_text.trim()) parts.push(content.output_text);
      else if(typeof content?.refusal==='string'&&content.refusal.trim()) parts.push(content.refusal);
    }
  }
  return parts.join('').trim();
}
function responseProblem(data){
  if(data?.status==='failed')return data?.error?.message||'AI panel-fix response failed.';
  if(data?.status==='incomplete')return data?.incomplete_details?.reason||'AI panel-fix response was incomplete.';
  return '';
}
function parseJsonObject(text){
  const clean=String(text||'').trim().replace(/^\`\`\`(?:json)?\s*/i,'').replace(/\s*\`\`\`$/,'').trim();
  try{return JSON.parse(clean);}catch{}
  const start=clean.indexOf('{'), end=clean.lastIndexOf('}');
  if(start>=0&&end>start){try{return JSON.parse(clean.slice(start,end+1));}catch{}}
  return null;
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
  const year=String(req.body?.year||"").trim().slice(0,4);
  const location=String(req.body?.location||"").trim().slice(0,220);
  const sharedDetails=String(req.body?.sharedDetails||"").trim().slice(0,1800);
  const narration=String(req.body?.narration||"").trim().slice(0,2200);
  const currentScene=String(req.body?.currentScene||"").trim().slice(0,5000);
  const currentPrompt=String(req.body?.currentPrompt||"").trim().slice(0,14000);

  if(!topic) return res.status(400).json({ok:false,error:"Missing disaster topic."});
  if(!/^P(?:[1-9]|1[0-4])$/.test(stage)) return res.status(400).json({ok:false,error:"Open a valid P1–P14 panel first."});
  if(!currentScene) return res.status(400).json({ok:false,error:"Current panel scene is empty."});
  if(!process.env.OPENAI_API_KEY) return res.status(500).json({ok:false,error:"OPENAI_API_KEY is not configured on the server."});

  const topicStageRule=/rocky mountain locust/i.test(topic)&&/\b1874\b/.test(topic)&&stage==="P1"
    ? "SPECIAL CURRENT PRODUCTION RULE: P1 is pure calm-before-disaster. Return ZERO visible locusts or swarming insects anywhere in the frame for the full 10 seconds; no insects in air, on crops, on soil, near camera, or in the distance."
    : "";

  const system=[
    "You are the Living Disaster Book current-panel prompt polisher.",
    "Rewrite ONLY the visual PANEL SCENE for a single 10-second historical disaster video panel.",
    "Preserve the supplied topic, stage, year, location, narration, visual mode, chapter continuity and any explicit locks already present in the current full prompt.",
    "Do not invent precise dates, places, casualties, measurements, causes, named people, technologies, or event facts that are not already supplied.",
    "Do not jump ahead to later story stages. Preserve escalation: calm panels stay calm; buildup panels remain buildup; impact/recovery appears only when the current panel context supports it.",
    "Make the scene concrete and generator-friendly: subject, environment, period objects, focal action, visible hazard state, and what must NOT appear yet.",
    "Adults only unless the existing prompt explicitly requires otherwise. No gore.",
    "For insect/locust topics: insects must be normal-sized and physically separate. Dense airborne swarms must never look like black smoke, soot, dust, fog, haze, ash, storm cloud, shadow cloud, vapor, or a solid dark mass. If the panel is explicitly pre-locust/zero-locust, preserve ZERO visible locusts or swarming insects.",
    "Return JSON only with exactly two string fields: scene and note. scene is the polished panel scene; note is one short sentence explaining the main fix.",
    topicStageRule
  ].filter(Boolean).join("\n");

  const user=[
    "TOPIC: "+topic,
    "STAGE: "+stage,
    "FORMAT: "+format,
    "VISUAL MODE: "+visualMode,
    "EVENT YEAR: "+(year||"not supplied"),
    "MAIN LOCATION: "+(location||"not supplied"),
    "SHARED DETAILS: "+(sharedDetails||"none"),
    "NARRATION CONTEXT: "+(narration||"none"),
    "CURRENT PANEL SCENE:\n"+currentScene,
    "CURRENT FULL TEXT-TO-VIDEO PROMPT / LOCKS:\n"+(currentPrompt||"not built yet"),
    "Polish this stage without changing its historical/story role."
  ].join("\n\n");

  try{
    const response=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{
        "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,
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
            name:"ld_panel_fix",
            strict:true,
            schema:{
              type:"object",
              properties:{
                scene:{type:"string"},
                note:{type:"string"}
              },
              required:["scene","note"],
              additionalProperties:false
            }
          }
        },
        max_output_tokens:520
      })
    });
    const data=await response.json();
    let apiUsage=usageFromResponse(data,"gpt-5.6-luna");
    if(!response.ok){
      return res.status(response.status).json({ok:false,error:data?.error?.message||"OpenAI request failed.",apiUsage});
    }
    const raw=textFromResponse(data);
    let parsed=parseJsonObject(raw);
    let scene=String(parsed?.scene||"").trim();
    let note=String(parsed?.note||"").trim();

    // Rare structured-output edge case: retry once with a smaller plain-text JSON request
    // instead of blocking SMART CONTINUE with an empty scene.
    if(!scene){
      const problem=responseProblem(data);
      const retry=await fetch("https://api.openai.com/v1/responses",{
        method:"POST",
        headers:{
          "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          model:"gpt-5.6-luna",
          input:[
            {role:"system",content:[{type:"input_text",text:system+" Return compact valid JSON with non-empty scene and note strings."}]},
            {role:"user",content:[{type:"input_text",text:user}]}
          ],
          max_output_tokens:700
        })
      });
      const retryData=await retry.json();
      apiUsage=mergeApiUsage(apiUsage,usageFromResponse(retryData,"gpt-5.6-luna"));
      if(retry.ok){
        const retryRaw=textFromResponse(retryData);
        parsed=parseJsonObject(retryRaw);
        scene=String(parsed?.scene||"").trim();
        note=String(parsed?.note||"").trim();
      }
      if(!scene){
        return res.status(502).json({
          ok:false,
          error:"AI panel fix could not return a usable replacement scene. Tap retry once; if it repeats, rebuild this panel prompt.",
          detail:problem||raw.slice(0,220),
          apiUsage
        });
      }
    }
    return res.status(200).json({ok:true,topic,stage,scene,note,apiUsage});
  }catch(err){
    return res.status(500).json({ok:false,error:"AI panel-fix backend error: "+String(err?.message||err)});
  }
}
