/* ------------------------------------------------------------------ */
/* CHARCOAL HUB — per-site config: name, nav, footer, description.     */
/* data.guotan -> the structured charcoal product/specification DB.    */
/* ------------------------------------------------------------------ */
import { SITES } from '../lib/sites';

export type NavItem = { label: string; href: string; external?: boolean };

export type SiteConfig = {
  siteKey: 'main' | 'data' | 'manufacturer' | 'testing' | 'knowledge';
  name: string;
  shortName: string;
  description: string;
  nav: NavItem[];
  footerCols: { title: string; links: NavItem[] }[];
};

const ext = (label: string, href: string): NavItem => ({
  label,
  href,
  external: true,
});

export const site: SiteConfig = {
  siteKey: 'data',
  name: 'Charcoal Hub Data',
  shortName: 'Data',
  description:
    'Structured charcoal product and specification database: product records, size classes, packaging formats, applications and public-standard test methodology for global B2B buyers.',
  nav: [
    { label: 'Products', href: '/products/' },
    { label: 'Types', href: '/types/' },
    { label: 'Applications', href: '/applications/' },
    { label: 'Specifications', href: '/specifications/' },
    { label: 'Sizes', href: '/sizes/' },
    { label: 'Packaging', href: '/packaging/' },
    { label: 'Compare', href: '/compare/' },
  ],
  footerCols: [
    {
      title: 'Database',
      links: [
        { label: 'Product records', href: '/products/' },
        { label: 'Product types', href: '/types/' },
        { label: 'Applications', href: '/applications/' },
        { label: 'Size classes', href: '/sizes/' },
        { label: 'Packaging', href: '/packaging/' },
        { label: 'Compare', href: '/compare/' },
      ],
    },
    {
      title: 'Specification methodology',
      links: [
        { label: 'All specifications', href: '/specifications/' },
        { label: 'Ash content', href: '/specifications/ash-content/' },
        { label: 'Fixed carbon', href: '/specifications/fixed-carbon/' },
        { label: 'Burning time', href: '/specifications/burning-time/' },
        { label: 'Moisture', href: '/specifications/moisture/' },
        { label: 'Volatile matter', href: '/specifications/volatile-matter/' },
        { label: 'Size tolerance', href: '/specifications/size-tolerance/' },
      ],
    },
    {
      title: 'Charcoal Hub',
      links: [
        ext('Product catalogue', `${SITES.main}/products/`),
        {
          label: 'Coconut shell charcoal',
          href: `${SITES.main}/products/coconut-shell-charcoal/`,
          external: true,
        },
        ext('Request a Quote', `${SITES.main}/request-quote/`),
        ext('Request Samples', `${SITES.main}/request-sample/`),
        ext('Testing & methodology', `${SITES.testing}/tests/ash-content/`),
        ext('Manufacturer directory', `${SITES.manufacturer}/`),
        ext('Knowledge base', `${SITES.knowledge}/`),
      ],
    },
    {
      title: 'Sibling sub-sites',
      links: [
        ext(SITES.main.replace(/^https?:\/\//, ''), `${SITES.main}/`),
        ext(SITES.data.replace(/^https?:\/\//, ''), `${SITES.data}/`),
        ext(SITES.manufacturer.replace(/^https?:\/\//, ''), `${SITES.manufacturer}/`),
        ext(SITES.testing.replace(/^https?:\/\//, ''), `${SITES.testing}/`),
        ext(SITES.knowledge.replace(/^https?:\/\//, ''), `${SITES.knowledge}/`),
      ],
    },
  ],
};

export default site;
