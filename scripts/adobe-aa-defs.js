#!/usr/bin/env node

/*
  Adobe Analytics Variable Definitions Fetcher
  - Retrieves dimensions and metrics definitions for a report suite (RSID)
  - Uses Adobe Analytics 2.0 Components APIs
  - Inputs via CLI flags or environment variables (no .env changes required)

  Required headers:
    - Authorization: Bearer {ACCESS_TOKEN}
    - x-api-key: {CLIENT_ID}
    - x-gw-ims-org-id: {ORG_ID}

  Required values:
    - --company-id | ADOBE_ANALYTICS_COMPANY_ID
    - --rsid       | ADOBE_ANALYTICS_RSID
    - --access-token | ADOBE_ACCESS_TOKEN
    - --api-key      | ADOBE_API_KEY
    - --org-id       | ADOBE_IMS_ORG_ID

  Optional:
    - --locale en_US (default) | ADOBE_LOCALE
    - --segmentable (filter)
    - --reportable (filter)
    - --out path/to/file.json | ADOBE_OUTPUT_FILE
    - --out-csv-dimensions path/to/dimensions.csv | ADOBE_OUTPUT_CSV_DIMENSIONS
    - --out-csv-metrics path/to/metrics.csv | ADOBE_OUTPUT_CSV_METRICS

  Usage examples:
    pnpm aa:defs --company-id=myCompany --rsid=rsid1 --org-id=ORG@AdobeOrg \
      --api-key=abc123 --access-token=eyJ... --locale=en_US --out aa-defs.json

    ADOBE_IMS_ORG_ID=ORG@AdobeOrg ADOBE_API_KEY=abc ADOBE_ACCESS_TOKEN=eyJ... \
    ADOBE_ANALYTICS_COMPANY_ID=myCompany ADOBE_ANALYTICS_RSID=rsid1 pnpm aa:defs
*/

const fs = require('fs');

function getArg(flagName, envName, defaultValue) {
    const idx = process.argv.findIndex((a) => a === flagName || a.startsWith(`${flagName}=`));
    if (idx !== -1) {
        const arg = process.argv[idx];
        if (arg.includes('=')) return arg.split('=').slice(1).join('=');
        const next = process.argv[idx + 1];
        if (next && !next.startsWith('--')) return next;
        return true; // boolean flag
    }
    if (envName && process.env[envName] != null) return process.env[envName];
    return defaultValue;
}

function getBoolFlag(flagName) {
    const v = getArg(flagName, undefined, false);
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') {
        const s = v.toLowerCase();
        return s === '1' || s === 'true' || s === 'yes' || s === 'on';
    }
    return false;
}

function fail(msg, code = 1) {
    console.error(`[aa-defs] Error: ${msg}`);
    process.exit(code);
}

async function fetchJSON(url, headers) {
    const res = await fetch(url, { headers });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }
    if (!res.ok) {
        const details = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}\n${details}`);
    }
    return data;
}

// IMS client-credentials token fetch
async function fetchAccessTokenFromIMS({ imsHost, clientId, clientSecret, scope }) {
    const url = `https://${imsHost}/ims/token/v3`;
    const body = new URLSearchParams();
    body.set('grant_type', 'client_credentials');
    body.set('client_id', clientId);
    body.set('client_secret', clientSecret);
    if (scope) body.set('scope', scope);

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        const details = JSON.stringify(json, null, 2);
        throw new Error(`IMS token request failed: HTTP ${res.status} ${res.statusText}\n${details}`);
    }
    if (!json || !json.access_token) throw new Error('IMS token response missing access_token');
    return json.access_token;
}

function buildQuery(paramsObj) {
    const p = new URLSearchParams();
    Object.entries(paramsObj).forEach(([k, v]) => {
        if (v === undefined || v === null || v === false) return;
        p.set(k, String(v));
    });
    return p.toString();
}

function normalizeDimensions(dimensions) {
    if (!Array.isArray(dimensions)) return [];
    return dimensions.map((d) => ({
        source: 'dimensions',
        type: 'dimension',
        id: d.id ?? d.dimensionId ?? d.cid ?? null,
        title: d.title ?? d.name ?? null,
        name: d.name ?? d.title ?? null,
        description: d.description ?? '',
        category: d.category ?? d.group ?? null,
        segmentable: d.segmentable ?? d.supportsSegmentable ?? undefined,
        reportable: d.reportable ?? d.supportsReports ?? undefined,
        path: d.path ?? null,
        tags: d.tags ?? [],
        raw: d,
    }));
}

function normalizeMetrics(metrics) {
    if (!Array.isArray(metrics)) return [];
    return metrics.map((m) => ({
        source: 'metrics',
        type: 'metric',
        id: m.id ?? m.metricId ?? null,
        title: m.title ?? m.name ?? null,
        name: m.name ?? m.title ?? null,
        description: m.description ?? '',
        category: m.category ?? m.group ?? null,
        segmentable: m.segmentable ?? undefined,
        allowedForReporting: m.allowedForReporting ?? undefined,
        precision: m.precision ?? undefined,
        tags: m.tags ?? [],
        raw: m,
    }));
}

// CSV helpers
const DIMENSION_CSV_COLUMNS = ['id', 'name', 'title', 'description', 'category', 'segmentable', 'reportable', 'path', 'tags'];
const METRIC_CSV_COLUMNS = ['id', 'name', 'title', 'description', 'category', 'segmentable', 'allowedForReporting', 'precision', 'tags'];

