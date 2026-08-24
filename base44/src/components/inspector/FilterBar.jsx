import React from "react";
import { Shield, Activity } from "lucide-react";

const BLOCKERS = [
  { key: "goguardian", label: "GoGuardian" },
  { key: "lightspeed", label: "LightSpeed Systems" },
  { key: "securly", label: "Securly" },
  { key: "umbrella", label: "Cisco Umbrella" },
  { key: "fortinet", label: "Fortinet" },
];

const CHECKS = [
  { key: "status", label: "Server Status" },
  { key: "ping", label: "Ping / Latency" },
  { key: "ssl", label: "SSL Certificate" },
];

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
        active
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-background text-foreground/70 border-border hover:border-foreground/40"
      }`}
    >
      {children}
    </button>
  );
}

export default function FilterBar({ blockers, checks, onToggleBlocker, onToggleCheck }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-foreground/60" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Network Blockers</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {BLOCKERS.map((b) => (
            <Chip key={b.key} active={blockers.includes(b.key)} onClick={() => onToggleBlocker(b.key)}>
              {b.label}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-foreground/60" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operational Checks</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {CHECKS.map((c) => (
            <Chip key={c.key} active={checks.includes(c.key)} onClick={() => onToggleCheck(c.key)}>
              {c.label}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
