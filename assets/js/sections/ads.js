import { af, esc, inline, slate } from '../core/format.js';

export function render(d, ctx) {
  const { sc } = ctx;
  const del = d.deliverables || {};
  return `
<section class="ads" id="${esc(d.id || 'ads')}" aria-labelledby="ads-title">
  <div class="wrap ads__grid">
    <header class="ads__head">
      ${slate(d.slate, sc, '', ctx)}
      <h2 id="ads-title" class="h-display"${af(ctx, 'title', d.title, { multiline: true })}>${inline(d.title)}</h2>
      <p${af(ctx, 'text', d.text)}>${inline(d.text)}</p>
      ${d.credits ? `<p class="ads__credits"${af(ctx, 'credits', d.credits)}>${inline(d.credits)}</p>` : ''}
      ${d.logos ? `<p class="ads__logos"${af(ctx, 'logos', d.logos)}>${inline(d.logos)}</p>` : ''}
    </header>
    <div class="deliverables">
      <h3 class="deliverables__title"${af(ctx, 'deliverables.title', del.title)}>${esc(del.title)}</h3>
      <ul class="deliverables__list">
        ${(del.items || []).map((t, i) => `<li><span class="tick" aria-hidden="true"></span><span${af(ctx, `deliverables.items.${i}`, t)}>${inline(t)}</span></li>`).join('')}
      </ul>
      ${del.note ? `<p class="deliverables__note"${af(ctx, 'deliverables.note', del.note)}>${inline(del.note)}</p>` : ''}
    </div>
  </div>
</section>`;
}
