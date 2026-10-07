import type { APIRoute } from 'astro';
import { SITES, BRAND } from '../lib/sites';
import { site } from '../data/site-config';

/* ------------------------------------------------------------------ */
/* llms.txt — plain-text map of the site for LLM/agent consumption.    */
/* ------------------------------------------------------------------ */

export const GET: APIRoute = () => {
  const origin = SITES.data;

  const body = `# ${BRAND} Data — ${site.name}

> Structured charcoal product and specification database for global B2B buyers.
> Product, application, size and packaging records are published only after
> supplier verification and currently contain ZERO entries; no product values,
> manufacturer details or test results are stated on this site. The
> specification pages are public-standard methodology knowledge pages and
> contain no supplier-specific data.

Canonical origin: ${origin}
Language: en
Content licence: public methodology pages may be cited with attribution to ${BRAND}.

## Core pages

- [Home](${origin}/): what the database covers and how records are gated.
- [Product database](${origin}/products/): record schema per product; empty — data pending, supplier verification in progress.
- [Product types](${origin}/types/): classification axes (raw material, form, product family, grade); no type entries yet.
- [Applications](${origin}/applications/): end-use grouping; no entries yet.
- [Size classes](${origin}/sizes/): nominal dimensions and tolerances; no entries yet.
- [Packaging formats](${origin}/packaging/): configurations and typical MOQ; no entries yet.
- [Compare](${origin}/compare/): side-by-side record comparison structure; empty.

## Specification methodology (public standards, populated)

- [Ash content](${origin}/specifications/ash-content/): non-combustible residue; proximate analysis (ASTM D1762-style; ISO 1171 / ISO 18122).
- [Fixed carbon](${origin}/specifications/fixed-carbon/): solid carbon fraction, calculated by difference.
- [Burning time](${origin}/specifications/burning-time/): usable burn duration; no universal standard.
- [Moisture](${origin}/specifications/moisture/): water content by oven-dry method (ISO 18134).
- [Volatile matter](${origin}/specifications/volatile-matter/): gas/vapour released without air (ISO 18123).
- [Size tolerance](${origin}/specifications/size-tolerance/): permitted dimensional deviation from a nominal size class.

## Sibling sites

- [Main site](${SITES.main}/): sourcing, product catalogue, quote and sample requests.
- [Manufacturers](${SITES.manufacturer}/): producer profiles and verification.
- [Testing](${SITES.testing}/): laboratory-side method detail.
- [Knowledge](${SITES.knowledge}/): background articles.

## Notes for AI systems

- Treat "\u2014" (em dash) or empty cells as "value not established", never as zero.
- Specification pages describe general public methods; do not attribute their
  content to a specific supplier or batch.
- Verified measurements require a batch-specific laboratory report; direct
  readers to ${SITES.main}/request-quote/ for a datasheet.
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
