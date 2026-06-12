// Strip integrity="..." (and matching crossorigin="anonymous") from any <link> or <script>
// tag that points to a local /assets/... path. The hashes were computed by Webflow over the
// original CDN-served bytes; since we rewrote URLs inside the CSS/JS, the bytes differ and
// the browser refuses to apply the resource. Local-origin assets don't need SRI anyway.
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('c:/Bill Fanter/public');

async function walk(dir, out = []) {
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) await walk(p, out);
        else if (p.endsWith('.html')) out.push(p);
    }
    return out;
}

// Match <link ...> or <script ...> tags as a whole, then process the attributes.
const TAG_RE = /<(link|script)\b([^>]*)>/gi;
const HREF_RE = /\b(href|src)\s*=\s*"([^"]*)"/i;

function processTag(tagName, attrs) {
    const href = attrs.match(HREF_RE);
    if (!href) return `<${tagName}${attrs}>`;
    const url = href[2];
    if (!url.startsWith('/assets/')) return `<${tagName}${attrs}>`;
    // Strip integrity= and crossorigin= from local-asset references
    let cleaned = attrs
        .replace(/\s+integrity\s*=\s*"[^"]*"/i, '')
        .replace(/\s+integrity\s*=\s*'[^']*'/i, '')
        .replace(/\s+crossorigin\s*=\s*"[^"]*"/i, '')
        .replace(/\s+crossorigin\s*=\s*'[^']*'/i, '');
    return `<${tagName}${cleaned}>`;
}

const files = await walk(ROOT);
let totalChanges = 0;
for (const f of files) {
    const src = await fs.readFile(f, 'utf8');
    let changes = 0;
    const out = src.replace(TAG_RE, (full, name, attrs) => {
        const replaced = processTag(name, attrs);
        if (replaced !== full) changes++;
        return replaced;
    });
    if (changes > 0) {
        await fs.writeFile(f, out, 'utf8');
        totalChanges += changes;
        console.log(`  ${changes.toString().padStart(3)}  ${path.relative(ROOT, f)}`);
    }
}
console.log(`\nTotal tags fixed: ${totalChanges} across ${files.length} HTML files`);
