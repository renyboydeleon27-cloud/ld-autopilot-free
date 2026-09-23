export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"POST only" });

  const topic = String(req.body?.topic || "").trim().slice(0, 200);
  if (!topic) return res.status(400).json({ ok:false, error:"Please provide a disaster topic." });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ ok:false, error:"OPENAI_API_KEY is not configured on the server." });

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method:"POST",
      headers:{
        "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        model:"gpt-5-mini",
        input:[
          {role:"system",content:[{type:"input_text",text:"You are the AI assistant for Living Disaster Book. Return one concise, historically grounded cinematic hook idea for the supplied disaster topic. Adults only, no gore. Do not invent precise historical facts when uncertain. Output plain text only."}]},
          {role:"user",content:[{type:"input_text",text:`Disaster topic: ${topic}\nGive one short hook idea suitable for a 10-second historical disaster video.`}]}
        ],
        max_output_tokens:180
      })
    });
    const data = await response.json();
    if (!response.ok) {
      const msg = data?.error?.message || "OpenAI request failed.";
      return res.status(response.status).json({ok:false,error:msg});
    }
    const output = data.output_text || (data.output || []).flatMap(x=>x.content||[]).map(x=>x.text||"").join("").trim();
    return res.status(200).json({ok:true,status:"AI CONNECTED",topic,hook:output||"OpenAI responded successfully."});
  } catch (err) {
    return res.status(500).json({ok:false,error:"AI backend error: "+String(err?.message||err)});
  }
}
