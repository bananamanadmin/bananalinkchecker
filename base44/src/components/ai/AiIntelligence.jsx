import React, { useEffect, useState } from "react";
import { Brain, Loader2, KeyRound, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";

const ANALYSIS_TYPES = [
  { key: "safety", label: "Content Safety" },
  { key: "circumvention", label: "False-Positive Risk" },
  { key: "threat", label: "Threat Score" },
];

export default function AiIntelligence({ selectedUrl }) {
  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [analysisType, setAnalysisType] = useState("safety");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setApiKey(localStorage.getItem("freetheai-key") || "");
    setEndpoint(localStorage.getItem("freetheai-endpoint") || "");
    setModel(localStorage.getItem("freetheai-model") || "gpt-4o-mini");
  }, []);

  useEffect(() => {
    if (selectedUrl) setUrl(selectedUrl);
  }, [selectedUrl]);

  const saveKey = () => {
    localStorage.setItem("freetheai-key", apiKey);
    localStorage.setItem("freetheai-endpoint", endpoint);
    localStorage.setItem("freetheai-model", model);
  };

  const run = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setOutput("");
    try {
      saveKey();
      const res = await base44.functions.invoke("aiAnalyze", {
        url: url.trim(),
        analysisType,
        apiKey: apiKey.trim(),
        endpoint: endpoint.trim(),
        model: model.trim(),
      });
      if (res?.data?.error) setError(res.data.error);
      else setOutput(res?.data?.result || "No response.");
    } catch (e) {
      setError(e.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <KeyRound className="w-4 h-4 text-foreground/60" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">API Config</span>
          </div>
          <label className="text-xs text-muted-foreground">FreeTheAI / OpenAI-compatible Key (optional)</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-…"
            className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <label className="text-xs text-muted-foreground mt-3 block">Endpoint (optional)</label>
          <input
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="https://api.freetheai.com/v1/chat/completions"
            className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <label className="text-xs text-muted-foreground mt-3 block">Model</label>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Leave the key blank to use the built-in AI engine. Keys are stored only in your browser.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-foreground/60" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target URL</span>
          </div>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Analysis Type</span>
          <div className="flex flex-col gap-2 mt-2">
            {ANALYSIS_TYPES.map((a) => (
              <button
                key={a.key}
                onClick={() => setAnalysisType(a.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium text-left transition ${
                  analysisType === a.key ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70 hover:bg-secondary/70"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={run}
          disabled={loading || !url.trim()}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
          {loading ? "Analyzing…" : "Run AI Analysis"}
        </button>
      </div>

      <div className="lg:col-span-2">
        <div className="rounded-xl border border-border bg-black/90 dark:bg-black/60 h-full min-h-[420px] p-4 font-mono text-sm overflow-auto">
          {error ? (
            <div className="text-rose-400">⚠ {error}</div>
          ) : output ? (
            <pre className="whitespace-pre-wrap text-emerald-300 leading-relaxed">{output}</pre>
          ) : (
            <div className="text-muted-foreground">
              <span className="text-emerald-400">ai-link-intelligence $</span> awaiting analysis…
              <br />
              <span className="text-muted-foreground/60">Select a URL from the inspector or enter one above, choose an analysis type, and run.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
