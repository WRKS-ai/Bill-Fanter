/**
 * Data model for `src/pages/guide/*.astro` — pre-call/booking-confirmation pages.
 *
 * These pages are end-of-funnel: a prospect just booked a discovery call (via
 * GoHighLevel calendar) and lands here with `?name=&start=&end=&loc=&tz=`
 * URL params. The page does NOT have a lead-capture form — submissions live
 * upstream in /catalyst/* and /vsl/*. The two pieces of behavior here are:
 *
 *   1. Render the prospect's name + booked time from URL params (`script is:inline`).
 *   2. Generate add-to-calendar links (Google / iCal / Outlook) from those params.
 *
 * Both behaviors are owned by `GuideLayout.astro` — no per-vertical wiring
 * needed beyond a single "audience noun" used inside the iCal description
 * ("your business goals" vs "your firm goals").
 *
 * All five guides are `noindex,nofollow`. They are linked from booking
 * confirmation redirects, never crawled.
 *
 * Note on `metaPixel`: only `law-firms` fires the Meta conversion pixel. The
 * twin variant `law-firms-entry` is for unqualified leads and intentionally
 * skips the pixel to keep Meta's optimization signal clean.
 */

export type Guide = {
  // ── Meta ──
  slug: string;
  title: string;
  description: string;
  /** When true, includes the Meta Pixel head snippet + noscript img. */
  metaPixel: boolean;

  // ── Case study tile (Claxton Law) — stat figures vary by vertical ──
  /** e.g. "9,000+ cases closed" (law) or "9,000+ clients closed" (non-law). */
  caseStudyStatFig: string;
  /** e.g. "With the AI Case Acquisition Agent" or "With the AI Client Acquisition Agent". */
  caseStudyStatDesc: string;

  // ── "What we'll cover" section ──
  /** Used inside the cover-sub copy: "talk about ${coverAudienceNoun}". */
  coverAudienceNoun: string;
  /** Exactly 4 bullet items in display order. */
  coverItems: [string, string, string, string];

  // ── BLAS V3 slider ──
  /** Sub paragraph: "...AI Growth Agents built specifically for ${blasAudience}." */
  blasAudience: string;
  /** Per-phase H3 markup. May contain <em>. */
  blasBuildH3Html: string;
  blasLaunchH3Html: string;
  blasAdaptH3Html: string;
  blasScaleH3Html: string;

  // ── iCal description suffix ──
  /** Inserted into "Come prepared with ${calendarAudience} goals and questions." */
  calendarAudience: string;
};

// ──────────────────────────────────────────────────────────────────────
// Shared fragments
// ──────────────────────────────────────────────────────────────────────

/** Claxton case study tile stat for non-law verticals. */
const NON_LAW_CASE_STAT_FIG = '9,000+ clients closed';
const NON_LAW_CASE_STAT_DESC = 'With the AI Client Acquisition Agent';

// ──────────────────────────────────────────────────────────────────────
// Per-vertical entries
// ──────────────────────────────────────────────────────────────────────

