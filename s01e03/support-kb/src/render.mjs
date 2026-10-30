import fs from 'node:fs';
import path from 'node:path';
import { render } from 'svelte/server';
import { deskRef } from '#lib/kb/desk-ref';

const pages = import.meta.glob('/src/routes/kb/**/+page.svx', { eager: true });
const root = path.resolve('rendered');
fs.mkdirSync(root, { recursive: true });
for (const [source, page] of Object.entries(pages)) {
  const route = source.replace('/src/routes/', '').replace('/+page.svx', '');
  const result = render(page.default);
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${result.head}</head>
<body>${result.body}</body></html>\n`;
  const target = path.join(root, route, 'index.html');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html);
  console.log(`Rendered /${route}: ${Buffer.byteLength(html)} bytes`);
  if (route.endsWith('/4471-review')) {
    const expected = deskRef(page.metadata.signature);
    if (!html.includes(expected)) throw new Error('Missing computed RenderStamp');
    for (const count of [379, 33, 412]) {
      if (!html.includes(`>${count}<`)) throw new Error(`Missing computed report count ${count}`);
    }
    fs.writeFileSync(path.join(root, 'review-manifest.json'), JSON.stringify({
      source,
      rendered: path.relative(root, target),
      signature: page.metadata.signature,
      deskRef: expected,
      snapshot: '2026-10-04',
      renderedAt: new Date().toISOString(),
    }, null, 2) + '\n');
  }
}
