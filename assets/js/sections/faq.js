import { esc, inline, slate } from '../core/format.js';

export function render(d, { sc }) {
  return `
<section class="faq" id="${esc(d.id || 'faq')}" aria-labelledby="faq-title">
  <div class="wrap faq__grid">
    <header class="faq__head">
      ${slate(d.slate, sc, 'ink')}
      <h2 id="faq-title" class="h-display">${esc(d.title)}</h2>
    </header>
    <div class="faq__list">
      ${(d.items || [])
        .map((it) => `
      <details>
        <summary>${esc(it.q)}</summary>
        <div><p>${inline(it.a)}</p></div>
      </details>`)
        .join('')}
    </div>
  </div>
</section>`;
}
