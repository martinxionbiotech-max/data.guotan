/* ------------------------------------------------------------------ */
/* CHARCOAL HUB — data.guotan content collections.                     */
/*                                                                     */
/* Five collections, all strict zod schemas:                           */
/*   products       — supplier product records          (7 entries)    */
/*   specifications — public-standard methodology pages (8 entries)    */
/*   applications   — application taxonomy              (2 entries)    */
/*   sizes          — nominal size classes              (3 entries)    */
/*   packaging      — packaging formats                 (2 entries)    */
/*                                                                     */
/* HARD RULE: no fabricated data. A field that is not established is   */
/* left null — never estimated — and every null product field must be  */
/* explained either in pending_fields (someone still owes the value)   */
/* or in not_applicable (the field cannot exist for this product       */
/* form). The data gate enforces that coverage.                        */
/* ------------------------------------------------------------------ */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** Markdown/MDX loader rooted at a collection folder. */
const md = (dir: string) =>
  glob({ pattern: '**/*.{md,mdx}', base: `./src/content/${dir}` });

/** Field that is genuinely unknown until a supplier is verified. */
const unknown = () => z.string().min(1).nullable().default(null);
/** ISO date (YYYY-MM-DD) when a real date is known, otherwise null. */
const isoDate = () =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'expected ISO date YYYY-MM-DD')
    .nullable()
    .default(null);

/** Why a field on a record is still empty, and who owes the value. */
const pendingField = z
  .object({
    field: z.string().min(1),
    reason: z.string().min(1),
    owner: z.string().min(1).optional(),
  })
  .strict();

/** Why a field can never apply to this record's physical form. */
const notApplicable = z
  .object({
    field: z.string().min(1),
    reason: z.string().min(1),
  })
  .strict();

/* Aligned with the verification ladder used across CHARCOAL HUB. */
export const VERIFICATION_STATUSES = [
  'unverified',
  'supplier-declared',
  'document-verified',
  'third-party-tested',
  'fbo-verified',
] as const;

/* ------------------------------- products ------------------------- */
/* Section §7 field set. Every field that can be unknown is nullable.  */
const products = defineCollection({
  loader: md('products'),
  schema: z
    .object({
      product_id: z.string().min(1),
      product_name: z.string().min(1),
      /* Standalone meta description: written, not derived, so it stays
         inside the SERP limit while naming the real material and status. */
      meta_description: z.string().min(80).max(160),
      product_type: unknown(),

      application: unknown(),
      raw_material: unknown(),
      charcoal_source: unknown(),

      shape: unknown(),
      size: unknown(),
      length: unknown(),
      width: unknown(),
      height: unknown(),
      diameter: unknown(),

      ash_content: unknown(),
      moisture: unknown(),
      fixed_carbon: unknown(),
      volatile_matter: unknown(),
      burning_time: unknown(),
      ignition_time: unknown(),

      odor: unknown(),
      spark_level: unknown(),
      temperature: unknown(),
      calorific_value: unknown(),

      packaging: unknown(),
      private_label: unknown(),
      minimum_order_quantity: unknown(),
      production_capacity: unknown(),
      testing_available: unknown(),
      certifications: z.array(z.string().min(1)).nullable().default(null),

      origin: unknown(),
      manufacturer_id: unknown(),

      last_verified: isoDate(),
      data_source: unknown(),
      verification_status: z.enum(VERIFICATION_STATUSES).nullable().default(null),

      /* Every null field above is accounted for here. */
      pending_fields: z.array(pendingField).default([]),
      not_applicable: z.array(notApplicable).default([]),
    })
    .strict(),
});

/* --------------------------- specifications ----------------------- */
/* Real public-standard methodology pages. These are knowledge pages,  */
/* not supplier test data: they explain what a metric means and how it */
/* is commonly measured, with the general standard cited.              */
const specifications = defineCollection({
  loader: md('specifications'),
  schema: z
    .object({
      title: z.string().min(1),
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      description: z.string().min(1),
      metric: z.string().min(1),
      what_it_measures: z.string().min(1),
      why_it_matters: z.string().min(1),
      typical_method: z.string().min(1),
      buyer_relevance: z.string().min(1),
      limitations: z.string().min(1),
      last_updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      data_source: z.string().min(1),
    })
    .strict(),
});

/* ---------------------------- applications ------------------------ */
const applications = defineCollection({
  loader: md('applications'),
  schema: z
    .object({
      name: z.string().min(1),
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      description: z.string().min(1),
      related_raw_materials: z.array(z.string().min(1)).nullable().default(null),
      related_specifications: z.array(z.string().min(1)).nullable().default(null),
      last_updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      data_source: z.string().min(1),
    })
    .strict(),
});

/* -------------------------------- sizes --------------------------- */
const sizes = defineCollection({
  loader: md('sizes'),
  schema: z
    .object({
      name: z.string().min(1),
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      diameter_mm: z.number().positive().nullable().default(null),
      description: z.string().min(1),
      typical_products: z.array(z.string().min(1)).nullable().default(null),
      pieces_per_kg: z.number().int().positive().nullable().default(null),
      tolerance: z.string().min(1).nullable().default(null),
      last_verified: isoDate(),
      data_source: z.string().min(1),
      verification_status: z.enum(VERIFICATION_STATUSES).nullable().default(null),
      pending_fields: z.array(pendingField).default([]),
    })
    .strict(),
});

/* ------------------------------ packaging ------------------------- */
const packaging = defineCollection({
  loader: md('packaging'),
  schema: z
    .object({
      name: z.string().min(1),
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      description: z.string().min(1),
      typical_moq: z.string().min(1).nullable().default(null),
      last_verified: isoDate(),
      data_source: z.string().min(1),
      verification_status: z.enum(VERIFICATION_STATUSES).nullable().default(null),
    })
    .strict(),
});

export const collections = {
  products,
  specifications,
  applications,
  sizes,
  packaging,
};
