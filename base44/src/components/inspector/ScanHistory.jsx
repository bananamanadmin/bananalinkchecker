import React from "react";
import { History, Trash2, Eye } from "lucide-react";

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function ScanHistory({ history, onLoad, onDelete, onClear }) {
  if (!history.length) {
    return (
      <div className="rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">
        <History className="w-5 h-5 mx-auto mb-2 opacity-50" />
        No scan history yet. Completed scans are saved here automatically.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-secondary/60 border-b border-border">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-foreground/60" />
          <span className="text-sm font-semibold">Scan History</span>
          <span className="text-xs text-muted-foreground">({history.length})</span>
        </div>
        <button onClick={onClear} className="text-xs text-muted-foreground hover:text-destructive transition">
          Clear all
        </button>
      </div>
      <div className="divide-y divide-border">
        {history.map((run) => (
          <div key={run.id} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-secondary/30 transition">
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">{fmtDate(run.date)}</div>
              <div className="text-sm font-mono truncate">
                {run.total} URLs ·{" "}
                <span className="text-emerald-500">{run.working} working</span> ·{" "}
                <span className="text-amber-500">{run.blocked} blocked</span> ·{" "}
                <span className="text-rose-500">{run.down} down</span>
              </div>
              {run.district && (
                <div className="text-xs text-foreground/60 truncate">🏫 {run.district}{run.deviceCheck ? " · device check on" : ""}</div>
              )}
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => onLoad(run)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border text-xs hover:bg-secondary transition"
              >
                <Eye className="w-3.5 h-3.5" /> Load
              </button>
              <button
                onClick={() => onDelete(run.id)}
                className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition"
                aria-label="Delete run"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
