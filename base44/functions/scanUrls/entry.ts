import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { analyzeUrl } from './detect.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const urls = Array.isArray(body?.urls) ? body.urls.slice(0, 50) : [];
    const blockers = Array.isArray(body?.blockers) ? body.blockers : [];
    const checks = Array.isArray(body?.checks) && body.checks.length ? body.checks : ['status', 'ping', 'ssl'];
    if (!urls.length) return Response.json({ results: [] });

    const concurrency = Math.min(8, urls.length);
    const results = new Array(urls.length);
    let cursor = 0;

    async function worker() {
      while (cursor < urls.length) {
        const i = cursor++;
        try {
          results[i] = await analyzeUrl(urls[i], blockers, checks);
        } catch (e) {
          results[i] = { url: urls[i], overall: 'down', statusCode: null, ping: null, ssl: 'error', blockers: [], details: e.message };
        }
      }
    }

    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
