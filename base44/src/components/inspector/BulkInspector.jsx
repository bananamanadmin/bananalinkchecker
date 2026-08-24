import React, { useRef, useState } from "react";
import { Play, Pause, Download, FileDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import UrlInput from "./UrlInput";
import FilterBar from "./FilterBar";
import ProgressDashboard from "./ProgressDashboard";
import ResultsTable from "./ResultsTable";
import ScanHistory from "./ScanHistory";
import DistrictCheck from "./DistrictCheck";
import { loadHistory, saveRun, removeRun, clearHistory, newRunId } from "@/lib/history";
import { checkBatchFromDevice, mergeDeviceResults } from "@/lib/deviceCheck";

const MAX = 500;
const BATCH = 20;

function parseUrls(text) {
  return text
    .split(/[\s,]+/)
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, MAX);
}

function countBy(results) {
  return results.reduce(
    (acc, r) => {
      if (r.overall === "working") acc.working++;
      else if (r.overall === "blocked") acc.blocked++;
      else if (r.overall === "down") acc.down++;
      return acc;
    },
    { working: 0, blocked: 0, down: 0 }
  );
}

function download(content, type, name) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BulkInspector({ onResults, onSelect }) {
  const [text, setText] = useState("");
  const [blockers, setBlockers] = useState(["goguardian", "lightspeed", "securly", "umbrella", "fortinet"]);
  const [checks, setChecks] = useState(["status", "ping", "ssl"]);
  const [results, setResults] = useState([]);
  const [scanned, setScanned] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [history, setHistory] = useState(() => loadHistory());
  const [district, setDistrict] = useState("");
  const [deviceCheck, setDeviceCheck] = useState(true);
  const pauseRef = useRef(false);

  const urls = parseUrls(text);

  const toggleBlocker = (k) => setBlockers((b) => (b.includes(k) ? b.filter((x) => x !== k) : [...b, k]));
  const toggleCheck = (k) => setChecks((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k]));

  const run = async () => {
    if (!urls.length || running) return;
    setResults([]);
    setScanned(0);
    setRunning(true);
    setPaused(false);
    pauseRef.current = false;
    const acc = [];
    for (let i = 0; i < urls.length; i += BATCH) {
      if (pauseRef.current) break;
      const batch = urls.slice(i, i + BATCH);
      try {
        const res = await base44.functions.invoke("scanUrls", {
          urls: batch,
          blockers,
          checks,
        });
        const data = res?.data?.results || [];
        let merged = data;
        if (deviceCheck && data.length) {
          const deviceResults = await checkBatchFromDevice(data);
          merged = mergeDeviceResults(data, deviceResults, district);
        }
        acc.push(...merged);
        setResults([...acc]);
        setScanned(acc.length);
        onResults && onResults([...acc]);
      } catch (e) {
        acc.push(
          ...batch.map((u) => ({
            url: u,
            overall: "down",
            statusCode: null,
            ping: null,
            ssl: "error",
            blockers: [],
            details: `Scan error: ${e.message}`,
          }))
        );
        setResults([...acc]);
        setScanned(acc.length);
      }
    }
    setRunning(false);
    setPaused(false);
    if (acc.length) {
      const counts = countBy(acc);
      const runRecord = {
        id: newRunId(),
        date: new Date().toISOString(),
        district: district.trim() || null,
        deviceCheck,
        total: acc.length,
        working: counts.working,
        blocked: counts.blocked,
        down: counts.down,
        results: acc,
      };
      setHistory(saveRun(runRecord));
    }
  };

  const pause = () => {
    pauseRef.current = true;
    setPaused(true);
    setRunning(false);
  };

  const exportData = (format) => {
    if (!results.length) return;
    if (format === "json") {
      download(JSON.stringify(results, null, 2), "application/json", "scan-results.json");
    } else {
      const header = ["url", "status", "statusCode", "ping", "ssl", "blockers", "device", "details"];
      const rows = results.map((r) =>
        [
          r.url,
          r.overall,
          r.statusCode ?? "",
          r.ping ?? "",
          r.ssl ?? "",
          (r.blockers || []).join("|"),
          r.device ?? "",
          (r.details || "").replace(/,/g, ";"),
        ].join(",")
      );
      download([header.join(","), ...rows].join("\n"), "text/csv", "scan-results.csv");
    }
  };

  const exportWorking = () => {
    const working = results.filter((r) => r.overall === "working").map((r) => r.url);
    if (!working.length) return;
    download(working.join("\n"), "text/plain", "working-links.txt");
  };

  const loadRun = (run) => {
    setResults(run.results);
    setScanned(run.results.length);
    setText(run.results.map((r) => r.url).join("\n"));
  };

  const deleteRun = (id) => setHistory(removeRun(id));
  const clearAll = () => {
    clearHistory();
    setHistory([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <UrlInput value={text} onChange={setText} count={urls.length} max={MAX} />
        <FilterBar blockers={blockers} checks={checks} onToggleBlocker={toggleBlocker} onToggleCheck={toggleCheck} />
        <DistrictCheck
          district={district}
          onDistrictChange={setDistrict}
          deviceCheck={deviceCheck}
          onToggleDevice={() => setDeviceCheck((v) => !v)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={run}
            disabled={running || !urls.length}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition"
          >
            <Play className="w-4 h-4" /> Run Bulk Scan
          </button>
          <button
            onClick={pause}
            disabled={!running}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-40 hover:bg-secondary transition"
          >
            <Pause className="w-4 h-4" /> Pause
          </button>
          <button
            onClick={() => exportData("csv")}
            disabled={!results.length}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-40 hover:bg-secondary transition"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={() => exportData("json")}
            disabled={!results.length}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-40 hover:bg-secondary transition"
          >
            <Download className="w-4 h-4" /> JSON
          </button>
          <button
            onClick={exportWorking}
            disabled={!results.filter((r) => r.overall === "working").length}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-medium disabled:opacity-40 hover:bg-emerald-500/20 transition"
          >
            <FileDown className="w-4 h-4" /> Working Links
          </button>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <ProgressDashboard scanned={scanned} total={urls.length} running={running} paused={paused} />
        <ResultsTable results={results} onSelect={onSelect} />
        <ScanHistory history={history} onLoad={loadRun} onDelete={deleteRun} onClear={clearAll} district={district} />
      </div>
    </div>
  );
}
