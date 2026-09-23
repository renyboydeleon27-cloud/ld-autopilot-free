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

  const stageNames = format === "shorts"
    ? ["HOOK", ...Array.from({length:14},(_,i)=>"P"+(i+1))]
    : ["HOOK", ...Array.from({length:30},(_,i)=>"S"+(i+1))];

  const system = `You are the Living Disaster Book narration engine.
Write natural, human-sounding historical-documentary English for a general audience.
Preserve verified facts, dates, places, causes and consequences. Explain technical science clearly and cinematically.
Never invent precise facts, measurements, casualty figures, quotations, or certainty. If a detail is uncertain, omit it or phrase it cautiously.
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
        input:[
          {role:"system",content:[{type:"input_text",text:system}]},
          {role:"user",content:[{type:"input_text",text:`Topic: ${topic}\nFormat: ${format}\nRequired stages: ${stageNames.join(", ")}\nGenerate the complete narration set.`}]}
        ],
        max_output_tokens:2400
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
