import { esc, inline, slate } from '../core/format.js';

export function render(d, { sc }) {
  const items = (d.items || [])
    .map(
      (it, i) => `
    <li class="door">
      <a class="door__link" href="${esc(it.href)}">
        <span class="door__num" dir="ltr">${String(i + 1).padStart(2, '0')}</span>
        <span class="door__title">${esc(it.title)}</span>
        <span class="door__text">${inline(it.text)}</span>
        <span class="door__formats" dir="ltr">${esc(it.formats)}</span>
      </a>
    </li>`
    )
    .join('');

  return `
<section class="doors" id="${esc(d.id || 'services')}" aria-labelledby="doors-title">
  <div class="wrap">
    <header class="section-head">
      ${slate(d.slate, sc)}
      <h2 id="doors-title" class="visually-hidden">${esc(d.title)}</h2>
    </header>
    <ol class="doors__list">${items}</ol>
  </div>
</section>`;
}
