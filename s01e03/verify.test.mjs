import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';
import assert from 'node:assert/strict';
import test from 'node:test';

const here = path.dirname(fileURLToPath(import.meta.url));
const lib = path.join(here, 'support-kb/src/lib');
const json = (p) => JSON.parse(fs.readFileSync(path.join(here, p), 'utf8'));
const loadTs = (p) => import(`data:text/javascript;base64,${Buffer.from(
  stripTypeScriptTypes(fs.readFileSync(path.join(lib, p), 'utf8')),
).toString('base64')}`);
const causes = await loadTs('kb/causes.ts');
const { DEDUPE_CASES } = await loadTs('kb/dedupe-cases.ts');
const { deskRef } = await loadTs('kb/desk-ref.ts');
const raw = json('support-kb/src/lib/data/reports-4471.json');
const tenants = fs.readdirSync(path.join(lib, 'data/tenants'))
  .map((name) => json(`support-kb/src/lib/data/tenants/${name}`));
const tenantOf = (r) => tenants.find((t) => t.handle === r.tenant);
const unique = causes.uniqueById(raw).filter((r) => r.mergedInto === 4471);
const groups = causes.groupByCause(unique, tenantOf);

test('all original export files are unchanged', () => {
  const manifest = json('source-manifest.json');
  assert.equal(Object.keys(manifest.files).length, 30);
  for (const [name, digest] of Object.entries(manifest.files)) {
    assert.equal(createHash('sha256').update(fs.readFileSync(path.join(here, name))).digest('hex'), digest, name);
  }
});

test('overlapping export rows are identical and deduplicate to 412 reports', () => {
  assert.equal(raw.length, 427);
  assert.equal(unique.length, 412);
  const previous = new Map();
  for (const r of raw) {
    if (previous.has(r.id)) assert.deepEqual(r, previous.get(r.id));
    previous.set(r.id, r);
  }
});

test('two known causes partition all reports without double counting', () => {
  assert.deepEqual(groups.map((g) => [g.cause, g.reports.length]), [['parser', 379], ['hint', 33]]);
  assert.equal(new Set(groups.flatMap((g) => g.reports.map((r) => r.id))).size, 412);
  assert.equal(groups.reduce((sum, g) => sum + g.reports.length, 0), 412);
  assert.equal(causes.ticketCause(groups, 4471), 'parser');
});

test('intake-tag mismatch and one-day observations remain explicit', () => {
  assert.equal(groups.reduce((n, g) => n + g.reports.filter((r) => r.meta.intakeTag !== g.cause).length, 0), 38);
  const notes = json('support-kb/src/lib/data/desk-notes.json');
  assert.equal(causes.readAs(groups[0], notes.oneDayMove), 5);
  assert.equal(causes.readAs(groups[1], notes.oneDayMove), 0);
});

test('all supplied duplicate examples use cause, not subject equality', () => {
  assert.deepEqual(DEDUPE_CASES.map((c) => causes.sameCause(c.a, tenantOf(c.a), c.b, tenantOf(c.b))),
    [true, false, false, true, false]);
});

test('rendered page has its computed stamp, counts, links and timeline', () => {
  const manifest = json('support-kb/rendered/review-manifest.json');
  const html = fs.readFileSync(path.join(here, 'support-kb/rendered', manifest.rendered), 'utf8');
  const source = fs.readFileSync(path.join(here, 'support-kb', manifest.source.replace(/^\/src\//, 'src/')), 'utf8');
  const signature = source.match(/^signature: '([^']+)'$/m)?.[1];
  assert.ok(signature && /^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(signature), 'Page uses the course-issued ticket');
  assert.equal(manifest.signatureSource, 'page frontmatter');
  assert.equal(manifest.deskRef, deskRef(signature));
  assert.ok(html.includes(manifest.deskRef));
  assert.ok(!html.includes(signature), 'Rendered HTML shows only the derived desk reference');
  assert.ok(!Object.hasOwn(manifest, 'signature'), 'Manifest does not duplicate the ticket');
  for (const count of [379, 33, 412]) assert.ok(html.includes(`>${count}<`));
  for (const issue of [1, 2]) assert.ok(html.includes(`https://github.com/jarek-mazur-allegro/megadev/issues/${issue}`));
  assert.ok(html.includes('<svg'));
  assert.ok(html.includes('2026-10-04 export'));
  assert.ok(html.includes('2026-10-30'));
  assert.ok(!html.includes('no desk ref:'));
});

test('public lockfile contains no private registry or URL credentials', () => {
  for (const p of Object.values(json('support-kb/package-lock.json').packages)) {
    if (!p.resolved) continue;
    const url = new URL(p.resolved);
    assert.equal(url.hostname, 'registry.npmjs.org');
    assert.equal(url.username + url.password + url.search, '');
  }
});
