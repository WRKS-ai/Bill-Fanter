// Mirror billfanter.com (Webflow) into a self-contained static site.
//
// Strategy:
//  - Fetch the 22 URLs from sitemap.xml
//  - For each HTML page, find every cdn.prod.website-files.com asset (CSS, JS, images, fonts, srcset, og:image, etc.)
//  - Recursively walk CSS files for url(...) references (fonts, background images)
//  - Mirror every CDN asset under ./public/assets/<cdn-path>
//  - Rewrite HTML and CSS to point to local /assets/... paths
//  - Keep external public CDNs (Google Fonts loader, jQuery from CloudFront, Facebook Pixel) untouched
//  - Save each page as <slug>/index.html so Vercel serves clean URLs

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public');
const ASSETS_DIR = path.join(OUT, 'assets');

const ORIGIN = 'https://www.billfanter.com';
const CDN_HOST = 'cdn.prod.website-files.com';
// External public CDNs we leave alone (won't disappear)
const KEEP_REMOTE_HOSTS = new Set([
    'ajax.googleapis.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'd3e54v103j8qbb.cloudfront.net',
    'connect.facebook.net',
    'www.googletagmanager.com',
    'www.google-analytics.com',
    'www.youtube.com',
    'i.ytimg.com',
    'www.facebook.com',
]);

// Pages we will fetch — from sitemap.xml
const PAGES = [
    { url: ORIGIN + '/',                              slug: '' },              // homepage → index.html
    { url: ORIGIN + '/contact',                       slug: 'contact' },
    { url: ORIGIN + '/webinar',                       slug: 'webinar' },
    { url: ORIGIN + '/masterclass',                   slug: 'masterclass' },
    { url: ORIGIN + '/blog',                          slug: 'blog' },
    { url: ORIGIN + '/privacy-policy',                slug: 'privacy-policy' },
    { url: ORIGIN + '/terms-conditions',              slug: 'terms-conditions' },
    { url: ORIGIN + '/free-watchlist',                slug: 'free-watchlist' },
    { url: ORIGIN + '/student-comments',              slug: 'student-comments' },
    { url: ORIGIN + '/refund-policy',                 slug: 'refund-policy' },
    { url: ORIGIN + '/watchlist',                     slug: 'watchlist' },
    { url: ORIGIN + '/community',                     slug: 'community' },
    { url: ORIGIN + '/courses',                       slug: 'courses' },
    { url: ORIGIN + '/learn-on-demand',               slug: 'learn-on-demand' },
    { url: ORIGIN + '/masterclass2026',               slug: 'masterclass2026' },
    { url: ORIGIN + '/webinar2',                      slug: 'webinar2' },
    { url: ORIGIN + '/options',                       slug: 'options' },
    { url: ORIGIN + '/lm-watch',                      slug: 'lm-watch' },
    { url: ORIGIN + '/sw-lm-lp',                      slug: 'sw-lm-lp' },
    { url: ORIGIN + '/options-foundation',            slug: 'options-foundation' },
    { url: ORIGIN + '/options-masterclass-module-1',  slug: 'options-masterclass-module-1' },
    { url: ORIGIN + '/options-copy',                  slug: 'options-copy' },
];

// In-memory queues and tracking
const assetsToFetch = new Set();   // absolute CDN URLs to download
const fetchedAssets = new Map();   // url → local path (under public/)
const failed = [];

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function httpGet(url, { binary = false } = {}) {
    const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, 'Accept': '*/*' },
        redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    if (binary) return Buffer.from(await res.arrayBuffer());
    return await res.text();
}

function cdnUrlToLocalPath(url) {
    // https://cdn.prod.website-files.com/664a.../foo/bar.css
    //   → public/assets/664a.../foo/bar.css
    const u = new URL(url);
    // Strip query strings — Webflow appends ?site=… on some assets
    const cleanPath = u.pathname;
    return path.join(ASSETS_DIR, decodeURIComponent(cleanPath));
}

function cdnUrlToWebPath(url, fromPageDepth) {
    // What the rewritten href should be in HTML/CSS.
    // For pages at depth 0 (index.html at root), it's /assets/...
    // For pages at depth 1 (/contact/index.html), still /assets/... — root-relative is best.
    const u = new URL(url);
    return '/assets' + u.pathname;
}

// All CDN host variants we want to capture
function isMirrorableUrl(absUrl) {
    try {
        const u = new URL(absUrl);
        return u.hostname === CDN_HOST;
    } catch { return false; }
}

function absolutize(maybeRelative, baseUrl) {
    try { return new URL(maybeRelative, baseUrl).toString(); }
    catch { return null; }
}

