import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";

const STATUS_META = {
  working: { dot: "🟢", label: "Working", className: "text-emerald-500" },
  down: { dot: "🔴", label: "Down", className: "text-rose-500" },
  blocked: { dot: "🟡", label: "Blocked", className: "text-amber-500" },
  unknown: { dot: "⚪", label: "Unknown", className: "text-muted-foreground" },
};

const DEVICE_META = {
  reachable: { icon: "🖥️✅", label: "Reachable on your device", className: "text-emerald-500" },
  blocked: { icon: "🖥️✖", label: "Blocked on your device", className: "text-rose-500" },
  timeout: { icon: "🖥️⏱", label: "Timed out on your device", className: "text-amber-500" },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "working", label: "Working" },
  { key: "blocked", label: "Blocked" },
  { key: "down", label: "Down" },
];

export default function ResultsTable({ results, onSelect }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const hasDevice = results.some((r) => r.device);

  const filtered = useMemo(() => {
    return results.filter((r) => {
      if (filter !== "all" && r.overall !== filter) return false;
      if (query && !r.url.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [results, filter, query]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                filter === f.key ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70 hover:bg-secondary/70"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search URLs…"
            className="w-full sm:w-64 pl-8 pr-3 py-1.5 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-secondary/80 backdrop-blur text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-2.5">URL</th>
                <th className="text-left font-semibold px-4 py-2.5">Status</th>
                <th className="text-left font-semibold px-4 py-2.5">Code / Ping</th>
                <th className="text-left font-semibold px-4 py-2.5">Blockers</th>
                {hasDevice && <th className="text-left font-semibold px-4 py-2.5">Device</th>}
                <th className="text-left font-semibold px-4 py-2.5">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const meta = STATUS_META[r.overall] || STATUS_META.unknown;
                return (
                  <tr
                    key={i}
                    onClick={() => onSelect && onSelect(r)}
                    className="border-t border-border/60 hover:bg-secondary/40 cursor-pointer transition"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-foreground/90 max-w-[280px] truncate" title={r.url}>
                      {r.url}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`font-medium ${meta.className}`}>{meta.dot} {meta.label}</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">
                      {r.statusCode || "—"}
                      {r.ping != null ? ` · ${r.ping}ms` : ""}
                    </td>
                    <td className="px-4 py-2.5">
                      {r.blockers && r.blockers.length ? (
                        <span className="text-amber-500 text-xs">{r.blockers.join(", ")}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">None</span>
                      )}
                    </td>
                    {hasDevice && (
                      <td className="px-4 py-2.5 text-xs">
                        {r.device ? (
                          <span className={DEVICE_META[r.device]?.className || "text-muted-foreground"} title={DEVICE_META[r.device]?.label}>
                            {DEVICE_META[r.device]?.icon || "—"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[220px] truncate" title={r.details}>
                      {r.details}
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan={hasDevice ? 6 : 5} className="px-4 py-10 text-center text-muted-foreground text-sm">
                    No results yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} shown · click a row to analyze it in the AI tab.</p>
    </div>
  );
}
