// Smoke-test the locally-served mirror by fetching every page and the assets they reference,
// confirming each returns HTTP 200.
import { Worker } from 'node:worker_threads';

const BASE = 'http://localhost:8765';
const PAGES = [
    '/', '/contact/', '/webinar/', '/masterclass/', '/blog/', '/privacy-policy/',
    '/terms-conditions/', '/free-watchlist/', '/student-comments/', '/refund-policy/',
    '/watchlist/', '/community/', '/courses/', '/learn-on-demand/', '/masterclass2026/',
    '/webinar2/', '/options/', '/lm-watch/', '/sw-lm-lp/', '/options-foundation/',
    '/options-masterclass-module-1/', '/options-copy/',
];

async function head(url) {
    try {
        const r = await fetch(url, { method: 'GET' });
        return r.status;
    } catch (e) {
        return `ERR ${e.message}`;
    }
}

const assetUrls = new Set();

console.log('== Page status ==');
for (const p of PAGES) {
    const url = BASE + p;
    const r = await fetch(url);
    const status = r.status;
    console.log(`  ${status}  ${p}`);
    if (status !== 200) continue;
    const html = await r.text();
    // collect /assets/... refs
    const re = /(?:src|href|poster|data-src|content)\s*=\s*"([^"]*)"/g;
    let m;
    while ((m = re.exec(html))) {
        const v = m[1];
        if (v.startsWith('/assets/')) assetUrls.add(v.split('?')[0].split('#')[0]);
    }
    // srcset
    const sre = /srcset\s*=\s*"([^"]+)"/g;
    while ((m = sre.exec(html))) {
        for (const part of m[1].split(',')) {
            const u = part.trim().split(/\s+/)[0];
            if (u.startsWith('/assets/')) assetUrls.add(u);
        }
    }
    // inline style url(...)
    const ire = /style\s*=\s*"([^"]*)"/g;
    while ((m = ire.exec(html))) {
        const sb = m[1];
        const ure = /url\(\s*(?:"([^"]+)"|'([^']+)'|([^)]+))\s*\)/g;
        let um;
        while ((um = ure.exec(sb))) {
            const raw = (um[1] ?? um[2] ?? um[3] ?? '').trim();
            if (raw.startsWith('/assets/')) assetUrls.add(raw);
        }
    }
}

console.log(`\n== Sampling ${assetUrls.size} unique referenced assets ==`);

let ok = 0, bad = 0;
const bads = [];
const all = [...assetUrls];
const CONC = 16;
for (let i = 0; i < all.length; i += CONC) {
    const batch = all.slice(i, i + CONC);
    const results = await Promise.all(batch.map(async u => [u, await head(BASE + u)]));
    for (const [u, s] of results) {
        if (s === 200) ok++;
        else { bad++; bads.push([u, s]); }
    }
}
console.log(`OK: ${ok}  Bad: ${bad}`);
if (bads.length) {
    console.log('\nBad assets:');
    for (const [u, s] of bads.slice(0, 30)) console.log(`  ${s}  ${u}`);
}
