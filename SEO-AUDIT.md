# Technical SEO Audit and Foundation: billfanter.com

Pass 1, June 19 2026. Run by WRKS Online. Scope: technical foundation only.
Content strategy and keyword work come next, after this foundation is signed off.

Stack: Astro 5 static build on Vercel, React islands, `@astrojs/sitemap`.
Standard applied: the WRKS house SEO framework (entity graph, GEO, CWV) plus the
comprehensive and technical SEO skill criteria.

## What was already solid

- Clean meta baseline in `BaseLayout.astro`: title, description, canonical, Open
  Graph, Twitter card.
- Canonical URLs resolve correctly: www, no trailing slash, matching the config.
- One H1 per page (verified across home, about, masterclass, community, watchlist).
- Full image alt coverage on the homepage.
- GA4 and Meta Pixel both fire. Favicon and apple-touch icon present.
- Redirects are real 301s at the Vercel edge with Astro meta-refresh fallbacks
  that carry noindex and a canonical to the target. No redirect chains.
- Money-page titles and descriptions are well written and keyword aligned.

## What shipped in this pass

### Structured data (JSON-LD entity graph)
- New `src/data/site.ts`: single source of truth for entity data, pulled verbatim
  from the live site (footer, /about, /contact, /masterclass). No invented values.
- New `src/lib/seo.ts`: builds the sitewide `@graph` and per-page nodes.
- Sitewide on every page: Organization (Options Action LLC), WebSite, Person
  (Bill Fanter) with his real social profiles in `sameAs`. Nodes cross-reference
  by `@id` so engines resolve one connected entity.
- BreadcrumbList on every subpage, generated from the URL path.
- `/masterclass`: Course (with CourseInstance and Offer) plus a 14-item FAQPage.
  FAQ copy renders from one shared file (`src/data/masterclass.ts`) so the visible
  accordion and the schema can never drift. Google requires that match.
- Validated: every page emits a single valid JSON-LD block that parses cleanly.

### Indexation control
- `noindex, follow` on the funnel and confirmation pages: /booking, /guide,
  /training, /watch-webinar, /watchlist-confirmed. Set through a clean `noindex`
  prop on `BaseLayout`, which also removed a duplicate, conflicting robots tag
  these pages were emitting before.
- All five pages are now excluded from the sitemap as well.
- Every indexable page emits `index, follow` with `max-image-preview:large`,
  `max-snippet:-1`, `max-video-preview:-1`.

### Crawl and AI access
- `robots.txt` rewritten GEO-first: search and AI crawlers welcomed, with major
  AI agents named explicitly (GPTBot, ClaudeBot, PerplexityBot, Google-Extended,
  and more). Nothing is disallowed, since noindex handles the funnel pages.
- New `llms.txt`: a clean map of Bill, the offers, and the key pages for AI search.

### Sitemap
- Now stamps `lastmod` (build date) plus `changefreq` and `priority` per page.
  Home 1.0, money pages 0.9, content 0.7, legal 0.3.

### Performance and headers
- Google Fonts stylesheet now loads without blocking first paint (print-media swap
  with a noscript fallback). Removes a render-blocking request on every page.
- Security headers added in `vercel.json`: HSTS with preload, X-Content-Type-Options,
  X-Frame-Options, Referrer-Policy, X-DNS-Prefetch-Control, Permissions-Policy.
  Permissions-Policy is scoped so it does not block the Vimeo video iframe.

### Other
- Open Graph: og:site_name, og:locale, absolute og:image, per-page og:type.
- theme-color meta tag.
- Branded 404 page (`src/pages/404.astro`), noindex, with links to the key pages.
- Google and Bing site-verification slots in `site.ts`. Dormant until a token is
  pasted, then they render sitewide.

## Owner-blocked items (need Bill or a real value to activate)

These have config slots ready. Paste the value and it activates with no code work.

1. Google Search Console verification token. Paste into `SITE.verification.google`
   in `src/data/site.ts`. Unlocks impressions, queries, coverage, crawl monitoring.
2. Bing verification token. Same file, `SITE.verification.bing`.
3. Street address. `ORGANIZATION.streetAddress` in `site.ts`. Currently the schema
   claims Las Vegas, NV only, which matches what the site publishes.
4. A true logo file. `ORGANIZATION.logo` currently points at the apple-touch icon,
   the best square mark available. Swap for a real logo when one exists.

## Content changes and flags for QA

Done this pass:
- Dialed back "AI trading signals" as a keyword. Removed it from the homepage and
  community meta descriptions, the homepage Community step, and the community page
  hero, member benefit, and "how it works" heading and image alt. Replaced with
  accurate language (live trade alerts, daily market analysis), which matches the
  on-page copy that the alerts come from Bill and his market analysts.
  - Still open: the image file
    `68554a2036b038d602bb26ec_Learn-from-...-AI-Signals-(3).png` has "AI Signals" in
    the artwork and filename. Re-export the graphic if you want AI gone visually too.

Still needs your decision:
1. Student-count claims are inconsistent across pages: "1,600+" on the masterclass
   hero, "800+" in the masterclass bento tag, "1,200+" on the webinar page. Pick the
   true number and we standardize it sitewide.
2. The community page claims "Live buy/sell signals with an 80%+ win rate" and an
   "80%+ daily win rate." A specific performance number like that is a compliance
   risk on a trading site, even with the disclaimer. Confirm it is documented and
   defensible, or soften it.

## Next steps before the content phase

1. Push to production. The build is clean and verified locally. Vercel auto-deploys
   from `main`.
