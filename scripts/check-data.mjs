#!/usr/bin/env node
/* ------------------------------------------------------------------ */
/* check-data.mjs — data quality gate for content collections.         */
/*                                                                     */
/* Where a site defines collections (src/content/), validates:         */
/*   - duplicate IDs across a collection                               */
/*   - broken internal references (manufacturer_id)                    */
/*   - provenance, by collection kind:                                 */
/*       knowledge  -> data_source, last_updated                       */
/*       taxonomy   -> data_source, last_updated                       */
/*       record     -> data_source, verification_status, last_verified */
/*   - product/size records: every null content field must be          */
/*     explained in pending_fields (someone owes the value) or          */
/*     not_applicable (the field cannot exist for this form). Empty    */
/*     is never allowed to mean "we did not get round to it".          */
/*                                                                     */
/* The frontmatter parser is deliberately small: these are flat        */
/* scalars plus two list-of-object blocks, not a YAML engine.          */
/* ------------------------------------------------------------------ */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const CONTENT = join(process.cwd(), 'src', 'content');
if (!existsSync(CONTENT)) {
  console.log('No content collections — data gate passes (skeleton only).');
  process.exit(0);
}

const KNOWLEDGE_COLLECTIONS = new Set(['specifications']);
const TAXONOMY_COLLECTIONS = new Set(['applications']);

/* Nullable content fields per record collection. Kept in sync with
   src/content.config.ts — a field added there must be added here, or the
   gate silently stops covering it. */
const NULLABLE_FIELDS = {
  products: [
    'product_type',
    'application',
    'raw_material',
    'charcoal_source',
    'shape',
    'size',
    'length',
    'width',
    'height',
    'diameter',
    'ash_content',
    'moisture',
    'fixed_carbon',
    'volatile_matter',
    'burning_time',
    'ignition_time',
    'odor',
    'spark_level',
    'temperature',
    'calorific_value',
    'packaging',
    'private_label',
    'minimum_order_quantity',
    'production_capacity',
    'testing_available',
    'certifications',
    'origin',
    'manufacturer_id',
  ],
  sizes: ['diameter_mm', 'typical_products', 'pieces_per_kg', 'tolerance'],
};

const MIN_REASON = 15;

/* Keys whose value is a YAML list of strings. */
const LIST_KEYS = new Set([
  'typical_products',
  'related_raw_materials',
  'related_specifications',
  'certifications',
]);

function readMdx(frontmatterText) {
  const fm = {};
  let lastKey = null;
  for (const line of frontmatterText.split('\n')) {
    if (/^\s/.test(line) || line.startsWith('-')) {
      const item = line.match(/^\s*-\s*"?(.+?)"?\s*$/);
      if (item && lastKey && LIST_KEYS.has(lastKey)) {
        if (!Array.isArray(fm[lastKey])) fm[lastKey] = [];
        fm[lastKey].push(item[1]);
      }
      continue;
    }
    const i = line.indexOf(':');
    if (i === -1) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    else if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
    fm[k] = v === '' || v === 'null' || v === '~' ? null : v;
    lastKey = k;
  }
  return fm;
}

/* Pull the `field:` values out of the pending_fields / not_applicable
   blocks. Both are lists of { field, reason } objects. */
function readFieldLists(frontmatterText) {
  const out = { pending_fields: [], not_applicable: [] };
  let section = null;
  for (const line of frontmatterText.split('\n')) {
    if (/^(pending_fields|not_applicable):/.test(line)) {
      section = line.slice(0, line.indexOf(':')).trim();
      continue;
    }
    if (section && /^[A-Za-z_][A-Za-z0-9_]*:/.test(line)) {
      section = null;
      continue;
    }
    if (!section) continue;
    const m = line.match(/^\s*-?\s*field:\s*"?([A-Za-z0-9_]+)"?\s*$/);
    const r = line.match(/^\s*-?\s*reason:\s*"?(.+?)"?\s*$/);
    if (m) out[section].push({ field: m[1], reason: null });
    else if (r && out[section].length) {
      out[section][out[section].length - 1].reason = r[1];
    }
  }
  return out;
}

function extractFrontmatter(raw) {
  if (!raw.startsWith('---')) return null;
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return null;
  return raw.slice(3, end);
}

let errors = 0;
const cols = readdirSync(CONTENT).filter((e) => statSync(join(CONTENT, e)).isDirectory());

