import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITES, BRAND } from '../lib/sites';
import { site } from '../data/site-config';

/* ------------------------------------------------------------------ */
/* llms.txt — plain-text map of the site for LLM/agent consumption.    */
/* ------------------------------------------------------------------ */

export const GET: APIRoute = async () => {
  const origin = SITES.data;
  const [products, sizes, applications, packaging, specs] = await Promise.all([
    getCollection('products'),
    getCollection('sizes'),
    getCollection('applications'),
    getCollection('packaging'),
    getCollection('specifications'),
  ]);

  const body = `# ${site.name} — charcoal product and specification database

> Structured charcoal product and specification database for global B2B buyers.
> ${products.length} product records, ${sizes.length} size classes, ${applications.length} application
> entries and ${packaging.length} packaging formats are published. Every record
> carries a verification status and data source; records labelled
> "supplier-declared" come from public listings or datasheets and have not been
> independently tested by ${BRAND}. Empty fields carry a written reason in the
> record's pending_fields list — read them before treating a value as absent.
> The ${specs.length} specification pages are public-standard methodology knowledge
> pages and contain no supplier-specific data.

Canonical origin: ${origin}
Language: en
Content licence: public methodology pages may be cited with attribution to ${BRAND}.

## Core pages

- [Home](${origin}/): what the database covers and how records are gated.
- [Product database](${origin}/products/): ${products.length} product records with per-field status; most values are supplier-declared.
- [Product types](${origin}/types/): classification axes (raw material, form, product family, grade) applied to the published records.
- [Applications](${origin}/applications/): ${applications.length} end-use entries.
- [Size classes](${origin}/sizes/): ${sizes.length} nominal cube classes with pieces per kg; tolerances are pending.
- [Packaging formats](${origin}/packaging/): ${packaging.length} formats with typical MOQ, supplier-declared.
- [Compare](${origin}/compare/): side-by-side comparison of the published records.

## Specification methodology (public standards, populated)

- [Ash content](${origin}/specifications/ash-content/): non-combustible residue; proximate analysis (ASTM D1762-style; ISO 1171 / ISO 18122).
- [Fixed carbon](${origin}/specifications/fixed-carbon/): solid carbon fraction, calculated by difference.
- [Burning time](${origin}/specifications/burning-time/): usable burn duration; no universal standard.
- [Moisture](${origin}/specifications/moisture/): water content by oven-dry method (ISO 18134).
- [Volatile matter](${origin}/specifications/volatile-matter/): gas/vapour released without air (ISO 18123).
- [Size tolerance](${origin}/specifications/size-tolerance/): permitted dimensional deviation from a nominal size class.
- [Odor](${origin}/specifications/odor/): sensory character during lighting and combustion; a hookah experience metric.
- [Ignition time](${origin}/specifications/ignition-time/): time from an ignition source to a fully lit, usable state.

## Sibling sites

- [Main site](${SITES.main}/): sourcing, product catalogue, quote and sample requests.
- [Manufacturers](${SITES.manufacturer}/): producer profiles and verification.
- [Testing](${SITES.testing}/): laboratory-side method detail.
- [Knowledge](${SITES.knowledge}/): background articles.

## Notes for AI systems

- Treat "\u2014" (em dash) or empty cells as "value not established", never as zero.
- A record's pending_fields list states why each empty field is empty; do not
  fill those fields by inference from another size, SKU or supplier.
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