2. Verify Google Search Console and submit `sitemap-index.xml`.
3. Measure Core Web Vitals on the live site (PageSpeed Insights or Lighthouse).
   The font change should help LCP. The heavy WebGL background islands
   (three.js, ogl) are the next thing to measure for INP and main-thread cost.
4. Validate the schema in the Google Rich Results Test once live.

## Verification done in this pass

- `npm run build` passes clean (18 pages).
- JSON-LD parses as valid on home, masterclass, about, and 404.
- Funnel pages emit exactly one `noindex, follow` tag each.
- /webinar and other money pages emit `index, follow`.
- Sitemap lists the 12 indexable pages with lastmod and priority; funnel pages
  excluded.
- robots.txt and llms.txt present in the build output.

## Pass 2: deep technical audit (images, accessibility, linking, code)

Ran a full analysis over the built output: 18 pages, 362 images, heading order,
internal link graph, asset weight, and accessibility signals.

### Done in this pass
- LCP: removed lazy loading from the above-the-fold hero images on /webinar,
  /free-watchlist, and /community and set `fetchpriority="high"`. The homepage and
  masterclass heroes were already eager.
- Fixed a heading-level skip on /about (h1 jumped to h3; the bio heading is now h2).
- Compliance: dropped the "80%+ win rate" feature claim, removed three testimonials
  with specific earnings or win-rate numbers ("15% in 3 days", "86% win rate",
  "$10k week"), trimmed one testimonial to its qualitative part, and softened
  "6-figure income stream" in Bill's bio to "my own trading income."
- Dialed back "AI" as a keyword while keeping it as one real community feature.

### Confirmed strong
- 362 images, 100% carry alt text. Decorative images use empty alt correctly.
- Landmarks present (main, footer), html lang set, focus styles present,
  prefers-reduced-motion respected in the animation scripts.
- One H1 per page on all 18 pages, no heading skips after the /about fix.
- Internal linking is healthy: every indexable page has 15 or more inbound internal
  links through the footer. The only zero-inbound pages are the noindexed funnel
  pages, which is correct. No problem orphans.
- Money-page meta descriptions run 140 to 167 characters.

### Open items, ranked by speed-test impact (need tooling or live measurement)

1. Image weight is the biggest lever. 11 images are over 500 KB, 35 over 200 KB,
   and 234 of the rasters are PNG. Worst: webinar-distortion.png 1.8 MB, a Discord
   screenshot 1.7 MB, a Gemini-generated image 1.1 MB, watchlist cutouts and
   bf-youtube-channel.jpg in the 600 to 900 KB range. Fix: compress and convert to
   WebP or AVIF. They live in /public referenced by filename, so conversion means
   updating references too. Best done as a focused task guided by the live LCP
   element on each page.
2. CLS: none of the 362 images carry width and height. Many sit in fixed-size CSS
   containers and will not shift, so blind edits risk breaking layout. Measure the
   live CLS number, then add width/height or aspect-ratio only where a shift shows.
3. JavaScript weight: about 950 KB across the islands, with GridDistortion alone at
   489 KB (three.js). Heavy for INP. Options: mount it only when it scrolls into
   view, or drop it where the effect is decorative. Measure INP live first.
4. Inline CSS ships on every page at about 112 KB. It avoids a request but cannot be
   cached across pages. Optional: move to a cached external stylesheet.
5. Minor a11y: add a skip-to-content link. The footer already carries every link, so
   crawl and keyboard access work today.

### Needs a human (cannot fix in code)
- The community screenshot wall (WhatsApp and Discord images) may show P&L or
  win-rate claims inside the images. Review and swap any that show specific results.

## Pass 3: independent cross-check (SEO Audit CLI, 251 rules / 20 categories)

Ran a second, independent audit against a different framework (the 251-rule, 20-category
rubric) blind to passes 1 and 2, then verified each finding before acting.

### New findings it surfaced, now fixed
- /blog was a thin "coming soon" placeholder but indexable and in the sitemap.
  Set noindex and removed it from the sitemap. Flip both back when posts ship.
- The reusable SubscribeForm (used on /webinar and /free-watchlist) had
  placeholder-only inputs with no label or aria-label. Added aria-label to the
  name and email inputs. The contact form already had real labels.

### Extra hardening done in this pass
- Added a skip-to-content link sitewide (accessibility).
- Added og:image:alt.
- Removed a stale example-markup comment from the inlined design-system CSS (see
  the false positive below).

### Findings checked and rejected (false positives)
- "Duplicate element IDs (bf-vreel-modal)." Not real. The second occurrence was an
  example HTML snippet inside a CSS comment in the inlined stylesheet. Text inside
  a style element is not DOM, so there was only ever one real modal. Cleaned the
  comment anyway so it stops tripping grep-based auditors.
- "Dead 500KB GridDistortion.js bundle." Not dead. It is dynamically imported by
  the Islands loader (so it has no static HTML reference) and it is used on the
  homepage and masterclass. Real refinement: the import is unconditional, so the
  bundle downloads on every page even where no distortion element exists. Worth
  making conditional later, but it is not dead code.
- "Not financial advice only on the webinar page." Not true. The full financial
  disclaimer ships in the footer on all 16 pages.

### Agreement between both audits (high confidence)
Image weight and missing width/height (CLS), LCP image handling, JS payload size,
clean internal linking with no problem orphans, security headers, the structured
data graph, redirects, robots/GEO, llms.txt, E-E-A-T, single H1 per page, and
100% alt coverage. The Course offer missing a price is a known gated-pricing
tradeoff (no public price to publish).

### Still open (unchanged, need tooling or live data)
Image compression and next-gen conversion, image width/height for CLS, the
GridDistortion conditional-load optimization, and the Course offer price. Best
tuned against the live PageSpeed run.
