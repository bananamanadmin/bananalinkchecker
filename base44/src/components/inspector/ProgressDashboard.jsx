import React from "react";

export default function ProgressDashboard({ scanned, total, running, paused }) {
  const pct = total ? Math.round((scanned / total) * 100) : 0;
  const status = running ? (paused ? "Paused" : "Scanning…") : total ? "Complete" : "Idle";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground/80">{status}</span>
        <span className="font-mono text-muted-foreground">{scanned} / {total} · {pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${paused ? "bg-amber-500" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