function csvEscape(value) {
    if (value === null || value === undefined) return '';
    let s = String(value);
    if (s.includes('"')) s = s.replace(/"/g, '""');
    if (s.includes(',') || s.includes('\n') || s.includes('\r')) s = `"${s}"`;
    return s;
}

function toCSV(items, columns) {
    const rows = [];
    rows.push(columns.join(','));
    for (const item of items) {
        const vals = columns.map((c) => {
            let v = item[c];
            if (Array.isArray(v)) v = v.join('|');
            if (typeof v === 'boolean') v = v ? 'true' : 'false';
            if (v && typeof v === 'object') v = JSON.stringify(v);
            return csvEscape(v);
        });
        rows.push(vals.join(','));
    }
    return rows.join('\n') + '\n';
}

(async () => {
    const orgId = getArg('--org-id', 'ADOBE_IMS_ORG_ID');
    let apiKey = getArg('--api-key', 'ADOBE_API_KEY');
    let accessToken = getArg('--access-token', 'ADOBE_ACCESS_TOKEN');
    const companyId = getArg('--company-id', 'ADOBE_ANALYTICS_COMPANY_ID');
    const rsid = getArg('--rsid', 'ADOBE_ANALYTICS_RSID');
    const locale = getArg('--locale', 'ADOBE_LOCALE', 'en_US');
    const outPath = getArg('--out', 'ADOBE_OUTPUT_FILE');
    const outCsvDimensions = getArg('--out-csv-dimensions', 'ADOBE_OUTPUT_CSV_DIMENSIONS');
    const outCsvMetrics = getArg('--out-csv-metrics', 'ADOBE_OUTPUT_CSV_METRICS');
    // Client credentials for auto token fetch
    const clientId = getArg('--client-id', 'ADOBE_CLIENT_ID');
    const clientSecret = getArg('--client-secret', 'ADOBE_API_SECRET');
    const imsScope = getArg('--scope', 'ADOBE_IMS_SCOPE');
    const imsHost = getArg('--ims-host', 'ADOBE_IMS_HOST', 'ims-na1.adobelogin.com');
    const segmentableOnly = getBoolFlag('--segmentable');
    const reportableOnly = getBoolFlag('--reportable');

    // If no explicit API key, fall back to clientId (common for Adobe APIs)
    if (!apiKey && clientId) apiKey = clientId;

    // Auto-fetch access token if not provided
    if (!accessToken && clientId && clientSecret) {
        try {
            console.error('[aa-defs] No access token provided; requesting one from IMS via client_credentials...');
            accessToken = await fetchAccessTokenFromIMS({ imsHost, clientId, clientSecret, scope: imsScope });
            console.error('[aa-defs] Obtained access token from IMS.');
        } catch (e) {
            fail(e && e.message ? e.message : String(e));
        }
    }

    if (!orgId) fail('Missing --org-id or ADOBE_IMS_ORG_ID');
    if (!apiKey) fail('Missing --api-key or ADOBE_API_KEY (or provide --client-id)');
    if (!accessToken) fail('Missing --access-token or ADOBE_ACCESS_TOKEN (or provide --client-id/--client-secret[/--scope] to auto-fetch)');
    if (!companyId) fail('Missing --company-id or ADOBE_ANALYTICS_COMPANY_ID');
    if (!rsid) fail('Missing --rsid or ADOBE_ANALYTICS_RSID');

    const base = `https://analytics.adobe.io/api/${encodeURIComponent(companyId)}`;
    const query = buildQuery({ rsid, locale, segmentable: segmentableOnly ? 'true' : undefined, reportable: reportableOnly ? 'true' : undefined });

    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'x-api-key': apiKey,
        'x-gw-ims-org-id': orgId,
        'Accept': 'application/json',
    };

    console.error(`[aa-defs] Fetching definitions for rsid="${rsid}" (locale=${locale}) from company="${companyId}"...`);

    try {
        const [dims, mets] = await Promise.all([
            fetchJSON(`${base}/dimensions?${query}`, headers),
            fetchJSON(`${base}/metrics?${query}`, headers),
        ]);

        const dimensions = normalizeDimensions(dims?.content ?? dims ?? []);
        const metrics = normalizeMetrics(mets?.content ?? mets ?? []);

        const combined = [...dimensions, ...metrics].sort((a, b) => {
            if (a.type !== b.type) return a.type < b.type ? -1 : 1;
            return String(a.id).localeCompare(String(b.id));
        });

        const output = {
            rsid,
            companyId,
            locale,
            counts: { dimensions: dimensions.length, metrics: metrics.length, total: combined.length },
            timestamp: new Date().toISOString(),
            items: combined,
        };

        const json = JSON.stringify(output, null, 2);

        // Write CSV files if requested
        if (outCsvDimensions) {
            const csv = toCSV(dimensions, DIMENSION_CSV_COLUMNS);
            fs.writeFileSync(outCsvDimensions, csv);
            console.error(`[aa-defs] Wrote ${dimensions.length} dimensions to ${outCsvDimensions}`);
        }
        if (outCsvMetrics) {
            const csv = toCSV(metrics, METRIC_CSV_COLUMNS);
            fs.writeFileSync(outCsvMetrics, csv);
            console.error(`[aa-defs] Wrote ${metrics.length} metrics to ${outCsvMetrics}`);
        }

        if (outPath) {
            fs.writeFileSync(outPath, json);
            console.error(`[aa-defs] Wrote ${combined.length} definitions to ${outPath}`);
        } else {
            process.stdout.write(json + '\n');
        }
    } catch (err) {
        fail(err && err.message ? err.message : String(err));
    }
})();