for (const col of cols) {
  const dir = join(CONTENT, col);
  const entries = readdirSync(dir).filter((e) => extname(e) === '.md' || extname(e) === '.mdx');
  const ids = new Set();
  const fmList = [];

  for (const e of entries) {
    const raw = readFileSync(join(dir, e), 'utf8');
    const fmText = extractFrontmatter(raw);
    const fm = fmText ? readMdx(fmText) : {};
    const lists = fmText ? readFieldLists(fmText) : { pending_fields: [], not_applicable: [] };
    const id =
      fm.product_id || fm.manufacturer_id || fm.test_type || fm.report_id || fm.slug || basename(e, extname(e));
    if (ids.has(id)) {
      console.error(`[${col}] duplicate id: ${id}`);
      errors++;
    }
    ids.add(id);
    fm._id = id;
    fm._pending = lists.pending_fields;
    fm._na = lists.not_applicable;
    fm._file = e;
    fmList.push(fm);
  }

  const productIds = new Set(fmList.filter((f) => f.product_id).map((f) => f.product_id));
  const manDir = join(CONTENT, 'manufacturers');
  const manIds = new Set(
    (existsSync(manDir) ? readdirSync(manDir) : [])
      .filter((e) => extname(e) === '.md' || extname(e) === '.mdx')
      .map((e) => basename(e, extname(e)))
  );

  for (const f of fmList) {
    if (f.manufacturer_id && !ids.has(f.manufacturer_id) && !productIds.has(f.manufacturer_id)) {
      if (!manIds.has(f.manufacturer_id)) {
        console.error(`[${col}/${f._id}] broken manufacturer_id ref: ${f.manufacturer_id}`);
        errors++;
      }
    }

    /* Provenance, by collection kind. */
    if (!f.data_source) {
      console.error(`[${col}/${f._id}] missing data_source`);
      errors++;
    }
    if (KNOWLEDGE_COLLECTIONS.has(col) || TAXONOMY_COLLECTIONS.has(col)) {
      if (!f.last_updated) {
        console.error(`[${col}/${f._id}] missing last_updated`);
        errors++;
      }
    } else {
      if (!f.verification_status) {
        console.error(`[${col}/${f._id}] missing verification_status`);
        errors++;
      }
      if (!f.last_verified) {
        console.error(`[${col}/${f._id}] missing last_verified`);
        errors++;
      }
    }

    /* Every empty field needs a stated reason. */
    const nullable = NULLABLE_FIELDS[col];
    if (nullable) {
      const covered = new Set();
      for (const p of f._pending) {
        if (!nullable.includes(p.field)) {
          console.error(`[${col}/${f._id}] pending_fields names unknown field: ${p.field}`);
          errors++;
        }
        if (covered.has(p.field)) {
          console.error(`[${col}/${f._id}] pending_fields duplicates field: ${p.field}`);
          errors++;
        }
        if (!p.reason || p.reason.length < MIN_REASON) {
          console.error(`[${col}/${f._id}] pending_fields/${p.field} needs a reason of ${MIN_REASON}+ characters`);
          errors++;
        }
        covered.add(p.field);
      }
      for (const n of f._na) {
        if (!nullable.includes(n.field)) {
          console.error(`[${col}/${f._id}] not_applicable names unknown field: ${n.field}`);
          errors++;
        }
        if (covered.has(n.field)) {
          console.error(`[${col}/${f._id}] field listed in both pending_fields and not_applicable: ${n.field}`);
          errors++;
        }
        if (!n.reason || n.reason.length < MIN_REASON) {
          console.error(`[${col}/${f._id}] not_applicable/${n.field} needs a reason of ${MIN_REASON}+ characters`);
          errors++;
        }
        covered.add(n.field);
      }
      for (const field of nullable) {
        const empty = f[field] === undefined || f[field] === null;
        if (empty && !covered.has(field)) {
          console.error(`[${col}/${f._id}] empty field with no status: ${field}`);
          errors++;
        }
        if (!empty && covered.has(field)) {
          console.error(`[${col}/${f._id}] field has a value but is marked empty: ${field}`);
          errors++;
        }
      }
    }
  }
}

if (errors) {
  console.error(`\n${errors} data quality issue(s).`);
  process.exit(1);
}
console.log('Data quality gate passed. ✔');
