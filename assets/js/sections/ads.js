import { esc, inline, slate } from '../core/format.js';

export function render(d, { sc }) {
  const del = d.deliverables || {};
  return `
<section class="ads" id="${esc(d.id || 'ads')}" aria-labelledby="ads-title">
  <div class="wrap ads__grid">
    <header class="ads__head">
      ${slate(d.slate, sc)}
      <h2 id="ads-title" class="h-display">${inline(d.title)}</h2>
      <p>${inline(d.text)}</p>
      ${d.credits ? `<p class="ads__credits">${inline(d.credits)}</p>` : ''}
      ${d.logos ? `<p class="ads__logos">${inline(d.logos)}</p>` : ''}
    </header>
    <div class="deliverables">
      <h3 class="deliverables__title">${esc(del.title)}</h3>
      <ul class="deliverables__list">
        ${(del.items || []).map((t) => `<li><span class="tick" aria-hidden="true"></span><span>${inline(t)}</span></li>`).join('')}
      </ul>
      ${del.note ? `<p class="deliverables__note">${inline(del.note)}</p>` : ''}
    </div>
  </div>
</section>`;
}