export const GUIDES: Record<string, Guide> = {
  // ════════════════════════════════════════════════════════════════════
  landscaping: {
    slug: 'landscaping',
    title: 'Pre-Call Guide for Landscaping Companies | WRKS Online',
    description:
      'Your pre-call guide. What to expect on the call and how our team of AI Growth Agents fills your contract pipeline.',
    metaPixel: false,
    caseStudyStatFig: NON_LAW_CASE_STAT_FIG,
    caseStudyStatDesc: NON_LAW_CASE_STAT_DESC,
    coverAudienceNoun: 'your business',
    coverItems: [
      'How our AI growth system can automate your pipeline and generate qualified landscaping leads on repeat',
      "The exact funnel we'd build and run for your landscaping business automatically, one you should be running right now to start scaling your client base",
      'Why agentic marketing is infinitely better than regular landscaping marketing now that AI has become so advanced',
      'The specific next steps to start AI growth marketing for your landscaping business',
    ],
    blasAudience: 'landscaping companies',
    blasBuildH3Html: 'The agents build your contract pipeline <em>before launch.</em>',
    blasLaunchH3Html:
      'The agents activate every channel at once <em>and start booking estimates from day one.</em>',
    blasAdaptH3Html:
      'The agents find the contracts that close <em>and shift budget in real time.</em>',
    blasScaleH3Html:
      'The agents double down on profitable service lines <em>as winning campaigns start to scale.</em>',
    calendarAudience: 'your business',
  },

  // ════════════════════════════════════════════════════════════════════
  'law-firms': {
    slug: 'law-firms',
    title: 'Pre-Call Guide for Law Firms | WRKS Online',
    description:
      'Your pre-call guide. What to expect on the call and how we use the AI Case Acquisition Agent to deliver new cases.',
    metaPixel: true,
    caseStudyStatFig: '9,000+ cases closed',
    caseStudyStatDesc: 'With the AI Case Acquisition Agent',
    coverAudienceNoun: 'your firm',
    coverItems: [
      'How our AI growth system can automate your case intake pipeline and generate qualified leads on repeat',
      "The exact funnel we'd build and run for your firm automatically, one you should be running right now to start scaling your caseload",
      'Why agentic marketing is infinitely better than regular law firm marketing now that AI has become so advanced',
      'The specific next steps to start AI growth marketing for your firm',
    ],
    blasAudience: 'law firms',
    blasBuildH3Html:
      'The agents build and connect your entire intake system <em>before launch.</em>',
    blasLaunchH3Html:
      'The agents activate every channel at once <em>and start learning from the first qualified case.</em>',
    blasAdaptH3Html:
      'The agents find the case types that convert <em>and shift budget in real time.</em>',
    blasScaleH3Html:
      'The agents double down on profitable case types <em>as winning campaigns start to scale.</em>',
    calendarAudience: 'your firm',
  },

  // ════════════════════════════════════════════════════════════════════
  // Identical to law-firms above except metaPixel is OFF: this variant is
  // for unqualified leads, so the Meta conversion event is suppressed to
  // keep ad-optimization signal clean.
  'law-firms-entry': {
    slug: 'law-firms-entry',
    title: 'Pre-Call Guide for Law Firms | WRKS Online',
    description:
      'Your pre-call guide. What to expect on the call and how we use the AI Case Acquisition Agent to deliver new cases.',
    metaPixel: false,
    caseStudyStatFig: '9,000+ cases closed',
    caseStudyStatDesc: 'With the AI Case Acquisition Agent',
    coverAudienceNoun: 'your firm',
    coverItems: [
      'How our AI growth system can automate your case intake pipeline and generate qualified leads on repeat',
      "The exact funnel we'd build and run for your firm automatically, one you should be running right now to start scaling your caseload",
      'Why agentic marketing is infinitely better than regular law firm marketing now that AI has become so advanced',
      'The specific next steps to start AI growth marketing for your firm',
    ],
    blasAudience: 'law firms',
    blasBuildH3Html:
      'The agents build and connect your entire intake system <em>before launch.</em>',
    blasLaunchH3Html:
      'The agents activate every channel at once <em>and start learning from the first qualified case.</em>',
    blasAdaptH3Html:
      'The agents find the case types that convert <em>and shift budget in real time.</em>',
    blasScaleH3Html:
      'The agents double down on profitable case types <em>as winning campaigns start to scale.</em>',
    calendarAudience: 'your firm',
  },

  // ════════════════════════════════════════════════════════════════════
  roofing: {
    slug: 'roofing',
    title: 'Pre-Call Guide for Roofing Companies | WRKS Online',
    description:
      'Your pre-call guide. What to expect on the call and how our team of AI Growth Agents fills your roofing job pipeline.',
    metaPixel: false,
    caseStudyStatFig: NON_LAW_CASE_STAT_FIG,
    caseStudyStatDesc: NON_LAW_CASE_STAT_DESC,
    coverAudienceNoun: 'your business',
    coverItems: [
      'How our AI growth system can automate your pipeline and generate qualified roofing leads on repeat',
      "The exact funnel we'd build and run for your roofing company automatically, one you should be running right now to start scaling your jobs",
      'Why agentic marketing is infinitely better than regular roofing marketing now that AI has become so advanced',
      'The specific next steps to start AI growth marketing for your roofing company',
    ],
    blasAudience: 'roofing companies',
    blasBuildH3Html: 'The agents build your job pipeline <em>before launch.</em>',
    blasLaunchH3Html:
      'The agents activate every channel at once <em>and start learning from the first inspection booked.</em>',
    blasAdaptH3Html:
      'The agents find the jobs that close <em>and shift budget in real time.</em>',
    blasScaleH3Html:
      'The agents double down on profitable storm zones <em>as winning campaigns start to scale.</em>',
    calendarAudience: 'your business',
  },

  // ════════════════════════════════════════════════════════════════════
  solar: {
    slug: 'solar',
    title: 'Pre-Call Guide for Solar Companies | WRKS Online',
    description:
      'Your pre-call guide. What to expect on the call and how our team of AI Growth Agents fills your install pipeline.',
    metaPixel: false,
    caseStudyStatFig: NON_LAW_CASE_STAT_FIG,
    caseStudyStatDesc: NON_LAW_CASE_STAT_DESC,
    coverAudienceNoun: 'your business',
    coverItems: [
      'How our AI growth system can automate your pipeline and generate qualified solar leads on repeat',
      "The exact funnel we'd build and run for your solar business automatically, one you should be running right now to start scaling your installations",
      'Why agentic marketing is infinitely better than regular solar marketing now that AI has become so advanced',
      'The specific next steps to start AI growth marketing for your solar business',
    ],
    blasAudience: 'solar companies',
    blasBuildH3Html: 'The agents build your install pipeline <em>before launch.</em>',
    blasLaunchH3Html:
      'The agents activate every channel at once <em>and start qualifying homeowners from day one.</em>',
    blasAdaptH3Html:
      'The agents find the appointments that close <em>and shift budget in real time.</em>',
    blasScaleH3Html:
      'The agents double down on profitable territories <em>as winning campaigns start to scale.</em>',
    calendarAudience: 'your business',
  },
};
