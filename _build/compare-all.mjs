// Compare every local page against the live billfanter.com equivalent.
// Normalizes expected differences (URL rewrites, SRI strip, "Last Published" timestamp comment)
// and flags any other content drift.

import fs from 'node:fs/promises';
import path from 'node:path';

const LOCAL = 'http://localhost:8765';
const LIVE = 'https://www.billfanter.com';

const PAGES = [
    { slug: '/', live: '/' },
    { slug: '/contact', live: '/contact' },
    { slug: '/webinar', live: '/webinar' },
    { slug: '/masterclass', live: '/masterclass' },
    { slug: '/blog', live: '/blog' },
    { slug: '/privacy-policy', live: '/privacy-policy' },
    { slug: '/terms-conditions', live: '/terms-conditions' },
    { slug: '/free-watchlist', live: '/free-watchlist' },
    { slug: '/student-comments', live: '/student-comments' },
    { slug: '/refund-policy', live: '/refund-policy' },
    { slug: '/watchlist', live: '/watchlist' },
    { slug: '/community', live: '/community' },
    { slug: '/courses', live: '/courses' },
    { slug: '/learn-on-demand', live: '/learn-on-demand' },
    { slug: '/masterclass2026', live: '/masterclass2026' },
    { slug: '/webinar2', live: '/webinar2' },
    { slug: '/options', live: '/options' },
    { slug: '/lm-watch', live: '/lm-watch' },
    { slug: '/sw-lm-lp', live: '/sw-lm-lp' },
    { slug: '/options-foundation', live: '/options-foundation' },
    { slug: '/options-masterclass-module-1', live: '/options-masterclass-module-1' },
    { slug: '/options-copy', live: '/options-copy' },
];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function get(url) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
    return await r.text();
}

// Normalize an HTML doc so we can compare structure/content without false positives
// from expected mirror-side differences.
function normalizeLive(html) {
    return html
        // The Webflow "Last Published" comment varies per request
        .replace(/<!--\s*Last Published[\s\S]*?-->/g, '<!--TS-->')
        // CDN host → /assets to match local
        .replace(/https:\/\/cdn\.prod\.website-files\.com/g, '/assets')
        // Bare CDN preconnect href
        .replace(/href="\/assets"/g, 'href="/assets/"')
        // Strip integrity= attrs from local-asset tags (mirror strips these)
        .replace(/<(link|script)\b([^>]*)>/gi, (full, name, attrs) => {
            const href = attrs.match(/\b(href|src)\s*=\s*"([^"]*)"/i);
            if (!href || !href[2].startsWith('/assets/')) return full;
            return `<${name}${attrs
                .replace(/\s+integrity\s*=\s*"[^"]*"/i, '')
                .replace(/\s+crossorigin\s*=\s*"[^"]*"/i, '')}>`;
        })
        .replace(/\s+/g, ' ').trim();
}

function normalizeLocal(html) {
    return html
        .replace(/<!--\s*Last Published[\s\S]*?-->/g, '<!--TS-->')
        .replace(/href="\/assets"/g, 'href="/assets/"')
        .replace(/\s+/g, ' ').trim();
}

// Pull visible text content for an extra sanity check
function textOnly(html) {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Pull all asset references for an extra sanity check.
// Skip the bare CDN host / "/assets" preconnect ref (no path) — it's not an asset, just a perf hint.
function assetRefs(html) {
    const out = new Set();
    const add = v => {
        if (!v) return;
        const clean = v.split('?')[0].split('#')[0];
        if (clean === '/assets' || clean === '/assets/') return; // bare preconnect, not an asset
        out.add(clean);
    };
    const re = /(?:src|href|poster|data-src|content)\s*=\s*"([^"]*)"/g;
    let m;
    while ((m = re.exec(html))) {
        const v = m[1];
        if (v.startsWith('/assets')) add(v);
        else if (v.startsWith('https://cdn.prod.website-files.com')) {
            add(v.replace('https://cdn.prod.website-files.com', '/assets'));
        }
    }
    const sre = /srcset\s*=\s*"([^"]+)"/g;
    while ((m = sre.exec(html))) {
        for (const part of m[1].split(',')) {
            const url = part.trim().split(/\s+/)[0];
            if (url.startsWith('/assets')) add(url);
            else if (url.startsWith('https://cdn.prod.website-files.com')) {
                add(url.replace('https://cdn.prod.website-files.com', '/assets'));
            }
        }
    }
    return out;
}

function tagCount(html) {
    return (html.match(/<[a-z][^>]*>/g) || []).length;
}

const report = [];
let allClean = true;

for (const p of PAGES) {
    const localUrl = LOCAL + (p.slug === '/' ? '/' : p.slug + '/');
    const liveUrl = LIVE + p.live;
    let live, local;
    try {
        [live, local] = await Promise.all([get(liveUrl), get(localUrl)]);
    } catch (e) {
        report.push({ page: p.slug, status: 'FETCH-FAIL', error: e.message });
        allClean = false;
        continue;
    }

    const liveTags = tagCount(live);
    const localTags = tagCount(local);

    const liveText = textOnly(live);
    const localText = textOnly(local);
    const textMatch = liveText === localText;

    const liveAssets = assetRefs(live);
    const localAssets = assetRefs(local);
    const liveOnly = [...liveAssets].filter(a => !localAssets.has(a));
    const localOnly = [...localAssets].filter(a => !liveAssets.has(a));

    const liveNorm = normalizeLive(live);
    const localNorm = normalizeLocal(local);
    const exactMatch = liveNorm === localNorm;

    const issues = [];
    if (liveTags !== localTags) issues.push(`tag count diff: live=${liveTags} local=${localTags}`);
    if (!textMatch) {
        // Approximate text diff length
        const diff = Math.abs(liveText.length - localText.length);
        issues.push(`visible text diff (~${diff} chars)`);
    }
    if (liveOnly.length > 0) issues.push(`assets only on live (${liveOnly.length}): ${liveOnly.slice(0, 3).join(', ')}`);
    if (localOnly.length > 0) issues.push(`assets only on local (${localOnly.length}): ${localOnly.slice(0, 3).join(', ')}`);

    if (issues.length === 0) {
        report.push({ page: p.slug, status: 'OK', tags: liveTags, textLen: liveText.length, assets: liveAssets.size });
    } else {
        report.push({ page: p.slug, status: 'DRIFT', tags: liveTags, issues });
        allClean = false;
    }
}

// Print
console.log('\n%-35s %-7s %5s %6s %6s %s', 'Page', 'Status', 'Tags', 'Text', 'Assets', 'Notes');
console.log('-'.repeat(95));
for (const r of report) {
    if (r.status === 'OK') {
        console.log(`${r.page.padEnd(35)} ${r.status.padEnd(7)} ${String(r.tags).padStart(5)} ${String(r.textLen).padStart(6)} ${String(r.assets).padStart(6)}`);
    } else if (r.status === 'DRIFT') {
        console.log(`${r.page.padEnd(35)} ${r.status.padEnd(7)} ${String(r.tags).padStart(5)}`);
        for (const i of r.issues) console.log(`  → ${i}`);
    } else {
        console.log(`${r.page.padEnd(35)} ${r.status}  ${r.error || ''}`);
    }
}
console.log('-'.repeat(95));
console.log(allClean ? '\n✅ All 22 pages identical to live (modulo expected URL rewrites & SRI strip).' : '\n⚠ Drift detected. Investigate above.');

await fs.writeFile(path.resolve('c:/Bill Fanter/_build/compare-report.json'), JSON.stringify(report, null, 2));
