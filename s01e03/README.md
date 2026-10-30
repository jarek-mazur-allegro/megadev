# S01E03 — what it shows

This review uses the supplied **2026-10-04 KB export**. It is not a claim about the live support queue.

## Deliverables

- [Parser issue: 379 reports](https://github.com/jarek-mazur-allegro/megadev/issues/1).
- [booking-v3 hint issue: 33 reports](https://github.com/jarek-mazur-allegro/megadev/issues/2).
- Page source: `support-kb/src/routes/kb/incidents/4471-review/+page.svx`.
- Rendered page: `support-kb/rendered/kb/incidents/4471-review/index.html`.
- Page signature: the course-issued ticket in the page frontmatter; its full value is not duplicated here.
- Computed desk reference: `DR-9S3R-0SMJ`.

The rendered page is the actual Svelte/mdsvex server-rendered output, including the supplied layout, cause table, timeline and RenderStamp. It is not a Markdown-only approximation. Open the HTML locally, or use the local preview below. No public web host is required.

## Findings

The 427 export rows represent 412 unique IDs: 379 parser reports and 33 hint reports. Tenant locale, form version and channel determine the supplied classification; browser locale and intake tags do not.

Five reports have one-day-move notes but remain classified as parser reports. The review preserves that discrepancy without claiming a separately proven timezone bug.

The July merge batch is desk processing, not the beginning of the incident. The page distinguishes receipt time from merge time and snapshot age from review age.

All 30 original export files, including accepted decision 0001, are preserved byte-for-byte. This review proposes cause-based triage; it does not claim that the desk has accepted a replacement decision.

## Subsequent desk update

After the first submission accepted both tickets, the course revealed an engineering update: #4471 closed on 5 October 2026.

- Parser: fixed by `fix(dates): parse dd/mm for eu locales` — corresponding issue resolution: **completed**.
- Hint: won't fix because booking-v3 was retired — corresponding issue resolution: **not planned**, not completed.

The review page records these distinct outcomes and links their source. The counts remain the earlier export snapshot. This work does not claim to have patched or independently tested the production service.

## Reproduce

Requires Node.js 22.18 or newer and npm. From this directory:

```sh
node analyze.mjs
node --test verify.test.mjs
cd support-kb
npm ci --ignore-scripts
npm run build
npm run preview
```

Then open `http://127.0.0.1:4833/kb/incidents/4471-review/`.

The preview binds only to the local loopback interface. Rendered HTML is a read-only snapshot; controls on the original triage page are not hydrated. The new review page does not depend on interactive controls.

`analysis.json` includes the report-ID membership of each group. `source-manifest.json` records the archive digest and original-file digests. `issues.json` records the two verified issue URLs.
