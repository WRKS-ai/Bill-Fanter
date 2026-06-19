// Canonical site + entity data. Single source of truth for SEO metadata and the
// JSON-LD entity graph (Organization, WebSite, Person). Every field here is
// pulled VERBATIM from the live Bill Fanter site (footer, /about, /contact,
// /masterclass). No invented values. Owner-blocked fields are left empty and
// activate the moment a real value is pasted in.
//
// Edited by: WRKS Online. Keep ASCII-only (Quill OS): no em dashes, no smart
// quotes, no Unicode punctuation in any string that can reach the page.

export const SITE = {
  url: 'https://www.billfanter.com',
  name: 'Bill Fanter',
  // Short brand tagline (footer). Used as the Organization slogan + OG site name.
  tagline: 'Learn options trading and trade with confidence.',
  // Default social/OG share image (Webflow export, in /public/assets).
  ogImage: '/assets/664a5b263659c7265be280ad/664d79eba5d00231744cc9dd_opengraph.webp',
  // Members / login portal (footer link).
  membersUrl: 'https://members.billfanter.com',
  // Search engine verification tokens. Paste the token and it renders sitewide.
  // Google Search Console: Settings -> Ownership verification -> HTML tag.
  verification: {
    google: '', // owner-blocked: paste the google-site-verification token
    bing: '', // owner-blocked: paste the msvalidate.01 token
  },
} as const;

// The legal entity that owns the site (footer copyright line).
export const ORGANIZATION = {
  legalName: 'Options Action LLC',
  // Public-facing brand name.
  name: 'Bill Fanter',
  email: 'options@billfanter.com',
  // City + region only. No street address is published on the site, so none is
  // claimed here (NAP accuracy). Paste a street address to enrich the schema.
  addressLocality: 'Las Vegas',
  addressRegion: 'NV',
  addressCountry: 'US',
  streetAddress: '', // owner-blocked: paste when available
  // Best available square brand mark (Webflow apple-touch icon). Replace with a
  // true logo file when one exists.
  logo: '/assets/664a5b263659c7265be280ad/664a5e3329fdb2d59df709e3_Webclip.jpg',
} as const;

// Bill Fanter, the person. Carries the social profiles (his accounts) for the
// sameAs entity graph. Bio facts are taken from /about and /contact verbatim.
export const PERSON = {
  name: 'Bill Fanter',
  jobTitle: 'Options Trader and Educator',
  // Factual one-line bio. Quill OS clean: active voice, no banned words.
  description:
    'Bill Fanter is an options trader and educator with 35 years in banking and the markets. He teaches a proven system for trading options and shows you how to spot setups, size risk, and place trades you understand.',
  image: '/assets/664a5b263659c7265be280ad/664c28db6c354e4acb60d5b7_masterclass%20image-13.webp',
  knowsAbout: [
    'Options trading',
    'Stock options',
    'Risk management',
    'Technical analysis',
    'Trading psychology',
  ],
  // Bill's profiles (footer). These belong to the Person, not the company.
  sameAs: [
    'https://www.facebook.com/bill.fanter/',
    'https://www.instagram.com/billfanter/',
    'https://www.youtube.com/@BillFanter',
    'https://www.linkedin.com/in/billfanter/',
  ],
} as const;
