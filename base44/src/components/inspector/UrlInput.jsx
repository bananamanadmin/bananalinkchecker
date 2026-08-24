import React from "react";

export default function UrlInput({ value, onChange, count, max = 500 }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground/80">Bulk URLs</label>
        <span className={`text-xs font-mono ${count >= max ? "text-destructive" : "text-muted-foreground"}`}>
          {count} / {max} loaded
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={"Paste up to 500 URLs — space, comma, or line separated\nhttps://example.com, wikipedia.org\nhttps://github.com"}
        className="w-full h-40 resize-y rounded-xl border border-border bg-background/60 px-4 py-3 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
        spellCheck={false}
      />
      <p className="text-xs text-muted-foreground">
        Supports space-separated, comma-separated, or line-by-line paste.
      </p>
    </div>
  );
}
