import { af, esc, inline, key, slate } from '../core/format.js';

export function render(d, ctx) {
  const { sc } = ctx;
  return `
<section class="faq" id="${esc(d.id || 'faq')}" aria-labelledby="faq-title">
  <div class="wrap faq__grid">
    <header class="faq__head">
      ${slate(d.slate, sc, 'ink', ctx)}
      <h2 id="faq-title" class="h-display"${af(ctx, 'title', d.title)}>${esc(d.title)}</h2>
    </header>
    <div class="faq__list">
      ${(d.items || [])
        .map((it, i) => `
      <details>
        <summary${af(ctx, `items.${key(it, i)}.q`, it.q)}>${esc(it.q)}</summary>
        <div><p${af(ctx, `items.${key(it, i)}.a`, it.a)}>${inline(it.a)}</p></div>
      </details>`)
        .join('')}
    </div>
  </div>
</section>`;
}
