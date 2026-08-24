import React from "react";
import { Building2, Wifi } from "lucide-react";

export default function DistrictCheck({ district, onDistrictChange, deviceCheck, onToggleDevice }) {
  return (
    <div className="space-y-3 rounded-xl border border-border p-4 bg-secondary/30">
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-foreground/60" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your District / Network</span>
      </div>
      <input
        value={district}
        onChange={(e) => onDistrictChange(e.target.value)}
        placeholder="e.g. Springfield Public Schools"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        type="button"
        role="switch"
        aria-checked={deviceCheck}
        onClick={onToggleDevice}
        className="flex items-center gap-2.5 w-full text-left"
      >
        <span className={`relative h-5 w-9 rounded-full transition shrink-0 ${deviceCheck ? "bg-primary" : "bg-secondary border border-border"}`}>
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-background shadow transition-all ${deviceCheck ? "left-[18px]" : "left-0.5"}`} />
        </span>
        <span className="text-sm text-foreground/80 flex items-center gap-1.5">
          <Wifi className="w-3.5 h-3.5" /> Check from my device
        </span>
      </button>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Runs a reachability test from your browser. Since your device is on your district's network, a URL that's up globally but unreachable here is being blocked by your district's filter (DNS / connection level).
      </p>
    </div>
  );
}