// Extract every URL that appears in an HTML document
function extractHtmlAssetUrls(html, baseUrl) {
    const urls = new Set();

    // 1. src="...", href="...", poster="..."
    const attrRe = /\b(?:src|href|poster|data-src|content)\s*=\s*(["'])([^"']+)\1/gi;
    let m;
    while ((m = attrRe.exec(html))) {
        const abs = absolutize(m[2], baseUrl);
        if (abs && isMirrorableUrl(abs)) urls.add(abs);
    }

    // 2. srcset="..., ..."  (parse each candidate)
    const srcsetRe = /\bsrcset\s*=\s*(["'])([^"']+)\1/gi;
    while ((m = srcsetRe.exec(html))) {
        for (const part of m[2].split(',')) {
            const candidate = part.trim().split(/\s+/)[0];
            const abs = absolutize(candidate, baseUrl);
            if (abs && isMirrorableUrl(abs)) urls.add(abs);
        }
    }

    // 3. CSS url(...) inside <style> blocks
    const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    while ((m = styleRe.exec(html))) {
        for (const u of extractCssUrls(m[1], baseUrl)) urls.add(u);
    }

    return urls;
}

// CSS url() syntax allows backslash escapes for special chars like \( \) \"
// Strip CSS backslash escapes from a raw url() value so we can build a real URL.
function unescapeCss(s) {
    return s.replace(/\\(.)/g, '$1');
}

// Match url(...) supporting quoted, unquoted, and CSS backslash escapes (e.g. \( \) \")
const CSS_URL_RE = /url\(\s*(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|((?:\\.|[^)\\\s])*))\s*\)/g;

function extractCssUrls(css, baseUrl) {
    const urls = new Set();
    let m;
    CSS_URL_RE.lastIndex = 0;
    while ((m = CSS_URL_RE.exec(css))) {
        const raw = unescapeCss((m[1] ?? m[2] ?? m[3] ?? '').trim());
        if (!raw || raw.startsWith('data:')) continue;
        const abs = absolutize(raw, baseUrl);
        if (abs && isMirrorableUrl(abs)) urls.add(abs);
    }
    // Also @import "..." or @import url(...)
    const importRe = /@import\s+(?:url\(\s*)?(['"])([^'"]+)\1/g;
    while ((m = importRe.exec(css))) {
        const abs = absolutize(m[2], baseUrl);
        if (abs && isMirrorableUrl(abs)) urls.add(abs);
    }
    return urls;
}

// Rewrite CSS so url(...) refs to the CDN become /assets/...
// Preserve any quote style; URL-encode parens in the path so we don't need CSS backslash escapes.
function rewriteCssUrls(css) {
    return css
        .replace(CSS_URL_RE, (full, q1, q2, unq) => {
            const quote = q1 !== undefined ? '"' : q2 !== undefined ? "'" : '';
            const rawRaw = (q1 ?? q2 ?? unq ?? '').trim();
            const trimmed = unescapeCss(rawRaw);
            if (!trimmed || trimmed.startsWith('data:')) return full;
            try {
                const u = new URL(trimmed, `https://${CDN_HOST}/`);
                if (u.hostname === CDN_HOST) {
                    // Build local path; encode parens so unquoted url() syntax stays valid.
                    let newPath = '/assets' + u.pathname;
                    if (!quote) {
                        newPath = newPath.replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/ /g, '%20');
                    }
                    return `url(${quote}${newPath}${quote})`;
                }
            } catch {}
            return full;
        })
        .replace(/@import\s+(url\(\s*)?(['"])([^'"]+)\2(\s*\))?/g, (full, urlOpen, q, target, urlClose) => {
            try {
                const u = new URL(target, `https://${CDN_HOST}/`);
                if (u.hostname === CDN_HOST) {
                    const newTarget = `/assets${u.pathname}`;
                    return urlOpen ? `@import url(${q}${newTarget}${q})` : `@import ${q}${newTarget}${q}`;
                }
            } catch {}
            return full;
        });
}

// Rewrite HTML so all CDN_HOST URLs become /assets/...
function rewriteHtmlUrls(html) {
    // Replace any literal occurrence of https://cdn.prod.website-files.com (with or without protocol-relative form)
    let out = html
        .replace(/https:\/\/cdn\.prod\.website-files\.com/g, '/assets')
        .replace(/\/\/cdn\.prod\.website-files\.com/g, '/assets')
        // Also rewrite inline <style> CSS url() refs that survived
        .replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (full, attrs, body) => {
            return `<style${attrs}>${rewriteCssUrls(body)}</style>`;
        });

    // Strip SRI integrity= and crossorigin= attributes from <link>/<script> tags that point at
    // local /assets/... — Webflow's hashes were computed over the original CDN bytes, and our
    // URL rewriting changes those bytes, so the browser refuses to apply CSS/JS with a hash mismatch.
    out = out.replace(/<(link|script)\b([^>]*)>/gi, (full, name, attrs) => {
        const href = attrs.match(/\b(href|src)\s*=\s*"([^"]*)"/i);
        if (!href || !href[2].startsWith('/assets/')) return full;
        const cleaned = attrs
            .replace(/\s+integrity\s*=\s*"[^"]*"/i, '')
            .replace(/\s+integrity\s*=\s*'[^']*'/i, '')
            .replace(/\s+crossorigin\s*=\s*"[^"]*"/i, '')
            .replace(/\s+crossorigin\s*=\s*'[^']*'/i, '');
        return `<${name}${cleaned}>`;
    });

    return out;
}

// Also rewrite internal page links so they work on Vercel.
// Webflow serves /contact (no .html). Our static export will be /contact/index.html, which Vercel resolves as /contact. So no rewriting needed for internal links — they already work.
// But the homepage references like href="/" stay as "/".

async function downloadAsset(url) {
    if (fetchedAssets.has(url)) return fetchedAssets.get(url);

    const localPath = cdnUrlToLocalPath(url);
    await fs.mkdir(path.dirname(localPath), { recursive: true });

    // Determine binary vs text from extension
    const ext = path.extname(localPath).toLowerCase();
    const TEXT_EXT = new Set(['.css', '.js', '.svg', '.json', '.txt', '.xml', '.html']);
    const isText = TEXT_EXT.has(ext);

    try {
        const content = await httpGet(url, { binary: !isText });
        if (isText && (ext === '.css' || ext === '.js')) {
            // For CSS: rewrite url(...) refs, and find any further CDN assets to fetch
            let body = content;
            if (ext === '.css') {
                for (const u of extractCssUrls(body, url)) assetsToFetch.add(u);
                body = rewriteCssUrls(body);
            } else {
                // For JS we mostly leave content alone, but Webflow JS may reference CDN URLs as strings.
                // Replace literal CDN host occurrences with /assets to be safe.
                body = body.replace(/https:\/\/cdn\.prod\.website-files\.com/g, '/assets');
            }
            await fs.writeFile(localPath, body, 'utf8');
        } else if (isText) {
            await fs.writeFile(localPath, content, 'utf8');
        } else {
            await fs.writeFile(localPath, content);
        }
        fetchedAssets.set(url, localPath);
        return localPath;
    } catch (e) {
        failed.push({ url, error: e.message });
        return null;
    }
}

async function processQueue(maxIter = 50) {
    let iter = 0;
    while (assetsToFetch.size > 0 && iter < maxIter) {
        iter++;
        const batch = [...assetsToFetch];
        assetsToFetch.clear();
        // Filter out already fetched
        const todo = batch.filter(u => !fetchedAssets.has(u));
        process.stdout.write(`  iter ${iter}: ${todo.length} new assets to fetch\n`);
        // Concurrency-limited
        const CONCURRENCY = 8;
        for (let i = 0; i < todo.length; i += CONCURRENCY) {
            await Promise.all(todo.slice(i, i + CONCURRENCY).map(downloadAsset));
        }
    }
}

async function main() {
    await fs.mkdir(OUT, { recursive: true });
    await fs.mkdir(ASSETS_DIR, { recursive: true });

    // PHASE 1: download every page, save raw + extract asset URLs
    const pageHtml = new Map(); // slug → raw html
    for (const { url, slug } of PAGES) {
        process.stdout.write(`[page] ${url}\n`);
        try {
            const html = await httpGet(url);
            pageHtml.set(slug, { html, baseUrl: url });
            for (const u of extractHtmlAssetUrls(html, url)) assetsToFetch.add(u);
        } catch (e) {
            process.stdout.write(`  FAILED: ${e.message}\n`);
            failed.push({ url, error: e.message });
        }
    }

    // PHASE 2: download all assets (recursively follows CSS url() refs)
    process.stdout.write(`\nQueued ${assetsToFetch.size} initial assets. Downloading...\n`);
    await processQueue();

    // PHASE 3: rewrite each page's HTML and write to public/<slug>/index.html
    for (const [slug, { html }] of pageHtml) {
        const rewritten = rewriteHtmlUrls(html);
        const outPath = slug === ''
            ? path.join(OUT, 'index.html')
            : path.join(OUT, slug, 'index.html');
        await fs.mkdir(path.dirname(outPath), { recursive: true });
        await fs.writeFile(outPath, rewritten, 'utf8');
        process.stdout.write(`[wrote] ${outPath}\n`);
    }

    // Also fetch sitemap.xml and robots.txt
    try {
        await fs.writeFile(path.join(OUT, 'sitemap.xml'), await httpGet(ORIGIN + '/sitemap.xml'), 'utf8');
    } catch (e) { process.stdout.write(`sitemap failed: ${e.message}\n`); }
    try {
        await fs.writeFile(path.join(OUT, 'robots.txt'), await httpGet(ORIGIN + '/robots.txt'), 'utf8');
    } catch (e) { process.stdout.write(`robots failed: ${e.message}\n`); }

    // Final report
    process.stdout.write(`\n=== DONE ===\n`);
    process.stdout.write(`Pages fetched: ${pageHtml.size}/${PAGES.length}\n`);
    process.stdout.write(`Assets fetched: ${fetchedAssets.size}\n`);
    process.stdout.write(`Failures: ${failed.length}\n`);
    if (failed.length > 0) {
        process.stdout.write(`\nFAILURES:\n`);
        for (const f of failed.slice(0, 50)) process.stdout.write(`  ${f.url} — ${f.error}\n`);
    }
    await fs.writeFile(path.join(__dirname, 'scrape-report.json'), JSON.stringify({
        pages: pageHtml.size,
        assets: fetchedAssets.size,
        failed,
    }, null, 2));
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
