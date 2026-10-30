import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { stripTypeScriptTypes } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const lib = path.join(here, 'support-kb/src/lib');
const load = (name) => JSON.parse(fs.readFileSync(path.join(lib, name), 'utf8'));
const causes = await import(
  `data:text/javascript;base64,${Buffer.from(
    stripTypeScriptTypes(fs.readFileSync(path.join(lib, 'kb/causes.ts'), 'utf8')),
  ).toString('base64')}`
);
const raw = load('data/reports-4471.json');
const tenants = fs.readdirSync(path.join(lib, 'data/tenants'))
  .map((name) => load(`data/tenants/${name}`));
const tenantOf = (r) => tenants.find((t) => t.handle === r.tenant);
const unique = causes.uniqueById(raw).filter((r) => r.mergedInto === 4471);
const groups = causes.groupByCause(unique, tenantOf);
const notes = load('data/desk-notes.json');
const summary = {
  source: 'kb-export-267efc5e.zip',
  snapshot: '2026-10-04',
  rawRows: raw.length,
  uniqueReports: unique.length,
  overlappingRows: raw.length - unique.length,
  groups: groups.map((g) => ({
    cause: g.cause,
    count: g.reports.length,
    tenants: [...new Set(g.reports.map((r) => r.tenant))].sort(),
    channels: Object.fromEntries(['app', 'email', 'form']
      .map((ch) => [ch, g.reports.filter((r) => r.channel === ch).length])),
    taggedAs: g.taggedAs,
    firstSeen: g.firstSeen,
    lastSeen: g.lastSeen,
    oneDayMoveNotes: g.reports.filter((r) => notes.oneDayMove.includes(r.id)).map((r) => r.id),
    reportIds: g.reports.map((r) => r.id),
  })),
  mergeBatch20260702: unique.filter((r) => r.mergedAt?.startsWith('2026-07-02')).length,
};
assert.equal(summary.rawRows, 427);
assert.equal(summary.uniqueReports, 412);
assert.equal(groups.find((g) => g.cause === 'parser')?.reports.length, 379);
assert.equal(groups.find((g) => g.cause === 'hint')?.reports.length, 33);
assert.equal(groups.reduce((sum, g) => sum + g.reports.length, 0), unique.length);
assert.equal(groups.some((g) => g.cause === 'unplaced'), false);
assert.equal(summary.mergeBatch20260702, 184);
fs.writeFileSync(path.join(here, 'analysis.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ ...summary, groups: summary.groups.map(({ reportIds, ...g }) => g) }, null, 2));
