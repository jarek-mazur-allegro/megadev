<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { groupByCause, uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';

  const unique = uniqueById(reports as Report[]).filter((r) => r.mergedInto === 4471);
  const groups = groupByCause(unique, tenantOf);
  const mismatches = groups.reduce((sum, g) =>
    sum + g.reports.filter((r) => r.meta.intakeTag !== g.cause).length, 0);
  const oneDay = unique.filter((r) => notes.oneDayMove.includes(r.id));
  const batch = unique.filter((r) => r.mergedAt?.startsWith('2026-07-02'));
  const old = batch.filter((r) => r.receivedAt.slice(0, 10) < '2026-07-02');
  const ageInDays = (r: Report) =>
    Math.floor((Date.parse(r.mergedAt!) - Date.parse(r.receivedAt)) / 86_400_000);
  const maxDelay = Math.max(...unique.filter((r) => r.mergedAt).map(ageInDays));
</script>

<section aria-label="Count reconciliation">
  <h2>Count the reports, not the export rows</h2>
  <p>
    The 2026-10-04 snapshot contains <strong>{reports.length}</strong> export rows but
    <strong>{unique.length}</strong> unique reports merged into #4471.
    There are <strong>{reports.length - unique.length}</strong> overlapping export rows.
    Run <code>uniqueById</code> before grouping. The cause groups contain
    <strong>{groups.reduce((n, g) => n + g.reports.length, 0)}</strong> reports in total.
  </p>
  <table>
    <caption>Separate engineering issues, computed from tenant locale and form</caption>
    <thead><tr><th>cause</th><th>reports</th><th>app</th><th>email</th><th>form</th><th>engineering issue</th></tr></thead>
    <tbody>
      {#each groups as g (g.cause)}
        <tr>
          <th scope="row">{g.cause}</th>
          <td>{g.reports.length}</td>
          {#each ['app', 'email', 'form'] as channel (channel)}
            <td>{g.reports.filter((r) => r.channel === channel).length}</td>
          {/each}
          <td>
            {#if g.cause === 'parser'}
              <a href="https://github.com/jarek-mazur-allegro/megadev/issues/1">#1: shared parser</a>
            {:else if g.cause === 'hint'}
              <a href="https://github.com/jarek-mazur-allegro/megadev/issues/2">#2: booking-v3 hint</a>
            {:else}
              Unplaced: investigate before merging
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
  <p>
    <strong>{mismatches}</strong> reports have an intake tag that disagrees with the supplied
    cause classifier. Browser locale and intake tags are not a replacement for the tenant directory.
  </p>
</section>

<section aria-label="Merge timing">
  <h2>Received is not merged</h2>
  <p>
    On 2026-07-02 the desk merged <strong>{batch.length}</strong> reports into #4471;
    <strong>{old.length}</strong> of those had arrived before that day.
    The longest receipt-to-merge delay in this export is
    <strong>{maxDelay}</strong> complete elapsed days.
    A merge spike measures desk processing, not the day the underlying bug started.
    Use <code>receivedAt</code> for arrivals and <code>mergedAt</code> for merging.
  </p>
</section>

<section aria-label="Unresolved observations">
  <h2>Keep the conflicting observations visible</h2>
  <p>
    The desk marked <strong>{oneDay.length}</strong> reports as reading like a one-day move.
    The supplied classifier places them in the parser group. That is a classification rule,
    not proof that every one-day symptom has been causally explained.
    Preserve the observations for follow-up; do not invent a third proven timezone defect
    or silently remove them from the counts.
  </p>
  <ul>
    {#each oneDay as r (r.id)}
      <li><code>{r.id}</code> · {r.tenant} · {r.channel}: {r.body}</li>
    {/each}
  </ul>
</section>
