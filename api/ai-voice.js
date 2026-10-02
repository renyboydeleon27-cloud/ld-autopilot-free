const MODEL="gpt-4o-mini-tts";
const INPUT_RATE_PER_M=0.60;
const OUTPUT_AUDIO_RATE_PER_M=12.00;
const ALLOWED_VOICES=new Set(["alloy","ash","ballad","coral","echo","fable","onyx","nova","sage","shimmer","verse","marin","cedar"]);

function jsonError(res,status,message){
  return res.status(status).json({ok:false,error:message});
}

function parseSse(text){
  const audio=[];
  let usage=null;
  for(const block of String(text||"").split(/\r?\n\r?\n/)){
    for(const line of block.split(/\r?\n/)){
      if(!line.startsWith("data:"))continue;
      const raw=line.slice(5).trim();
      if(!raw||raw==="[DONE]")continue;
      let event;
      try{event=JSON.parse(raw);}catch{continue;}
      if(event.type==="speech.audio.delta"&&event.audio)audio.push(Buffer.from(event.audio,"base64"));
      if(event.type==="speech.audio.done"&&event.usage)usage=event.usage;
    }
  }
  return {buffer:Buffer.concat(audio),usage};
}

export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  res.setHeader("Access-Control-Expose-Headers","X-LD-Model, X-LD-Voice, X-LD-Input-Tokens, X-LD-Output-Tokens, X-LD-Total-Tokens, X-LD-Calculated-Cost");
  if(req.method==="OPTIONS")return res.status(204).end();
  if(req.method!=="POST")return jsonError(res,405,"POST only");

  const apiKey=String(process.env.OPENAI_API_KEY||"").trim();
  if(!apiKey)return jsonError(res,500,"OPENAI_API_KEY is not configured on the server.");

  const text=String(req.body?.text||"").trim();
  const voice=String(req.body?.voice||"cedar").trim().toLowerCase();
  if(!text)return jsonError(res,400,"Narration text is required.");
  if(text.length>3900)return jsonError(res,400,"Narration is too long for one-click speech. Keep it under about 3,900 characters.");
  if(!ALLOWED_VOICES.has(voice))return jsonError(res,400,"Unsupported narrator voice.");

  try{
    const upstream=await fetch("https://api.openai.com/v1/audio/speech",{
      method:"POST",
      headers:{"Authorization":`Bearer ${apiKey}`,"Content-Type":"application/json"},
      body:JSON.stringify({
        model:MODEL,
        voice,
        input:text,
        instructions:"Serious historical documentary narrator. Cinematic but restrained. Clear, grounded, measured pacing. This is one panel of a timed documentary edit: finish the supplied sentence cleanly, do not add or omit words, and avoid exaggerated trailer shouting.",
        response_format:"mp3",
        stream_format:"sse",
        speed:0.9
      })
    });
    const body=await upstream.text();
    if(!upstream.ok){
      let message="OpenAI speech generation failed.";
      try{message=JSON.parse(body)?.error?.message||message;}catch{}
      return jsonError(res,502,message);
    }
    const parsed=parseSse(body);
    if(!parsed.buffer.length)return jsonError(res,502,"OpenAI speech generation returned no audio.");
    const inputTokens=Number(parsed.usage?.input_tokens)||0;
    const outputTokens=Number(parsed.usage?.output_tokens)||0;
    const totalTokens=Number(parsed.usage?.total_tokens)||(inputTokens+outputTokens);
    const calculatedCost=(inputTokens*INPUT_RATE_PER_M+outputTokens*OUTPUT_AUDIO_RATE_PER_M)/1000000;
    res.setHeader("Content-Type","audio/mpeg");
    res.setHeader("Cache-Control","no-store");
    res.setHeader("X-LD-Model",MODEL);
    res.setHeader("X-LD-Voice",voice);
    res.setHeader("X-LD-Input-Tokens",String(inputTokens));
    res.setHeader("X-LD-Output-Tokens",String(outputTokens));
    res.setHeader("X-LD-Total-Tokens",String(totalTokens));
    res.setHeader("X-LD-Calculated-Cost",calculatedCost.toFixed(8));
    return res.status(200).send(parsed.buffer);
  }catch(err){
    return jsonError(res,500,"AI narrator error: "+String(err?.message||err));
  }
}
