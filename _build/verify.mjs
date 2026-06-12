// Verify every /assets/... reference in HTML and CSS resolves to a real file on disk.
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('c:/Bill Fanter/public');
const ASSETS = path.join(ROOT, 'assets');

async function walk(dir, out = []) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) await walk(p, out);
        else out.push(p);
    }
    return out;
}

const files = await walk(ROOT);
const htmlFiles = files.filter(f => f.endsWith('.html'));
const cssFiles = files.filter(f => f.endsWith('.css'));
const jsFiles = files.filter(f => f.endsWith('.js'));

const missing = new Map(); // referenced asset -> set of sources

function decodeAssetPath(p) {
    // Browser URL: /assets/664a.../foo%20bar.jpg
    // Disk path: /assets/664a.../foo bar.jpg
    try { return decodeURIComponent(p); } catch { return p; }
}

async function fileExists(p) {
    try { await fs.access(p); return true; } catch { return false; }
}

// 1. Extract all /assets/... references from HTML.
// Strategy: look for attribute-quoted strings and pull /assets/... URLs out of them.
// Quoted-value scanner handles parens, special chars, etc. correctly.
const attrValRe = /\b(?:src|href|poster|data-src|content)\s*=\s*"([^"]*)"/g;
const attrValReSingle = /\b(?:src|href|poster|data-src|content)\s*=\s*'([^']*)'/g;
function pushIfAsset(url, file) {
    if (!url || !url.startsWith('/assets/')) return;
    // strip query string and fragment
    const clean = url.split('?')[0].split('#')[0];
    const ref = decodeAssetPath(clean);
    const onDisk = path.join(ROOT, ref);
    return fileExists(onDisk).then(ok => {
        if (!ok) {
            if (!missing.has(ref)) missing.set(ref, new Set());
            missing.get(ref).add(path.relative(ROOT, file));
        }
    });
}
for (const f of htmlFiles) {
    const src = await fs.readFile(f, 'utf8');
    const checks = [];
    let m;
    attrValRe.lastIndex = 0;
    while ((m = attrValRe.exec(src))) checks.push(pushIfAsset(m[1], f));
    attrValReSingle.lastIndex = 0;
    while ((m = attrValReSingle.exec(src))) checks.push(pushIfAsset(m[1], f));
    // srcset uses commas; each candidate is "url WxH"
    const srcsetRe = /srcset\s*=\s*"([^"]+)"/g;
    while ((m = srcsetRe.exec(src))) {
        for (const part of m[1].split(',')) {
            const url = part.trim().split(/\s+/)[0];
            checks.push(pushIfAsset(url, f));
        }
    }
    // style="background-image:url(...)" inline
    const inlineStyleRe = /style\s*=\s*"([^"]*)"/g;
    while ((m = inlineStyleRe.exec(src))) {
        const styleBody = m[1];
        const urlRe = /url\(\s*(?:"([^"]+)"|'([^']+)'|([^)]+))\s*\)/g;
        let um;
        while ((um = urlRe.exec(styleBody))) {
            const raw = (um[1] ?? um[2] ?? um[3] ?? '').trim();
            checks.push(pushIfAsset(raw, f));
        }
    }
    await Promise.all(checks);
}

// 2. CSS url() references
const cssRefRe = /url\(\s*(?:"([^"]+)"|'([^']+)'|([^)]+))\s*\)/g;
for (const f of cssFiles) {
    const src = await fs.readFile(f, 'utf8');
    let m;
    cssRefRe.lastIndex = 0;
    while ((m = cssRefRe.exec(src))) {
        const raw = (m[1] ?? m[2] ?? m[3] ?? '').trim();
        if (raw.startsWith('data:')) continue;
        if (raw.startsWith('/assets/')) {
            const ref = decodeAssetPath(raw);
            const onDisk = path.join(ROOT, ref);
            if (!(await fileExists(onDisk))) {
                if (!missing.has(ref)) missing.set(ref, new Set());
                missing.get(ref).add(path.relative(ROOT, f));
            }
        }
    }
}

console.log(`HTML files: ${htmlFiles.length}`);
console.log(`CSS files: ${cssFiles.length}`);
console.log(`JS files: ${jsFiles.length}`);
console.log(`Missing asset refs: ${missing.size}`);
if (missing.size > 0) {
    for (const [ref, sources] of [...missing].slice(0, 30)) {
        console.log(`  ${ref}`);
        for (const s of [...sources].slice(0, 3)) console.log(`    ← ${s}`);
    }
}
