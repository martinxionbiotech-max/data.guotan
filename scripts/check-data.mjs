#!/usr/bin/env node
/* ------------------------------------------------------------------ */
/* check-data.mjs — data quality gate for content collections.         */
/* Where a site defines collections (src/content/), validates:         */
/*   - duplicate IDs across a collection                               */
/*   - missing required fields (schema-required at build already)       */
/*   - broken internal references (manufacturer_id, product_id)         */
/*   - missing provenance fields, by collection kind:                   */
/*       record collections    -> data_source, verification_status,     */
/*                                last_verified                         */
/*       knowledge collections -> data_source, last_updated             */
/*                                                                      */
/* Knowledge collections (methodology/explainer pages) are public        */
/* standard write-ups, not supplier records: they carry a public         */
/* data_source and a last_updated date, and are not expected to carry    */
/* supplier verification fields.                                        */
/* Sites with no collections pass trivially.                           */
/* ------------------------------------------------------------------ */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const CONTENT = join(process.cwd(), 'src', 'content');
if (!existsSync(CONTENT)) {
  console.log('No content collections — data gate passes (skeleton only).');
  process.exit(0);
}

const KNOWLEDGE_COLLECTIONS = new Set(['specifications']);

function readMdx(frontmatterText) {
  const fm = {};
  for (const line of frontmatterText.split('\n')) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    else if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
    fm[k] = v;
  }
  return fm;
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
    const id = fm.product_id || fm.manufacturer_id || fm.test_type || fm.report_id || fm.slug || basename(e, extname(e));
    if (ids.has(id)) {
      console.error(`[${col}] duplicate id: ${id}`);
      errors++;
    }
    ids.add(id);
    fm._id = id;
    fmList.push(fm);
  }

  // references: manufacturer_id / product_id must resolve in sibling collections
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

    // provenance fields — kind-dependent
    if (!f.data_source) {
      console.error(`[${col}/${f._id}] missing data_source`);
      errors++;
    }
    if (KNOWLEDGE_COLLECTIONS.has(col)) {
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
  }
}

if (errors) {
  console.error(`\n${errors} data quality issue(s).`);
  process.exit(1);
}
console.log('Data quality gate passed. ✔');
