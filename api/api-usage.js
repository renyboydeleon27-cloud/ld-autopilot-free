// LD AUTO API usage helper — pricing snapshot 2026-09-25.
// Costs are estimates from token usage returned by the OpenAI Responses API.
// Keep rates centralized so the UI never guesses from character counts.

export const OPENAI_PRICE_SNAPSHOT="2026-09-25";

export const OPENAI_TEXT_RATES={
  "gpt-5.6-luna":{input:0.20,cachedInput:0.02,output:1.20},
  "gpt-5-mini":{input:0.25,cachedInput:0.025,output:2.00}
};

function n(value){
  const x=Number(value);
  return Number.isFinite(x)&&x>0?x:0;
}

function roundMoney(value){
  return Math.round((Number(value)||0)*1e8)/1e8;
}

export function usageFromResponse(data,model){
  const usage=data?.usage||{};
  const inputTokens=n(usage.input_tokens);
  const cachedInputTokens=Math.min(inputTokens,n(usage.input_tokens_details?.cached_tokens));
  const outputTokens=n(usage.output_tokens);
  const totalTokens=n(usage.total_tokens)||(inputTokens+outputTokens);
  const rates=OPENAI_TEXT_RATES[model]||null;
  const estimatedCostUsd=rates
    ? ((inputTokens-cachedInputTokens)*rates.input+cachedInputTokens*rates.cachedInput+outputTokens*rates.output)/1_000_000
    : 0;
  return {
    priceSnapshot:OPENAI_PRICE_SNAPSHOT,
    currency:"USD",
    calls:1,
    inputTokens,
    cachedInputTokens,
    outputTokens,
    totalTokens,
    estimatedCostUsd:roundMoney(estimatedCostUsd),
    byModel:{
      [model]:{
        calls:1,
        inputTokens,
        cachedInputTokens,
        outputTokens,
        totalTokens,
        estimatedCostUsd:roundMoney(estimatedCostUsd)
      }
    }
  };
}

export function mergeApiUsage(...items){
  const valid=items.flat().filter(Boolean);
  const out={
    priceSnapshot:OPENAI_PRICE_SNAPSHOT,
    currency:"USD",
    calls:0,
    inputTokens:0,
    cachedInputTokens:0,
    outputTokens:0,
    totalTokens:0,
    estimatedCostUsd:0,
    byModel:{}
  };
  for(const item of valid){
    out.calls+=n(item.calls);
    out.inputTokens+=n(item.inputTokens);
    out.cachedInputTokens+=n(item.cachedInputTokens);
    out.outputTokens+=n(item.outputTokens);
    out.totalTokens+=n(item.totalTokens);
    out.estimatedCostUsd+=Number(item.estimatedCostUsd)||0;
    for(const [model,u] of Object.entries(item.byModel||{})){
      const m=out.byModel[model]||(out.byModel[model]={calls:0,inputTokens:0,cachedInputTokens:0,outputTokens:0,totalTokens:0,estimatedCostUsd:0});
      m.calls+=n(u.calls);
      m.inputTokens+=n(u.inputTokens);
      m.cachedInputTokens+=n(u.cachedInputTokens);
      m.outputTokens+=n(u.outputTokens);
      m.totalTokens+=n(u.totalTokens);
      m.estimatedCostUsd+=Number(u.estimatedCostUsd)||0;
      m.estimatedCostUsd=roundMoney(m.estimatedCostUsd);
    }
  }
  out.estimatedCostUsd=roundMoney(out.estimatedCostUsd);
  return out;
}
