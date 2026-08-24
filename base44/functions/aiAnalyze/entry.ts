import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const ANALYSIS_TYPES = {
  safety: {
    label: "Content Safety Summary",
    instruction:
      "Categorize the target page content. Classify it (e.g. educational, social, gaming, adult, gambling, malware, phishing, benign). Summarize what the page likely contains and why a school/content filter might flag it.",
  },
  circumvention: {
    label: "Filter Circumvention / False-Positive Risk",
    instruction:
      "Explain why this site might be flagged as blocked or down. Assess whether a block is likely a false positive or intentional. Note any circumvention techniques the site uses (proxies, mirrors, obfuscation) and the risk that filtering is incorrect.",
  },
  threat: {
    label: "Security Threat Score",
    instruction:
      "Evaluate potential phishing / malware / risk based on the URL attributes and domain. Give a threat score from 0 to 100, a risk level (Low/Medium/High/Critical), and bullet-point reasoning.",
  },
};

function buildPrompt(url, analysisType) {
  const t = ANALYSIS_TYPES[analysisType] || ANALYSIS_TYPES.safety;
  return [
    `You are a web filtering and security analysis engine. Analyze the following URL: ${url}`,
    `Task: ${t.label}. ${t.instruction}`,
    `Respond in clean markdown. Be concise (max ~250 words). If you cannot reach the page, reason from the URL/domain itself and say so.`,
  ].join("\n");
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const url = String(body?.url || "").trim();
    const analysisType = String(body?.analysisType || "safety");
    const apiKey = String(body?.apiKey || "").trim();
    const endpoint = String(body?.endpoint || "").trim();
    const model = String(body?.model || "gpt-4o-mini").trim();

    if (!url) return Response.json({ error: 'A URL is required' }, { status: 400 });
    const prompt = buildPrompt(url, analysisType);

    let result;
    if (apiKey) {
      const base = endpoint || 'https://api.freetheai.com/v1/chat/completions';
      const res = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
        }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        return Response.json({ error: `AI provider error ${res.status}: ${txt.slice(0, 300)}` }, { status: 502 });
      }
      const data = await res.json().catch(() => ({}));
      result = data?.choices?.[0]?.message?.content || 'No response from AI provider.';
    } else {
      const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
      result = typeof llmRes === 'string' ? llmRes : JSON.stringify(llmRes);
    }

    return Response.json({ result, analysisType });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
