// SEO helpers: the sitewide JSON-LD entity graph plus per-page builders
// (breadcrumbs, Course, FAQPage). All URLs are absolutized against the site
// origin so the @id graph stays internally consistent.
//
// The entity graph uses stable @id anchors so nodes reference each other:
//   #organization  <- publisher of the website, provider of the course
//   #website
//   #person        <- Bill Fanter, founder of the org + course instructor
import { SITE, ORGANIZATION, PERSON } from '../data/site';

const ORIGIN = SITE.url.replace(/\/$/, '');

/** Absolutize a path or URL against the site origin. */
export function abs(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return ORIGIN + (pathOrUrl.startsWith('/') ? pathOrUrl : '/' + pathOrUrl);
}

export const ORG_ID = `${ORIGIN}/#organization`;
export const WEBSITE_ID = `${ORIGIN}/#website`;
export const PERSON_ID = `${ORIGIN}/#person`;

/**
 * Sitewide entity graph: Organization, WebSite, Person. Injected on every page
 * so search engines and AI crawlers resolve a single connected entity.
 */
export function entityGraph(): object[] {
  const org: Record<string, unknown> = {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: ORGANIZATION.name,
    legalName: ORGANIZATION.legalName,
    url: ORIGIN,
    email: ORGANIZATION.email,
    logo: {
      '@type': 'ImageObject',
      '@id': `${ORIGIN}/#logo`,
      url: abs(ORGANIZATION.logo),
    },
    image: { '@id': `${ORIGIN}/#logo` },
    slogan: SITE.tagline,
    founder: { '@id': PERSON_ID },
    address: {
      '@type': 'PostalAddress',
      addressLocality: ORGANIZATION.addressLocality,
      addressRegion: ORGANIZATION.addressRegion,
      addressCountry: ORGANIZATION.addressCountry,
      ...(ORGANIZATION.streetAddress ? { streetAddress: ORGANIZATION.streetAddress } : {}),
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: ORGANIZATION.email,
      contactType: 'customer support',
    },
  };

  const website = {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: ORIGIN,
    name: SITE.name,
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-US',
  };

  const person = {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: PERSON.name,
    jobTitle: PERSON.jobTitle,
    description: PERSON.description,
    image: abs(PERSON.image),
    url: `${ORIGIN}/about`,
    worksFor: { '@id': ORG_ID },
    knowsAbout: [...PERSON.knowsAbout],
    sameAs: [...PERSON.sameAs],
  };

  return [org, website, person];
}

const SEGMENT_LABELS: Record<string, string> = {
  about: 'About',
  blog: 'Blog',
  booking: 'Book a Call',
  community: 'Community',
  contact: 'Contact',
  'free-watchlist': 'Free Watchlist',
  guide: 'Guide',
  masterclass: 'Masterclass',
  'privacy-policy': 'Privacy Policy',
  'refund-policy': 'Refund Policy',
  'student-comments': 'Student Reviews',
  'terms-conditions': 'Terms and Conditions',
  training: 'Training',
  'watch-webinar': 'Watch the Webinar',
  'watchlist-confirmed': 'Watchlist Confirmed',
  webinar: 'Webinar',
};

function labelFor(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  return segment
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * BreadcrumbList for a page. Returns null on the homepage (no breadcrumb).
 * Builds Home > Segment > Segment from the URL path.
 */
export function breadcrumbList(pathname: string): object | null {
  const clean = pathname.replace(/\/+$/, '').replace(/^\/+/, '');
  if (!clean) return null;
  const segments = clean.split('/');
  const items = [{ name: 'Home', url: ORIGIN }];
  let acc = '';
  for (const seg of segments) {
    acc += '/' + seg;
    items.push({ name: labelFor(seg), url: ORIGIN + acc });
  }
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/** Course node for the masterclass page. Provider + instructor reference the graph. */
export function courseSchema(opts: {
  name: string;
  description: string;
  url: string;
  workload?: string; // ISO 8601 duration, e.g. PT12H
}): object {
  return {
    '@type': 'Course',
    name: opts.name,
    description: opts.description,
    url: abs(opts.url),
    provider: { '@id': ORG_ID },
    inLanguage: 'en-US',
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Online',
      ...(opts.workload ? { courseWorkload: opts.workload } : {}),
      instructor: { '@id': PERSON_ID },
    },
    offers: {
      '@type': 'Offer',
      category: 'Paid',
      availability: 'https://schema.org/InStock',
      url: abs(opts.url),
    },
  };
}

/**
 * BlogPosting node for a blog article. Author/publisher reference the entity
 * graph so the post inherits Bill's E-E-A-T signals.
 */
export function blogPostingSchema(opts: {
  title: string;
  description: string;
  url: string;
  datePublished: Date;
  dateModified?: Date;
  image?: string;
}): object {
  return {
    '@type': 'BlogPosting',
    headline: opts.title,
    description: opts.description,
    url: abs(opts.url),
    mainEntityOfPage: abs(opts.url),
    datePublished: opts.datePublished.toISOString(),
    dateModified: (opts.dateModified ?? opts.datePublished).toISOString(),
    author: { '@id': PERSON_ID },
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-US',
    ...(opts.image ? { image: abs(opts.image) } : {}),
  };
}

/**
 * VideoObject node for the YouTube video a blog post is built around. Points
 * search engines at the video so the post can earn a video rich result and
 * funnel viewers to the channel.
 */
export function videoObjectSchema(opts: {
  videoId: string;
  name: string;
  description: string;
  uploadDate: Date;
}): object {
  return {
    '@type': 'VideoObject',
    name: opts.name,
    description: opts.description,
    thumbnailUrl: `https://i.ytimg.com/vi/${opts.videoId}/hqdefault.jpg`,
    uploadDate: opts.uploadDate.toISOString(),
    contentUrl: `https://www.youtube.com/watch?v=${opts.videoId}`,
    embedUrl: `https://www.youtube.com/embed/${opts.videoId}`,
    author: { '@id': PERSON_ID },
  };
}

/** FAQPage node from on-page question/answer pairs (text must match the visible page). */
export function faqSchema(faqs: { q: string; a: string }[]): object {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };
}
