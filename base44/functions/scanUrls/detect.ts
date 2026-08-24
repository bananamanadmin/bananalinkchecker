// Shared detection logic for real blocker / status inspection.
// Runs server-side (no CORS), so we can read real headers, redirects and bodies.

const BLOCK_SIGNATURES = {
  goguardian: {
    label: "GoGuardian",
    domains: ["goguardian.com"],
    body: ["goguardian", "goguardian-block", "restricted page", "this page is blocked"],
  },
  lightspeed: {
    label: "LightSpeed Systems",
    domains: ["lightspeedsystems.com", "lightspeed.com", "lightspeedfilter.com"],
    body: ["lightspeed", "lightspeed systems", "rocket", "relay", "filterblocked"],
  },
  securly: {
    label: "Securly",
    domains: ["securly.com"],
    body: ["securly", "securly-blocked-page", "securly block", "this site has been blocked"],
  },
  umbrella: {
    label: "Cisco Umbrella",
    domains: ["umbrella.cisco.com", "opendns.com", "blockpage"],
    body: ["umbrella", "opendns", "cisco", "this domain is blocked", "blocked by your administrator"],
  },
  fortinet: {
    label: "Fortinet",
    domains: ["fortinet.com", "fortiguard.com"],
    body: ["fortiguard", "fortinet", "web filter block", "category blocked"],
  },
};

function normalizeUrl(raw) {
  let u = String(raw).trim();
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  return u;
}

function timeoutSignal(ms) {
  try {
    return AbortSignal.timeout(ms);
  } catch {
    return undefined;
  }
}

function assessSsl(url, fetchError, status) {
  const isHttps = /^https:\/\//i.test(url);
  if (!isHttps) return "none";
  const err = String(fetchError || "").toLowerCase();
  if (err.includes("certificate") || err.includes("ssl") || err.includes("cert")) return "invalid";
  if (status && status < 500) return "valid";
  return "unknown";
}

function detectBlockers(finalUrl, headers, bodyText, status, selectedBlockers) {
  const triggered = [];
  const host = (() => { try { return new URL(finalUrl).hostname.toLowerCase(); } catch { return ""; } })();
  const body = (bodyText || "").toLowerCase();
  const loc = String(headers["location"] || "").toLowerCase();
  const keys = selectedBlockers && selectedBlockers.length
    ? selectedBlockers
    : Object.keys(BLOCK_SIGNATURES);
  for (const key of keys) {
    const sig = BLOCK_SIGNATURES[key];
    if (!sig) continue;
    const domainHit = sig.domains.some((d) => host.includes(d) || loc.includes(d));
    const bodyHit = sig.body.some((s) => body.includes(s.toLowerCase()));
    if (domainHit || bodyHit) triggered.push(sig.label);
  }
  // Generic block signals regardless of selected blocker (HTTP 451, blockpage title).
  const generic = ["access denied", "blocked", "forbidden by policy", "this site is blocked"];
  const genericHit = generic.some((s) => body.includes(s)) || status === 451;
  if (genericHit && triggered.length === 0) triggered.push("Generic Block Page");
  return triggered;
}

function determineOverall(status, fetchError, triggered) {
  if (fetchError) return "down";
  if (triggered.length) return "blocked";
  if (status === 403 || status === 451) return "blocked";
  if (status === 404 || (status >= 500 && status < 600)) return "down";
  if (status && status >= 200 && status < 400) return "working";
  return "unknown";
}

function buildDetails(status, fetchError, triggered) {
  if (fetchError) return `Unreachable: ${fetchError}`;
  const parts = [];
  if (status) parts.push(`HTTP ${status}`);
  if (triggered.length) parts.push(`Blockers: ${triggered.join(", ")}`);
  return parts.join(" · ") || "Reachable";
}

export async function analyzeUrl(rawUrl, blockers, checks) {
  const url = normalizeUrl(rawUrl);
  if (!url) return { url: rawUrl, overall: "down", statusCode: null, ping: null, ssl: "invalid", blockers: [], details: "Invalid URL" };

  const start = Date.now();
  let response = null;
  let finalUrl = url;
  let status = null;
  let headers = {};
  let bodyText = "";
  let fetchError = null;

  try {
    response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: timeoutSignal(12000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LinkInspector/1.0)" },
    });
    status = response.status;
    finalUrl = response.url || url;
    headers = Object.fromEntries(response.headers.entries());
    // Read up to 200KB of body for signature scanning.
    const buf = await response.text();
    bodyText = buf.slice(0, 200000);
  } catch (e) {
    fetchError = e.message || String(e);
  }

  const ping = Date.now() - start;
  const ssl = assessSsl(url, fetchError, status);
  const triggered = detectBlockers(finalUrl, headers, bodyText, status, blockers);
  const overall = determineOverall(status, fetchError, triggered);
  const details = buildDetails(status, fetchError, triggered);

  const result = { url, finalUrl, overall, ping, ssl, blockers: triggered, details };
  if (checks && !checks.includes("ping")) result.ping = null;
  if (checks && !checks.includes("ssl")) result.ssl = "skipped";
  return result;
}
